<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fornecedores', function (Blueprint $table) {
            $table->id();
            $table->string('nome');
            $table->string('cnpj', 20)->nullable()->unique();
            $table->string('telefone', 20)->nullable();
            $table->string('whatsapp', 20)->nullable();
            $table->string('email')->nullable();
            $table->string('contato')->nullable()->comment('Nome do contato');
            $table->string('cep', 10)->nullable();
            $table->string('logradouro')->nullable();
            $table->string('numero', 20)->nullable();
            $table->string('cidade')->nullable();
            $table->string('estado', 2)->nullable();
            $table->text('observacoes')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('insumos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fornecedor_id')->nullable()->constrained('fornecedores')->nullOnDelete();
            $table->string('nome');
            $table->string('codigo', 50)->nullable()->unique();
            $table->text('descricao')->nullable();
            $table->string('unidade_medida', 20)->default('un');
            $table->decimal('quantidade_atual', 10, 3)->default(0);
            $table->decimal('estoque_minimo', 10, 3)->default(0);
            $table->decimal('estoque_maximo', 10, 3)->nullable();
            $table->decimal('custo_unitario', 10, 4)->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('movimentacoes_estoque', function (Blueprint $table) {
            $table->id();
            $table->foreignId('insumo_id')->constrained('insumos')->restrictOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('pedido_id')->nullable()->constrained('pedidos')->nullOnDelete();
            $table->foreignId('fornecedor_id')->nullable()->constrained('fornecedores')->nullOnDelete();
            $table->enum('tipo', ['entrada', 'saida', 'ajuste', 'devolucao']);
            $table->decimal('quantidade', 10, 3);
            $table->decimal('custo_unitario', 10, 4)->nullable();
            $table->decimal('custo_total', 12, 2)->nullable();
            $table->string('motivo')->nullable();
            $table->text('observacoes')->nullable();
            $table->date('data_movimentacao');
            $table->decimal('saldo_anterior', 10, 3)->default(0);
            $table->decimal('saldo_posterior', 10, 3)->default(0);
            $table->timestamps();

            $table->index(['insumo_id', 'data_movimentacao']);
            $table->index('tipo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('movimentacoes_estoque');
        Schema::dropIfExists('insumos');
        Schema::dropIfExists('fornecedores');
    }
};
