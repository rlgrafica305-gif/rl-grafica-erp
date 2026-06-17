<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Fornecedor extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'nome', 'cnpj', 'telefone', 'whatsapp', 'email', 'contato',
        'cep', 'logradouro', 'numero', 'cidade', 'estado', 'observacoes', 'active',
    ];

    protected $casts = ['active' => 'boolean'];

    public function insumos()     { return $this->hasMany(Insumo::class); }
    public function contasPagar() { return $this->hasMany(ContaPagar::class); }
}
