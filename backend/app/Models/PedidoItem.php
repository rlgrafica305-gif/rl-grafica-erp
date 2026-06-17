<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PedidoItem extends Model
{
    protected $table = 'pedido_itens';

    protected $fillable = [
        'pedido_id', 'produto_id', 'descricao', 'quantidade',
        'largura', 'altura', 'cor', 'acabamento', 'papel_material',
        'preco_unitario', 'subtotal', 'observacoes', 'ordem',
    ];

    protected $casts = [
        'quantidade'     => 'decimal:2',
        'largura'        => 'decimal:2',
        'altura'         => 'decimal:2',
        'preco_unitario' => 'decimal:2',
        'subtotal'       => 'decimal:2',
    ];

    public function pedido()  { return $this->belongsTo(Pedido::class); }
    public function produto() { return $this->belongsTo(Produto::class); }

    protected static function booted(): void
    {
        static::saving(function (PedidoItem $item) {
            $item->subtotal = $item->quantidade * $item->preco_unitario;
        });
        static::saved(function (PedidoItem $item) {
            $item->pedido->recalcularTotal();
        });
        static::deleted(function (PedidoItem $item) {
            $item->pedido->recalcularTotal();
        });
    }
}
