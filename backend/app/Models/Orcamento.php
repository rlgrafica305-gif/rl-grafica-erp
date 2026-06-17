<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Orcamento extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'numero', 'cliente_id', 'vendedor_id', 'status', 'validade',
        'subtotal', 'desconto_percentual', 'desconto_valor', 'total',
        'observacoes', 'condicoes_pagamento', 'enviado_em', 'aprovado_em',
    ];

    protected $casts = [
        'validade'      => 'date',
        'subtotal'      => 'decimal:2',
        'desconto_percentual' => 'decimal:2',
        'desconto_valor'=> 'decimal:2',
        'total'         => 'decimal:2',
        'enviado_em'    => 'datetime',
        'aprovado_em'   => 'datetime',
    ];

    public function cliente()  { return $this->belongsTo(Cliente::class); }
    public function vendedor() { return $this->belongsTo(User::class, 'vendedor_id'); }
    public function itens()    { return $this->hasMany(OrcamentoItem::class); }
    public function pedido()   { return $this->hasOne(Pedido::class); }

    public static function gerarNumero(): string
    {
        $ano = now()->year;
        $ultimo = static::whereYear('created_at', $ano)->max('id') ?? 0;
        return 'ORC-' . $ano . '-' . str_pad($ultimo + 1, 4, '0', STR_PAD_LEFT);
    }

    public function recalcularTotal(): void
    {
        $subtotal = $this->itens()->sum('subtotal');
        $desconto = ($subtotal * $this->desconto_percentual / 100) + $this->desconto_valor;
        $this->update([
            'subtotal' => $subtotal,
            'total'    => max(0, $subtotal - $desconto),
        ]);
    }

    public function scopeStatus($query, string $status) { return $query->where('status', $status); }
}
