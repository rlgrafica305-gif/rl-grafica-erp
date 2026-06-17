<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ArteRevisao extends Model
{
    protected $table = 'arte_revisoes';
    protected $fillable = ['arte_id', 'created_by', 'numero_revisao', 'arquivo', 'comentario', 'acao'];

    public function arte()   { return $this->belongsTo(Arte::class); }
    public function autor()  { return $this->belongsTo(User::class, 'created_by'); }

    public function getArquivoUrlAttribute(): ?string
    {
        return $this->arquivo ? asset('storage/' . $this->arquivo) : null;
    }
}
