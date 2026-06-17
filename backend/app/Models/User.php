<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = ['name', 'email', 'password', 'role', 'active', 'telefone', 'avatar'];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'active' => 'boolean',
    ];

    public function hasRole(string|array $roles): bool
    {
        if (is_string($roles)) {
            return $this->role === $roles;
        }
        return in_array($this->role, $roles);
    }

    public function isAdmin(): bool { return $this->role === 'admin'; }

    // Relacionamentos
    public function pedidosVendidos()   { return $this->hasMany(Pedido::class,   'vendedor_id'); }
    public function orcamentosVendidos(){ return $this->hasMany(Orcamento::class, 'vendedor_id'); }
    public function artesDesignadas()  { return $this->hasMany(Arte::class,      'designer_id'); }
    public function producoesOperadas(){ return $this->hasMany(Producao::class,  'operador_id'); }
}
