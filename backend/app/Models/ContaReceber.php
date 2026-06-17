<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContaReceber extends Model
{
    use SoftDeletes;

    protected $table = 'contas_receber';

    protected $fillable = [
        'pedido_id', 'cliente_id', 'created_by', 'descricao', 'valor',
        'vencimento', 'forma_pagamento', 'status', 'recebido_em',
        'valor_recebido', 'observacoes', 'parcela_numero', 'parcela_total',
    ];

    protected $casts = [
        'vencimento'      => 'date',
        'valor'           => 'decimal:2',
        'valor_recebido'  => 'decimal:2',
        'recebido_em'     => 'datetime',
    ];

    public function pedido()    { return $this->belongsTo(Pedido::class); }
    public function cliente()   { return $this->belongsTo(Cliente::class); }
    public function criador()   { return $this->belongsTo(User::class, 'created_by'); }

    public function receber(float $valor, string $formaPagamento): void
    {
        $this->update([
            'status'          => 'recebido',
            'valor_recebido'  => $valor,
            'recebido_em'     => now(),
            'forma_pagamento' => $formaPagamento,
        ]);

        MovimentacaoCaixa::create([
            'user_id'             => auth()->id(),
            'conta_receber_id'    => $this->id,
            'tipo'                => 'entrada',
            'valor'               => $valor,
            'descricao'           => "Recebimento: {$this->descricao}",
            'categoria'           => 'vendas',
            'data_movimentacao'   => now()->toDateString(),
        ]);
    }

    public function scopeVencidas($query)
    {
        return $query->where('status', 'pendente')->where('vencimento', '<', now()->toDateString());
    }

    public function scopeAVencer($query, int $dias = 7)
    {
        return $query->where('status', 'pendente')
                     ->whereBetween('vencimento', [now()->toDateString(), now()->addDays($dias)->toDateString()]);
    }
}
