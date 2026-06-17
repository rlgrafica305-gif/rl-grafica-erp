<?php

namespace App\Http\Controllers;

use App\Models\Pedido;
use App\Models\Orcamento;
use App\Models\ContaReceber;
use App\Models\ContaPagar;
use App\Models\Insumo;
use App\Models\MovimentacaoCaixa;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $hoje         = now()->toDateString();
        $inicioMes    = now()->startOfMonth()->toDateString();
        $fimMes       = now()->endOfMonth()->toDateString();
        $inicioSemana = now()->startOfWeek()->toDateString();

        // KPIs principais
        $pedidosHoje = Pedido::whereDate('created_at', $hoje)->count();
        $faturamentoMes = Pedido::whereIn('status', ['finalizado', 'entregue'])
            ->whereBetween('created_at', [$inicioMes . ' 00:00:00', $fimMes . ' 23:59:59'])
            ->sum('total');
        $emProducao = Pedido::where('status', 'em_producao')->count();
        $aReceber = ContaReceber::where('status', 'pendente')->sum('valor');

        // Pedidos por status
        $pedidosPorStatus = Pedido::select('status', DB::raw('count(*) as total'))
            ->whereNotIn('status', ['entregue', 'cancelado'])
            ->groupBy('status')
            ->pluck('total', 'status');

        // Faturamento últimos 6 meses
        $faturamentoMensal = Pedido::select(
                DB::raw('DATE_FORMAT(created_at, "%Y-%m") as mes'),
                DB::raw('SUM(total) as total')
            )
            ->whereIn('status', ['finalizado', 'entregue'])
            ->where('created_at', '>=', now()->subMonths(6)->startOfMonth())
            ->groupBy('mes')
            ->orderBy('mes')
            ->get();

        // Pedidos atrasados
        $pedidosAtrasados = Pedido::atrasados()->count();

        // Contas a vencer (7 dias)
        $contasAVencer = ContaReceber::aVencer(7)->count();
        $contasPagarAVencer = ContaPagar::where('status', 'pendente')
            ->whereBetween('vencimento', [$hoje, now()->addDays(7)->toDateString()])
            ->sum('valor');

        // Últimos pedidos
        $ultimosPedidos = Pedido::with(['cliente:id,nome', 'vendedor:id,name'])
            ->latest()
            ->limit(8)
            ->get(['id', 'numero', 'cliente_id', 'vendedor_id', 'status', 'total', 'prazo_entrega', 'created_at']);

        // Alertas de estoque
        $alertasEstoque = Insumo::emAlerta()->where('active', true)->count();

        // Saldo do mês
        $saldo = MovimentacaoCaixa::saldoPeriodo($inicioMes, $fimMes);

        return response()->json([
            'kpis' => [
                'pedidos_hoje'        => $pedidosHoje,
                'faturamento_mes'     => (float) $faturamentoMes,
                'em_producao'         => $emProducao,
                'a_receber'           => (float) $aReceber,
                'pedidos_atrasados'   => $pedidosAtrasados,
                'contas_a_vencer'     => $contasAVencer,
                'alertas_estoque'     => $alertasEstoque,
            ],
            'pedidos_por_status'   => $pedidosPorStatus,
            'faturamento_mensal'   => $faturamentoMensal,
            'ultimos_pedidos'      => $ultimosPedidos,
            'saldo_mes'            => $saldo,
            'contas_pagar_proximas'=> (float) $contasPagarAVencer,
        ]);
    }
}
