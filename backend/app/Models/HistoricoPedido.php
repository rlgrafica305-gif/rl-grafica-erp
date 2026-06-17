<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HistoricoPedido extends Model
{
    protected $table = 'historico_pedidos';

    protected $fillable = ['pedido_id', 'user_id', 'status_anterior', 'status_novo', 'observacao'];

    public function pedido()  { return $this->belongsTo(Pedido::class); }
    public function usuario() { return $this->belongsTo(User::class, 'user_id'); }
}
