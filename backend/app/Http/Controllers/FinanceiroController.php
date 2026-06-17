<?php

namespace App\Http\Controllers;

use App\Models\ContaReceber;
use App\Models\ContaPagar;
use App\Models\MovimentacaoCaixa;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class FinanceiroController extends Controller
{
    // CONTAS A RECEBER
    public function indexReceber(Request $request): JsonResponse
    {
        $query = ContaReceber::with(['cliente:id,nome', 'pedido:id,numero', 'criador:id,name'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->cliente_id, fn($q) => $q->where('cliente_id', $request->cliente_id))
            ->when($request->vencimento_de, fn($q) => $q->where('vencimento', '>=', $request->vencimento_de))
            ->when($request->vencimento_ate, fn($q) => $q->where('vencimento', '<=', $request->vencimento_ate))
            ->orderBy('vencimento');

        return response()->json($query->paginate($request->get('per_page', 20)));
    }

    public function storeReceber(Request $request): JsonResponse
    {
        $data = $request->validate([
            'cliente_id'      => 'required|exists:clientes,id',
            'pedido_id'       => 'nullable|exists:pedidos,id',
            'descricao'       => 'required|string',
            'valor'           => 'required|numeric|min:0.01',
            'vencimento'      => 'required|date',
            'forma_pagamento' => 'nullable|string',
            'observacoes'     => 'nullable|string',
            'parcela_numero'  => 'nullable|integer',
            'parcela_total'   => 'nullable|integer',
        ]);

        $conta = ContaReceber::create([...$data, 'created_by' => $request->user()->id, 'status' => 'pendente']);
        return response()->json($conta->load(['cliente:id,nome', 'pedido:id,numero']), 201);
    }

    public function destroyReceber(ContaReceber $conta): JsonResponse
    {
        $conta->delete();
        return response()->json(null, 204);
    }

    public function receberPagamento(Request $request, ContaReceber $conta): JsonResponse
    {
        if ($conta->status === 'recebido') {
            return response()->json(['message' => 'Conta já foi recebida.'], 422);
        }

        $data = $request->validate([
            'valor_recebido'  => 'required|numeric|min:0.01',
            'forma_pagamento' => 'required|string',
        ]);

        $conta->receber($data['valor_recebido'], $data['forma_pagamento']);
        return response()->json($conta->fresh()->load(['cliente:id,nome']));
    }

    // CONTAS A PAGAR
    public function indexPagar(Request $request): JsonResponse
    {
        $query = ContaPagar::with(['fornecedor:id,nome', 'criador:id,name'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->categoria, fn($q) => $q->where('categoria', $request->categoria))
            ->when($request->vencimento_de, fn($q) => $q->where('vencimento', '>=', $request->vencimento_de))
            ->when($request->vencimento_ate, fn($q) => $q->where('vencimento', '<=', $request->vencimento_ate))
            ->orderBy('vencimento');

        return response()->json($query->paginate($request->get('per_page', 20)));
    }

    public function storePagar(Request $request): JsonResponse
    {
        $data = $request->validate([
            'fornecedor_id'   => 'nullable|exists:fornecedores,id',
            'descricao'       => 'required|string',
            'categoria'       => 'nullable|string',
            'valor'           => 'required|numeric|min:0.01',
            'vencimento'      => 'required|date',
            'forma_pagamento' => 'nullable|string',
            'observacoes'     => 'nullable|string',
            'parcela_numero'  => 'nullable|integer',
            'parcela_total'   => 'nullable|integer',
        ]);

        $conta = ContaPagar::create([...$data, 'created_by' => $request->user()->id, 'status' => 'pendente']);
        return response()->json($conta->load('fornecedor:id,nome'), 201);
    }

    public function pagarConta(Request $request, ContaPagar $conta): JsonResponse
    {
        if ($conta->status === 'pago') {
            return response()->json(['message' => 'Conta já foi paga.'], 422);
        }

        $data = $request->validate([
            'valor_pago'      => 'required|numeric|min:0.01',
            'forma_pagamento' => 'required|string',
        ]);

        $conta->pagar($data['valor_pago'], $data['forma_pagamento']);
        return response()->json($conta->fresh()->load('fornecedor:id,nome'));
    }

    // FLUXO DE CAIXA
    public function fluxoCaixa(Request $request): JsonResponse
    {
        $request->validate([
            'inicio' => 'required|date',
            'fim'    => 'required|date|after_or_equal:inicio',
        ]);

        $movimentacoes = MovimentacaoCaixa::with(['usuario:id,name'])
            ->whereBetween('data_movimentacao', [$request->inicio, $request->fim])
            ->orderBy('data_movimentacao')
            ->get();

        $saldo = MovimentacaoCaixa::saldoPeriodo($request->inicio, $request->fim);

        // Agrupar por dia
        $porDia = $movimentacoes->groupBy('data_movimentacao')->map(function ($movs) {
            return [
                'entradas' => $movs->where('tipo', 'entrada')->sum('valor'),
                'saidas'   => $movs->where('tipo', 'saida')->sum('valor'),
                'movs'     => $movs->values(),
            ];
        });

        return response()->json([
            'periodo'       => ['inicio' => $request->inicio, 'fim' => $request->fim],
            'resumo'        => $saldo,
            'por_dia'       => $porDia,
            'movimentacoes' => $movimentacoes,
        ]);
    }

    public function resumoFinanceiro(): JsonResponse
    {
        $hoje      = now()->toDateString();
        $inicioMes = now()->startOfMonth()->toDateString();
        $fimMes    = now()->endOfMonth()->toDateString();

        return response()->json([
            'a_receber_total'   => ContaReceber::where('status', 'pendente')->sum('valor'),
            'a_receber_vencido' => ContaReceber::vencidas()->sum('valor'),
            'a_pagar_total'     => ContaPagar::where('status', 'pendente')->sum('valor'),
            'a_pagar_vencido'   => ContaPagar::vencidas()->sum('valor'),
            'recebido_mes'      => ContaReceber::where('status', 'recebido')
                ->whereBetween('recebido_em', [$inicioMes . ' 00:00:00', $fimMes . ' 23:59:59'])->sum('valor_recebido'),
            'pago_mes'          => ContaPagar::where('status', 'pago')
                ->whereBetween('pago_em', [$inicioMes . ' 00:00:00', $fimMes . ' 23:59:59'])->sum('valor_pago'),
            'saldo_mes'         => MovimentacaoCaixa::saldoPeriodo($inicioMes, $fimMes),
        ]);
    }

    public function relatorio(Request $request): JsonResponse
    {
        $mes = (int) ($request->mes ?? now()->month);
        $ano = (int) ($request->ano ?? now()->year);

        $inicio = \Carbon\Carbon::create($ano, $mes, 1)->startOfMonth()->toDateString();
        $fim    = \Carbon\Carbon::create($ano, $mes, 1)->endOfMonth()->toDateString();

        $entradas = ContaReceber::with(['cliente:id,nome', 'pedido:id,numero'])
            ->where('status', 'recebido')
            ->whereBetween('recebido_em', [$inicio . ' 00:00:00', $fim . ' 23:59:59'])
            ->orderBy('recebido_em')
            ->get();

        $saidas = ContaPagar::with(['fornecedor:id,nome'])
            ->where('status', 'pago')
            ->whereBetween('pago_em', [$inicio . ' 00:00:00', $fim . ' 23:59:59'])
            ->orderBy('pago_em')
            ->get();

        return response()->json([
            'periodo'        => ['mes' => $mes, 'ano' => $ano, 'inicio' => $inicio, 'fim' => $fim],
            'total_entradas' => (float) $entradas->sum('valor_recebido'),
            'total_saidas'   => (float) $saidas->sum('valor_pago'),
            'saldo'          => (float) $entradas->sum('valor_recebido') - (float) $saidas->sum('valor_pago'),
            'entradas'       => $entradas,
            'saidas'         => $saidas,
        ]);
    }
}
