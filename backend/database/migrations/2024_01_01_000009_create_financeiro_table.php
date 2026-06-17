<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contas_receber', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pedido_id')->nullable()->constrained('pedidos')->nullOnDelete();
            $table->foreignId('cliente_id')->constrained('clientes')->restrictOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('descricao');
            $table->decimal('valor', 12, 2);
            $table->date('vencimento');
            $table->enum('forma_pagamento', [
                'dinheiro', 'pix', 'cartao_credito', 'cartao_debito',
                'boleto', 'transferencia', 'cheque',
            ])->nullable();
            $table->enum('status', ['pendente', 'recebido', 'vencido', 'cancelado'])->default('pendente');
            $table->timestamp('recebido_em')->nullable();
            $table->decimal('valor_recebido', 12, 2)->nullable();
            $table->text('observacoes')->nullable();
            $table->integer('parcela_numero')->nullable();
            $table->integer('parcela_total')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'vencimento']);
            $table->index(['cliente_id', 'status']);
        });

        Schema::create('contas_pagar', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fornecedor_id')->nullable()->constrained('fornecedores')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('descricao');
            $table->string('categoria')->nullable()->comment('Insumos, Energia, Aluguel, etc');
            $table->decimal('valor', 12, 2);
            $table->date('vencimento');
            $table->enum('forma_pagamento', [
                'dinheiro', 'pix', 'cartao_credito', 'cartao_debito',
                'boleto', 'transferencia', 'cheque',
            ])->nullable();
            $table->enum('status', ['pendente', 'pago', 'vencido', 'cancelado'])->default('pendente');
            $table->timestamp('pago_em')->nullable();
            $table->decimal('valor_pago', 12, 2)->nullable();
            $table->text('observacoes')->nullable();
            $table->integer('parcela_numero')->nullable();
            $table->integer('parcela_total')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'vencimento']);
        });

        Schema::create('movimentacoes_caixa', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('conta_receber_id')->nullable()->constrained('contas_receber')->nullOnDelete();
            $table->foreignId('conta_pagar_id')->nullable()->constrained('contas_pagar')->nullOnDelete();
            $table->enum('tipo', ['entrada', 'saida']);
            $table->decimal('valor', 12, 2);
            $table->string('descricao');
            $table->string('categoria')->nullable();
            $table->date('data_movimentacao');
            $table->text('observacoes')->nullable();
            $table->timestamps();

            $table->index(['tipo', 'data_movimentacao']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('movimentacoes_caixa');
        Schema::dropIfExists('contas_pagar');
        Schema::dropIfExists('contas_receber');
    }
};
