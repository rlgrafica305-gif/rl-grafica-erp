<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Produto extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'categoria_id', 'nome', 'descricao', 'preco_base',
        'unidade_medida', 'tempo_producao_dias', 'personalizado', 'active',
    ];

    protected $casts = [
        'preco_base' => 'decimal:2',
        'personalizado' => 'boolean',
        'active' => 'boolean',
    ];

    public function categoria()      { return $this->belongsTo(CategoriaProduto::class, 'categoria_id'); }
    public function orcamentoItens() { return $this->hasMany(OrcamentoItem::class); }
    public function pedidoItens()    { return $this->hasMany(PedidoItem::class); }

    public function scopeAtivos($query) { return $query->where('active', true); }
}
