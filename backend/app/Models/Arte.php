<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Arte extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'pedido_id', 'designer_id', 'status', 'arquivo_cliente',
        'arquivo_final', 'briefing', 'observacoes', 'numero_revisao', 'prazo_entrega',
    ];

    protected $casts = ['prazo_entrega' => 'datetime'];

    public function pedido()   { return $this->belongsTo(Pedido::class); }
    public function designer() { return $this->belongsTo(User::class, 'designer_id'); }
    public function revisoes() { return $this->hasMany(ArteRevisao::class)->orderBy('numero_revisao'); }

    public function getArquivoClienteUrlAttribute(): ?string
    {
        return $this->arquivo_cliente ? asset('storage/' . $this->arquivo_cliente) : null;
    }

    public function getArquivoFinalUrlAttribute(): ?string
    {
        return $this->arquivo_final ? asset('storage/' . $this->arquivo_final) : null;
    }
}
