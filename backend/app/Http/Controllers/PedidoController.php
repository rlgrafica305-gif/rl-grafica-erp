<?php

namespace App\Http\Controllers;

use App\Models\Pedido;
use App\Models\PedidoItem;
use App\Models\ContaReceber;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PedidoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Pedido::with(['cliente:id,nome,whatsapp', 'vendedor:id,name'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->cliente_id, fn($q) => $q->where('cliente_id', $request->cliente_id))
            ->when($request->busca, function ($q) use ($request) {
                $q->where('numero', 'like', "%{$request->busca}%")
                  ->orWhereHas('cliente', fn($c) => $c->where('nome', 'like', "%{$request->busca}%"));
            })
            ->when($request->atrasados, fn($q) => $q->atrasados())
            ->orderByDesc('created_at');

        if ($request->user()->role === 'vendedor') {
            $query->where('vendedor_id', $request->user()->id);
        }

        return response()->json($query->paginate($request->get('per_page', 20)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'cliente_id'          => 'required|exists:clientes,id',
            'forma_pagamento'     => 'required|string',
            'prazo_entrega'       => 'nullable|date',
            'desconto_percentual' => 'numeric|min:0|max:100',
            'desconto_valor'      => 'numeric|min:0',
            'observacoes'         => 'nullable|string',
            'endereco_entrega'    => 'nullable|string',
            'itens'               => 'required|array|min:1',
            'itens.*.produto_id'  => 'nullable|exists:produtos,id',
            'itens.*.descricao'   => 'required|string',
            'itens.*.quantidade'  => 'required|numeric|min:0.01',
            'itens.*.preco_unitario' => 'required|numeric|min:0',
            'itens.*.largura'     => 'nullable|numeric',
            'itens.*.altura'      => 'nullable|numeric',
            'itens.*.cor'         => 'nullable|string',
            'itens.*.acabamento'  => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $pedido = Pedido::create([
                'numero'             => Pedido::gerarNumero(),
                'cliente_id'         => $data['cliente_id'],
                'vendedor_id'        => $request->user()->id,
                'status'             => 'recebido',
                'forma_pagamento'    => $data['forma_pagamento'],
                'prazo_entrega'      => $data['prazo_entrega'] ?? now()->addDays(3)->toDateString(),
                'desconto_percentual'=> $data['desconto_percentual'] ?? 0,
                'desconto_valor'     => $data['desconto_valor'] ?? 0,
                'observacoes'        => $data['observacoes'] ?? null,
                'endereco_entrega'   => $data['endereco_entrega'] ?? null,
            ]);

            foreach ($data['itens'] as $i => $item) {
                PedidoItem::create([...$item, 'pedido_id' => $pedido->id, 'ordem' => $i]);
            }

            $pedido->recalcularTotal();
            $pedido->mudarStatus('recebido', $request->user(), 'Pedido criado.');
            DB::commit();

            return response()->json($pedido->load(['cliente', 'vendedor:id,name', 'itens.produto']), 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function show(Pedido $pedido): JsonResponse
    {
        return response()->json(
            $pedido->load([
                'cliente',
                'vendedor:id,name',
                'itens.produto.categoria',
                'artes.designer:id,name',
                'artes.revisoes.autor:id,name',
                'producoes.operador:id,name',
                'historico.usuario:id,name',
                'contasReceber',
            ])
        );
    }

    public function update(Request $request, Pedido $pedido): JsonResponse
    {
        $data = $request->validate([
            'prazo_entrega'       => 'nullable|date',
            'forma_pagamento'     => 'nullable|string',
            'status_pagamento'    => 'nullable|in:pago,sinal_entrada,aguardando_pagamento',
            'desconto_percentual' => 'numeric|min:0|max:100',
            'desconto_valor'      => 'numeric|min:0',
            'observacoes'         => 'nullable|string',
            'endereco_entrega'    => 'nullable|string',
            'itens'               => 'array|min:1',
            'itens.*.produto_id'  => 'nullable|exists:produtos,id',
            'itens.*.descricao'   => 'required_with:itens|string',
            'itens.*.quantidade'  => 'required_with:itens|numeric|min:0.01',
            'itens.*.preco_unitario' => 'required_with:itens|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $pedido->update($data);

            if (isset($data['itens'])) {
                $pedido->itens()->delete();
                foreach ($data['itens'] as $i => $item) {
                    PedidoItem::create([...$item, 'pedido_id' => $pedido->id, 'ordem' => $i]);
                }
                $pedido->recalcularTotal();
            }

            DB::commit();
            return response()->json($pedido->load(['cliente', 'vendedor:id,name', 'itens.produto']));
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function mudarStatus(Request $request, Pedido $pedido): JsonResponse
    {
        $statuses = ['recebido', 'aguardando_arte', 'aguardando_aprovacao', 'em_producao', 'finalizado', 'entregue', 'cancelado'];
        $data = $request->validate([
            'status'     => 'required|in:' . implode(',', $statuses),
            'observacao' => 'nullable|string',
        ]);

        if ($data['status'] === 'entregue') {
            $pedido->update(['entregue_em' => now()]);
        }

        $pedido->mudarStatus($data['status'], $request->user(), $data['observacao'] ?? null);

        return response()->json($pedido->load('historico.usuario:id,name'));
    }

    public function gerarContaReceber(Request $request, Pedido $pedido): JsonResponse
    {
        $data = $request->validate([
            'descricao'       => 'required|string',
            'valor'           => 'required|numeric|min:0.01',
            'vencimento'      => 'required|date',
            'forma_pagamento' => 'nullable|string',
            'parcela_numero'  => 'nullable|integer',
            'parcela_total'   => 'nullable|integer',
        ]);

        $conta = ContaReceber::create([
            ...$data,
            'pedido_id'  => $pedido->id,
            'cliente_id' => $pedido->cliente_id,
            'created_by' => $request->user()->id,
            'status'     => 'pendente',
        ]);

        return response()->json($conta, 201);
    }

    public function destroy(Pedido $pedido): JsonResponse
    {
        if (!in_array($pedido->status, ['cancelado', 'recebido'])) {
            return response()->json(['message' => 'Apenas pedidos recebidos ou cancelados podem ser excluídos.'], 422);
        }
        $pedido->delete();
        return response()->json(null, 204);
    }
}
