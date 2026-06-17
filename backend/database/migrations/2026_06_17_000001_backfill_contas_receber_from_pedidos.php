<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $formasValidas = ['dinheiro','pix','cartao_credito','cartao_debito','boleto','transferencia'];

        $pedidos = DB::table('pedidos')
            ->leftJoin('contas_receber', 'contas_receber.pedido_id', '=', 'pedidos.id')
            ->whereNull('contas_receber.id')
            ->whereNull('pedidos.deleted_at')
            ->whereNotIn('pedidos.status', ['cancelado'])
            ->where('pedidos.total', '>', 0)
            ->select('pedidos.*')
            ->get();

        foreach ($pedidos as $pedido) {
            $forma = in_array($pedido->forma_pagamento, $formasValidas)
                ? $pedido->forma_pagamento
                : null;

            $pago = $pedido->status_pagamento === 'pago';

            DB::table('contas_receber')->insert([
                'pedido_id'       => $pedido->id,
                'cliente_id'      => $pedido->cliente_id,
                'created_by'      => $pedido->vendedor_id,
                'descricao'       => 'Pedido ' . $pedido->numero,
                'valor'           => $pedido->total,
                'vencimento'      => $pedido->prazo_entrega ?? date('Y-m-d', strtotime($pedido->created_at . ' +3 days')),
                'forma_pagamento' => $forma,
                'status'          => $pago ? 'recebido' : 'pendente',
                'valor_recebido'  => $pago ? $pedido->total : null,
                'recebido_em'     => $pago ? $pedido->updated_at : null,
                'created_at'      => $pedido->created_at,
                'updated_at'      => now(),
            ]);
        }
    }

    public function down(): void {}
};
