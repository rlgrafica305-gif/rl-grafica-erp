<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pedidos', function (Blueprint $table) {
            $table->id();
            $table->string('numero', 20)->unique()->comment('Ex: PED-2024-0001');
            $table->foreignId('cliente_id')->constrained('clientes')->restrictOnDelete();
            $table->foreignId('orcamento_id')->nullable()->constrained('orcamentos')->nullOnDelete();
            $table->foreignId('vendedor_id')->constrained('users')->restrictOnDelete();
            $table->enum('status', [
                'recebido',
                'aguardando_arte',
                'aguardando_aprovacao',
                'em_producao',
                'finalizado',
                'entregue',
                'cancelado',
            ])->default('recebido');
            $table->enum('forma_pagamento', [
                'dinheiro',
                'pix',
                'cartao_credito',
                'cartao_debito',
                'boleto',
                'transferencia',
                'a_prazo',
            ])->nullable();
            $table->date('prazo_entrega')->nullable();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('desconto_percentual', 5, 2)->default(0);
            $table->decimal('desconto_valor', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->text('observacoes')->nullable();
            $table->text('endereco_entrega')->nullable();
            $table->timestamp('entregue_em')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['cliente_id', 'status']);
            $table->index(['status', 'prazo_entrega']);
            $table->index('created_at');
        });

        Schema::create('pedido_itens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pedido_id')->constrained('pedidos')->cascadeOnDelete();
            $table->foreignId('produto_id')->nullable()->constrained('produtos')->nullOnDelete();
            $table->string('descricao');
            $table->decimal('quantidade', 10, 2)->default(1);
            $table->decimal('largura', 8, 2)->nullable();
            $table->decimal('altura', 8, 2)->nullable();
            $table->string('cor', 50)->nullable();
            $table->string('acabamento', 100)->nullable();
            $table->string('papel_material', 100)->nullable();
            $table->decimal('preco_unitario', 10, 2)->default(0);
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->text('observacoes')->nullable();
            $table->integer('ordem')->default(0);
            $table->timestamps();
        });

        Schema::create('historico_pedidos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pedido_id')->constrained('pedidos')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->string('status_anterior')->nullable();
            $table->string('status_novo');
            $table->text('observacao')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historico_pedidos');
        Schema::dropIfExists('pedido_itens');
        Schema::dropIfExists('pedidos');
    }
};
