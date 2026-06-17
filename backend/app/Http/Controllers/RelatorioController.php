<?php

namespace App\Http\Controllers;

use App\Models\Pedido;
use App\Models\PedidoItem;
use App\Models\Cliente;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class RelatorioController extends Controller
{
    public function produtosMaisVendidos(Request $request): JsonResponse
    {
        $request->validate(['inicio' => 'required|date', 'fim' => 'required|date']);

        $produtos = PedidoItem::select(
                'produto_id',
                DB::raw('SUM(quantidade) as total_quantidade'),
                DB::raw('SUM(subtotal) as total_faturado'),
                DB::raw('COUNT(DISTINCT pedido_id) as total_pedidos')
            )
            ->with('produto:id,nome')
            ->whereHas('pedido', function ($q) use ($request) {
                $q->whereIn('status', ['finalizado', 'entregue'])
                  ->whereBetween('created_at', [$request->inicio . ' 00:00:00', $request->fim . ' 23:59:59']);
            })
            ->whereNotNull('produto_id')
            ->groupBy('produto_id')
            ->orderByDesc('total_faturado')
            ->limit(20)
            ->get();

        return response()->json($produtos);
    }

    public function clientesQueMaisCompram(Request $request): JsonResponse
    {
        $request->validate(['inicio' => 'required|date', 'fim' => 'required|date']);

        $clientes = Pedido::select(
                'cliente_id',
                DB::raw('COUNT(*) as total_pedidos'),
                DB::raw('SUM(total) as total_gasto')
            )
            ->with('cliente:id,nome,telefone,email')
            ->whereIn('status', ['finalizado', 'entregue'])
            ->whereBetween('created_at', [$request->inicio . ' 00:00:00', $request->fim . ' 23:59:59'])
            ->groupBy('cliente_id')
            ->orderByDesc('total_gasto')
            ->limit(20)
            ->get();

        return response()->json($clientes);
    }

    public function lucroPorPeriodo(Request $request): JsonResponse
    {
        $request->validate([
            'inicio'    => 'required|date',
            'fim'       => 'required|date',
            'agrupar'   => 'in:dia,semana,mes',
        ]);

        $formato = match($request->get('agrupar', 'dia')) {
            'mes'    => '%Y-%m',
            'semana' => '%Y-%u',
            default  => '%Y-%m-%d',
        };

        $faturamento = Pedido::select(
                DB::raw("DATE_FORMAT(created_at, '{$formato}') as periodo"),
                DB::raw('COUNT(*) as total_pedidos'),
                DB::raw('SUM(total) as faturamento'),
                DB::raw('COUNT(CASE WHEN status = "cancelado" THEN 1 END) as cancelados')
            )
            ->whereNotIn('status', ['cancelado'])
            ->whereBetween('created_at', [$request->inicio . ' 00:00:00', $request->fim . ' 23:59:59'])
            ->groupBy('periodo')
            ->orderBy('periodo')
            ->get();

        return response()->json([
            'dados'          => $faturamento,
            'total_periodo'  => [
                'pedidos'    => $faturamento->sum('total_pedidos'),
                'faturamento'=> $faturamento->sum('faturamento'),
            ],
        ]);
    }

    public function desempenhoVendedores(Request $request): JsonResponse
    {
        $request->validate(['inicio' => 'required|date', 'fim' => 'required|date']);

        $vendedores = Pedido::select(
                'vendedor_id',
                DB::raw('COUNT(*) as total_pedidos'),
                DB::raw('SUM(total) as total_vendido'),
                DB::raw('AVG(total) as ticket_medio'),
                DB::raw('COUNT(CASE WHEN status = "entregue" THEN 1 END) as entregues')
            )
            ->with('vendedor:id,name,role')
            ->whereIn('status', ['finalizado', 'entregue'])
            ->whereBetween('created_at', [$request->inicio . ' 00:00:00', $request->fim . ' 23:59:59'])
            ->groupBy('vendedor_id')
            ->orderByDesc('total_vendido')
            ->get();

        return response()->json($vendedores);
    }

    public function statusPedidos(Request $request): JsonResponse
    {
        $request->validate(['inicio' => 'required|date', 'fim' => 'required|date']);

        $status = Pedido::select('status', DB::raw('COUNT(*) as total'), DB::raw('SUM(total) as valor'))
            ->whereBetween('created_at', [$request->inicio . ' 00:00:00', $request->fim . ' 23:59:59'])
            ->groupBy('status')
            ->get();

        return response()->json($status);
    }
}
