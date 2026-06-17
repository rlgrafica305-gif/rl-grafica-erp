<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('producoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pedido_id')->constrained('pedidos')->cascadeOnDelete();
            $table->foreignId('operador_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('setor', [
                'pre_impressao',
                'impressao',
                'acabamento',
                'embalagem',
                'expedicao',
            ]);
            $table->enum('status', [
                'na_fila',
                'em_andamento',
                'pausado',
                'concluido',
                'cancelado',
            ])->default('na_fila');
            $table->integer('prioridade')->default(5)->comment('1=urgente, 10=baixa');
            $table->text('instrucoes')->nullable();
            $table->text('observacoes')->nullable();
            $table->timestamp('prazo')->nullable();
            $table->timestamp('iniciado_em')->nullable();
            $table->timestamp('concluido_em')->nullable();
            $table->integer('ordem_fila')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['setor', 'status', 'prioridade']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('producoes');
    }
};
