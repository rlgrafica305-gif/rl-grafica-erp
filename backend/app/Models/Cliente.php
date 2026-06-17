<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cliente extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'nome', 'tipo_pessoa', 'cpf_cnpj', 'telefone', 'whatsapp',
        'email', 'cep', 'logradouro', 'numero', 'complemento',
        'bairro', 'cidade', 'estado', 'observacoes', 'active', 'created_by',
    ];

    protected $casts = ['active' => 'boolean'];

    public function pedidos()    { return $this->hasMany(Pedido::class); }
    public function orcamentos() { return $this->hasMany(Orcamento::class); }
    public function contasReceber() { return $this->hasMany(ContaReceber::class); }
    public function criador()    { return $this->belongsTo(User::class, 'created_by'); }

    public function getTotalComprasAttribute(): float
    {
        return $this->pedidos()
            ->whereIn('status', ['finalizado', 'entregue'])
            ->sum('total');
    }

    public function scopeAtivos($query) { return $query->where('active', true); }
    public function scopeBusca($query, string $termo)
    {
        return $query->where(function ($q) use ($termo) {
            $q->where('nome', 'like', "%{$termo}%")
              ->orWhere('cpf_cnpj', 'like', "%{$termo}%")
              ->orWhere('email', 'like', "%{$termo}%")
              ->orWhere('telefone', 'like', "%{$termo}%");
        });
    }
}
