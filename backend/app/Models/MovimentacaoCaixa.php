<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MovimentacaoCaixa extends Model
{
    protected $table = 'movimentacoes_caixa';

    protected $fillable = [
        'user_id', 'conta_receber_id', 'conta_pagar_id', 'tipo',
        'valor', 'descricao', 'categoria', 'data_movimentacao', 'observacoes',
    ];

    protected $casts = [
        'data_movimentacao' => 'date',
        'valor'             => 'decimal:2',
    ];

    public function usuario()      { return $this->belongsTo(User::class, 'user_id'); }
    public function contaReceber() { return $this->belongsTo(ContaReceber::class, 'conta_receber_id'); }
    public function contaPagar()   { return $this->belongsTo(ContaPagar::class, 'conta_pagar_id'); }

    public static function saldoPeriodo(string $inicio, string $fim): array
    {
        $entradas = static::where('tipo', 'entrada')->whereBetween('data_movimentacao', [$inicio, $fim])->sum('valor');
        $saidas   = static::where('tipo', 'saida')->whereBetween('data_movimentacao', [$inicio, $fim])->sum('valor');
        return [
            'entradas' => (float) $entradas,
            'saidas'   => (float) $saidas,
            'saldo'    => (float) ($entradas - $saidas),
        ];
    }
}
