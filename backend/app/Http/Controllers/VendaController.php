<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Pedido;
use App\Models\PedidoItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class VendaController extends Controller
{
    /** Busca rápida de clientes (usada no campo de busca da Venda Rápida) */
    public function buscarCliente(Request $request): JsonResponse
    {
        $q = $request->get('q', '');
        if (strlen($q) < 2) {
            return response()->json([]);
        }

        $clientes = Cliente::where('active', true)
            ->busca($q)
            ->orderBy('nome')
            ->limit(10)
            ->get(['id', 'nome', 'telefone', 'whatsapp', 'email', 'cpf_cnpj']);

        return response()->json($clientes);
    }

    /** Converte forma de pagamento legível para o valor do enum do banco */
    private function normalizarFormaPagamento(string $forma): string
    {
        $mapa = [
            'dinheiro'           => 'dinheiro',
            'pix'                => 'pix',
            'cartão de crédito'  => 'cartao_credito',
            'cartao de credito'  => 'cartao_credito',
            'cartão de débito'   => 'cartao_debito',
            'cartao de debito'   => 'cartao_debito',
            'boleto'             => 'boleto',
            'transferência'      => 'transferencia',
            'transferencia'      => 'transferencia',
            'a prazo'            => 'a_prazo',
        ];
        return $mapa[mb_strtolower(trim($forma))] ?? 'pix';
    }

    /** Registra uma venda rápida — cria cliente se necessário e gera o pedido */
    public function rapida(Request $request): JsonResponse
    {
        $request->validate([
            'cliente_id'            => 'nullable|exists:clientes,id',
            'cliente_novo'          => 'nullable|array',
            'cliente_novo.nome'     => 'required_without:cliente_id|string|max:255',
            'cliente_novo.telefone' => 'nullable|string|max:20',
            'cliente_novo.email'    => 'nullable|email|max:255',
            'forma_pagamento'       => 'required|string',
            'status_pagamento'      => 'nullable|in:pago,sinal_entrada,aguardando_pagamento',
            'prazo_entrega'         => 'nullable|date',
            'desconto_percentual'   => 'nullable|numeric|min:0|max:100',
            'observacoes'           => 'nullable|string',
            'itens'                 => 'required|array|min:1',
            'itens.*.descricao'     => 'required|string',
            'itens.*.quantidade'    => 'required|numeric|min:0.01',
            'itens.*.preco_unitario'=> 'required|numeric|min:0',
            'itens.*.custo_unitario'=> 'nullable|numeric|min:0',
            'itens.*.produto_id'    => 'nullable|exists:produtos,id',
        ]);

        if (!$request->filled('cliente_id') && empty($request->input('cliente_novo.nome'))) {
            return response()->json(['message' => 'Informe o cliente ou preencha os dados do novo cliente.'], 422);
        }

        DB::beginTransaction();
        try {
            // ── Resolve cliente ──────────────────────────────────────────────
            if ($request->filled('cliente_id')) {
                $clienteId = $request->cliente_id;
            } else {
                $novo = $request->input('cliente_novo');
                $existing = null;

                // 1) busca por telefone
                if (!empty($novo['telefone'])) {
                    $tel = preg_replace('/\D/', '', $novo['telefone']);
                    $existing = Cliente::whereRaw("REGEXP_REPLACE(telefone,'[^0-9]','') = ?", [$tel])
                        ->orWhereRaw("REGEXP_REPLACE(whatsapp,'[^0-9]','') = ?", [$tel])
                        ->first();
                }

                // 2) busca por nome (case-insensitive)
                if (!$existing && !empty($novo['nome'])) {
                    $existing = Cliente::whereRaw('LOWER(nome) = ?', [mb_strtolower(trim($novo['nome']))])->first();
                }

                if ($existing) {
                    $clienteId = $existing->id;
                } else {
                    $cliente = Cliente::create([
                        'nome'        => $novo['nome'],
                        'tipo_pessoa' => 'F',
                        'telefone'    => $novo['telefone'] ?? null,
                        'whatsapp'    => $novo['telefone'] ?? null,
                        'email'       => $novo['email']    ?? null,
                        'active'      => true,
                        'created_by'  => $request->user()->id,
                    ]);
                    $clienteId = $cliente->id;
                }
            }

            // ── Cria pedido ──────────────────────────────────────────────────
            $desconto  = (float) ($request->desconto_percentual ?? 0);
            $clienteObj = Cliente::find($clienteId);
            $telefone   = $clienteObj->telefone ?? $clienteObj->whatsapp ?? '';

            $pedido = Pedido::create([
                'numero'              => Pedido::gerarNumero($telefone),
                'cliente_id'          => $clienteId,
                'vendedor_id'         => $request->user()->id,
                'status'              => 'recebido',
                'forma_pagamento'     => $this->normalizarFormaPagamento($request->forma_pagamento),
                'status_pagamento'   => $request->status_pagamento ?? 'aguardando_pagamento',
                'prazo_entrega'       => $request->prazo_entrega ?? now()->addDays(3)->toDateString(),
                'desconto_percentual' => $desconto,
                'desconto_valor'      => 0,
                'observacoes'         => $request->observacoes ?? null,
            ]);

            foreach ($request->itens as $i => $item) {
                PedidoItem::create([
                    'pedido_id'       => $pedido->id,
                    'ordem'           => $i,
                    'descricao'       => $item['descricao'],
                    'quantidade'      => $item['quantidade'],
                    'preco_unitario'  => $item['preco_unitario'],
                    'custo_unitario'  => $item['custo_unitario'] ?? 0,
                    'produto_id'      => $item['produto_id'] ?? null,
                    'largura'         => $item['largura'] ?? null,
                    'altura'          => $item['altura'] ?? null,
                    'cor'             => $item['cor'] ?? null,
                    'acabamento'      => $item['acabamento'] ?? null,
                ]);
            }

            $pedido->recalcularTotal();
            $pedido->mudarStatus('recebido', $request->user(), 'Venda registrada.');

            DB::commit();

            return response()->json([
                'numero'          => $pedido->numero,
                'total'           => $pedido->total,
                'id'              => $pedido->id,
                'cliente_nome'    => $clienteObj->nome,
                'cliente_telefone'=> $clienteObj->whatsapp ?? $clienteObj->telefone ?? '',
                'itens'           => $pedido->itens->map(fn($i) => [
                    'descricao'  => $i->descricao,
                    'quantidade' => $i->quantidade,
                    'subtotal'   => $i->subtotal,
                ]),
                'forma_pagamento' => $request->forma_pagamento,
            ], 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erro ao registrar venda: ' . $e->getMessage()], 500);
        }
    }
}
