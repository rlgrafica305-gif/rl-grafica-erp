<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Insumo extends Model
{
    use SoftDeletes;

    protected $table = 'insumos';

    protected $fillable = [
        'fornecedor_id', 'nome', 'codigo', 'descricao', 'unidade_medida',
        'quantidade_atual', 'estoque_minimo', 'estoque_maximo', 'custo_unitario', 'active',
    ];

    protected $casts = [
        'quantidade_atual' => 'decimal:3',
        'estoque_minimo'   => 'decimal:3',
        'estoque_maximo'   => 'decimal:3',
        'custo_unitario'   => 'decimal:4',
        'active'           => 'boolean',
    ];

    public function fornecedor()    { return $this->belongsTo(Fornecedor::class); }
    public function movimentacoes() { return $this->hasMany(MovimentacaoEstoque::class); }

    public function getEmAlertaAttribute(): bool
    {
        return $this->quantidade_atual <= $this->estoque_minimo;
    }

    public function scopeEmAlerta($query)
    {
        return $query->whereColumn('quantidade_atual', '<=', 'estoque_minimo');
    }
}
