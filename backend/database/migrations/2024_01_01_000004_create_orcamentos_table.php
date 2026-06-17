<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orcamentos', function (Blueprint $table) {
            $table->id();
            $table->string('numero', 20)->unique()->comment('Ex: ORC-2024-0001');
            $table->foreignId('cliente_id')->constrained('clientes')->restrictOnDelete();
            $table->foreignId('vendedor_id')->constrained('users')->restrictOnDelete();
            $table->enum('status', [
                'pendente',
                'enviado',
                'aprovado',
                'rejeitado',
                'convertido',
                'expirado',
            ])->default('pendente');
            $table->date('validade')->nullable()->comment('Data de expiração do orçamento');
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('desconto_percentual', 5, 2)->default(0);
            $table->decimal('desconto_valor', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->text('observacoes')->nullable();
            $table->text('condicoes_pagamento')->nullable();
            $table->timestamp('enviado_em')->nullable();
            $table->timestamp('aprovado_em')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['cliente_id', 'status']);
            $table->index('created_at');
        });

        Schema::create('orcamento_itens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orcamento_id')->constrained('orcamentos')->cascadeOnDelete();
            $table->foreignId('produto_id')->nullable()->constrained('produtos')->nullOnDelete();
            $table->string('descricao');
            $table->decimal('quantidade', 10, 2)->default(1);
            $table->decimal('largura', 8, 2)->nullable()->comment('cm');
            $table->decimal('altura', 8, 2)->nullable()->comment('cm');
            $table->string('cor', 50)->nullable()->comment('4x4, 4x0, etc');
            $table->string('acabamento', 100)->nullable()->comment('Laminação, verniz, etc');
            $table->string('papel_material', 100)->nullable();
            $table->decimal('preco_unitario', 10, 2)->default(0);
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->text('observacoes')->nullable();
            $table->integer('ordem')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orcamento_itens');
        Schema::dropIfExists('orcamentos');
    }
};
