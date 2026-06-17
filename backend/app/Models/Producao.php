<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Producao extends Model
{
    use SoftDeletes;

    protected $table = 'producoes';

    protected $fillable = [
        'pedido_id', 'operador_id', 'setor', 'status', 'prioridade',
        'instrucoes', 'observacoes', 'prazo', 'iniciado_em', 'concluido_em', 'ordem_fila',
    ];

    protected $casts = [
        'prazo'        => 'datetime',
        'iniciado_em'  => 'datetime',
        'concluido_em' => 'datetime',
    ];

    public function pedido()   { return $this->belongsTo(Pedido::class); }
    public function operador() { return $this->belongsTo(User::class, 'operador_id'); }

    public function iniciar(): void
    {
        $this->update(['status' => 'em_andamento', 'iniciado_em' => now()]);
    }

    public function concluir(): void
    {
        $this->update(['status' => 'concluido', 'concluido_em' => now()]);
    }

    public function scopeSetor($query, string $setor) { return $query->where('setor', $setor); }
    public function scopeNaFila($query)
    {
        return $query->whereIn('status', ['na_fila', 'em_andamento'])->orderBy('prioridade')->orderBy('ordem_fila');
    }
}
