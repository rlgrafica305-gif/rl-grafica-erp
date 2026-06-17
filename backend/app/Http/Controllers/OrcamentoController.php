<?php

namespace App\Http\Controllers;

use App\Models\Orcamento;
use App\Models\OrcamentoItem;
use App\Models\Pedido;
use App\Models\PedidoItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class OrcamentoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Orcamento::with(['cliente:id,nome,whatsapp', 'vendedor:id,name'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->cliente_id, fn($q) => $q->where('cliente_id', $request->cliente_id))
            ->when($request->busca, fn($q) => $q->whereHas('cliente', fn($c) => $c->where('nome', 'like', "%{$request->busca}%")))
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
            'validade'            => 'nullable|date|after:today',
            'desconto_percentual' => 'numeric|min:0|max:100',
            'desconto_valor'      => 'numeric|min:0',
            'observacoes'         => 'nullable|string',
            'condicoes_pagamento' => 'nullable|string',
            'itens'               => 'required|array|min:1',
            'itens.*.produto_id'  => 'nullable|exists:produtos,id',
            'itens.*.descricao'   => 'required|string',
            'itens.*.quantidade'  => 'required|numeric|min:0.01',
            'itens.*.preco_unitario' => 'required|numeric|min:0',
            'itens.*.largura'     => 'nullable|numeric',
            'itens.*.altura'      => 'nullable|numeric',
            'itens.*.cor'         => 'nullable|string',
            'itens.*.acabamento'  => 'nullable|string',
            'itens.*.papel_material' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $orcamento = Orcamento::create([
                'numero'             => Orcamento::gerarNumero(),
                'cliente_id'         => $data['cliente_id'],
                'vendedor_id'        => $request->user()->id,
                'status'             => 'pendente',
                'validade'           => $data['validade'] ?? now()->addDays(7)->toDateString(),
                'desconto_percentual'=> $data['desconto_percentual'] ?? 0,
                'desconto_valor'     => $data['desconto_valor'] ?? 0,
                'observacoes'        => $data['observacoes'] ?? null,
                'condicoes_pagamento'=> $data['condicoes_pagamento'] ?? null,
            ]);

            foreach ($data['itens'] as $i => $item) {
                OrcamentoItem::create([...$item, 'orcamento_id' => $orcamento->id, 'ordem' => $i]);
            }

            $orcamento->recalcularTotal();
            DB::commit();

            return response()->json($orcamento->load(['cliente', 'vendedor:id,name', 'itens.produto']), 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function show(Orcamento $orcamento): JsonResponse
    {
        return response()->json($orcamento->load(['cliente', 'vendedor:id,name', 'itens.produto.categoria']));
    }

    public function update(Request $request, Orcamento $orcamento): JsonResponse
    {
        if ($orcamento->status === 'convertido') {
            return response()->json(['message' => 'Orçamento já convertido em pedido.'], 422);
        }

        $data = $request->validate([
            'validade'            => 'nullable|date',
            'desconto_percentual' => 'numeric|min:0|max:100',
            'desconto_valor'      => 'numeric|min:0',
            'observacoes'         => 'nullable|string',
            'condicoes_pagamento' => 'nullable|string',
            'itens'               => 'array|min:1',
            'itens.*.id'          => 'nullable|exists:orcamento_itens,id',
            'itens.*.produto_id'  => 'nullable|exists:produtos,id',
            'itens.*.descricao'   => 'required|string',
            'itens.*.quantidade'  => 'required|numeric|min:0.01',
            'itens.*.preco_unitario' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $orcamento->update($data);

            if (isset($data['itens'])) {
                $orcamento->itens()->delete();
                foreach ($data['itens'] as $i => $item) {
                    OrcamentoItem::create([...$item, 'orcamento_id' => $orcamento->id, 'ordem' => $i]);
                }
            }

            $orcamento->recalcularTotal();
            DB::commit();

            return response()->json($orcamento->load(['cliente', 'vendedor:id,name', 'itens.produto']));
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function converterEmPedido(Request $request, Orcamento $orcamento): JsonResponse
    {
        if ($orcamento->status === 'convertido') {
            return response()->json(['message' => 'Orçamento já foi convertido.'], 422);
        }

        $data = $request->validate([
            'forma_pagamento' => 'required|string',
            'prazo_entrega'   => 'nullable|date',
            'observacoes'     => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $pedido = Pedido::create([
                'numero'          => Pedido::gerarNumero(),
                'cliente_id'      => $orcamento->cliente_id,
                'orcamento_id'    => $orcamento->id,
                'vendedor_id'     => $orcamento->vendedor_id,
                'status'          => 'recebido',
                'forma_pagamento' => $data['forma_pagamento'],
                'prazo_entrega'   => $data['prazo_entrega'] ?? now()->addDays(3)->toDateString(),
                'subtotal'        => $orcamento->subtotal,
                'desconto_percentual' => $orcamento->desconto_percentual,
                'desconto_valor'  => $orcamento->desconto_valor,
                'total'           => $orcamento->total,
                'observacoes'     => $data['observacoes'] ?? $orcamento->observacoes,
            ]);

            foreach ($orcamento->itens as $item) {
                PedidoItem::create([
                    'pedido_id'      => $pedido->id,
                    'produto_id'     => $item->produto_id,
                    'descricao'      => $item->descricao,
                    'quantidade'     => $item->quantidade,
                    'largura'        => $item->largura,
                    'altura'         => $item->altura,
                    'cor'            => $item->cor,
                    'acabamento'     => $item->acabamento,
                    'papel_material' => $item->papel_material,
                    'preco_unitario' => $item->preco_unitario,
                    'subtotal'       => $item->subtotal,
                ]);
            }

            $orcamento->update(['status' => 'convertido', 'aprovado_em' => now()]);

            DB::commit();
            return response()->json($pedido->load(['cliente', 'itens.produto']), 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function mudarStatus(Request $request, Orcamento $orcamento): JsonResponse
    {
        $data = $request->validate(['status' => 'required|in:pendente,enviado,aprovado,rejeitado,expirado']);
        $orcamento->update(['status' => $data['status']]);
        return response()->json($orcamento);
    }

    public function destroy(Orcamento $orcamento): JsonResponse
    {
        if ($orcamento->status === 'convertido') {
            return response()->json(['message' => 'Não é possível excluir orçamento convertido.'], 422);
        }
        $orcamento->delete();
        return response()->json(null, 204);
    }
}
