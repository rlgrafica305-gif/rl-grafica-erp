<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContaPagar extends Model
{
    use SoftDeletes;

    protected $table = 'contas_pagar';

    protected $fillable = [
        'fornecedor_id', 'created_by', 'descricao', 'categoria', 'valor',
        'vencimento', 'forma_pagamento', 'status', 'pago_em',
        'valor_pago', 'observacoes', 'parcela_numero', 'parcela_total',
    ];

    protected $casts = [
        'vencimento' => 'date',
        'valor'      => 'decimal:2',
        'valor_pago' => 'decimal:2',
        'pago_em'    => 'datetime',
    ];

    public function fornecedor() { return $this->belongsTo(Fornecedor::class); }
    public function criador()    { return $this->belongsTo(User::class, 'created_by'); }

    public function pagar(float $valor, string $formaPagamento): void
    {
        $this->update([
            'status'          => 'pago',
            'valor_pago'      => $valor,
            'pago_em'         => now(),
            'forma_pagamento' => $formaPagamento,
        ]);

        MovimentacaoCaixa::create([
            'user_id'           => auth()->id(),
            'conta_pagar_id'    => $this->id,
            'tipo'              => 'saida',
            'valor'             => $valor,
            'descricao'         => "Pagamento: {$this->descricao}",
            'categoria'         => $this->categoria ?? 'despesas',
            'data_movimentacao' => now()->toDateString(),
        ]);
    }

    public function scopeVencidas($query)
    {
        return $query->where('status', 'pendente')->where('vencimento', '<', now()->toDateString());
    }
}
