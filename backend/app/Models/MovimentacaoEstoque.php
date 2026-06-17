<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MovimentacaoEstoque extends Model
{
    protected $table = 'movimentacoes_estoque';

    protected $fillable = [
        'insumo_id', 'user_id', 'pedido_id', 'fornecedor_id', 'tipo',
        'quantidade', 'custo_unitario', 'custo_total', 'motivo',
        'observacoes', 'data_movimentacao', 'saldo_anterior', 'saldo_posterior',
    ];

    protected $casts = [
        'data_movimentacao' => 'date',
        'quantidade'        => 'decimal:3',
        'custo_unitario'    => 'decimal:4',
        'custo_total'       => 'decimal:2',
        'saldo_anterior'    => 'decimal:3',
        'saldo_posterior'   => 'decimal:3',
    ];

    public function insumo()     { return $this->belongsTo(Insumo::class); }
    public function usuario()    { return $this->belongsTo(User::class, 'user_id'); }
    public function pedido()     { return $this->belongsTo(Pedido::class); }
    public function fornecedor() { return $this->belongsTo(Fornecedor::class); }

    protected static function booted(): void
    {
        static::created(function (MovimentacaoEstoque $mov) {
            $insumo = $mov->insumo;
            $anterior = $insumo->quantidade_atual;

            $nova = match($mov->tipo) {
                'entrada', 'devolucao' => $anterior + $mov->quantidade,
                'saida'                => $anterior - $mov->quantidade,
                'ajuste'               => $mov->quantidade,
            };

            $mov->update(['saldo_anterior' => $anterior, 'saldo_posterior' => $nova]);
            $insumo->update(['quantidade_atual' => $nova]);
        });
    }
}
