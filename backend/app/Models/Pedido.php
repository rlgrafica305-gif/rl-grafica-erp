<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Pedido extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'numero', 'cliente_id', 'orcamento_id', 'vendedor_id', 'status',
        'forma_pagamento', 'status_pagamento', 'prazo_entrega', 'subtotal',
        'desconto_percentual', 'desconto_valor', 'total', 'observacoes',
        'endereco_entrega', 'entregue_em',
    ];

    protected $casts = [
        'prazo_entrega'  => 'date',
        'subtotal'       => 'decimal:2',
        'desconto_percentual' => 'decimal:2',
        'desconto_valor' => 'decimal:2',
        'total'          => 'decimal:2',
        'entregue_em'    => 'datetime',
    ];

    public function cliente()   { return $this->belongsTo(Cliente::class); }
    public function vendedor()  { return $this->belongsTo(User::class, 'vendedor_id'); }
    public function orcamento() { return $this->belongsTo(Orcamento::class); }
    public function itens()     { return $this->hasMany(PedidoItem::class); }
    public function artes()     { return $this->hasMany(Arte::class); }
    public function producoes() { return $this->hasMany(Producao::class); }
    public function historico() { return $this->hasMany(HistoricoPedido::class)->latest(); }
    public function contasReceber() { return $this->hasMany(ContaReceber::class); }

    public static function gerarNumero(string $telefone = ''): string
    {
        $digits = preg_replace('/\D/', '', $telefone);
        $last4  = str_pad(substr($digits, -4), 4, '0', STR_PAD_LEFT);
        $seq    = str_pad((static::count() + 1), 4, '0', STR_PAD_LEFT);
        return $last4 . '-' . $seq;
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

    public function mudarStatus(string $novoStatus, ?User $usuario = null, ?string $obs = null): void
    {
        $anterior = $this->status;
        $this->update(['status' => $novoStatus]);

        HistoricoPedido::create([
            'pedido_id'       => $this->id,
            'user_id'         => $usuario?->id ?? auth()->id(),
            'status_anterior' => $anterior,
            'status_novo'     => $novoStatus,
            'observacao'      => $obs,
        ]);
    }

    public function scopeStatus($query, string $status) { return $query->where('status', $status); }
    public function scopeAtrasados($query)
    {
        return $query->whereNotIn('status', ['finalizado', 'entregue', 'cancelado'])
                     ->where('prazo_entrega', '<', now()->toDateString());
    }
}
