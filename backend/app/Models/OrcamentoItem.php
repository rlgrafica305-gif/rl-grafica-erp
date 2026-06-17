<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrcamentoItem extends Model
{
    protected $table = 'orcamento_itens';

    protected $fillable = [
        'orcamento_id', 'produto_id', 'descricao', 'quantidade',
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

    public function orcamento() { return $this->belongsTo(Orcamento::class); }
    public function produto()   { return $this->belongsTo(Produto::class); }

    protected static function booted(): void
    {
        static::saving(function (OrcamentoItem $item) {
            $item->subtotal = $item->quantidade * $item->preco_unitario;
        });

        static::saved(function (OrcamentoItem $item) {
            $item->orcamento->recalcularTotal();
        });

        static::deleted(function (OrcamentoItem $item) {
            $item->orcamento->recalcularTotal();
        });
    }
}
