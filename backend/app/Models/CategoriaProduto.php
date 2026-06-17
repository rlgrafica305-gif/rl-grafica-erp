<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CategoriaProduto extends Model
{
    protected $table = 'categorias_produto';
    protected $fillable = ['nome', 'descricao', 'active'];
    protected $casts = ['active' => 'boolean'];

    public function produtos() { return $this->hasMany(Produto::class, 'categoria_id'); }
}
