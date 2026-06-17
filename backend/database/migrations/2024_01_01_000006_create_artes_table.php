<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('artes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pedido_id')->constrained('pedidos')->cascadeOnDelete();
            $table->foreignId('designer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', [
                'aguardando_envio',
                'em_desenvolvimento',
                'aguardando_aprovacao',
                'aprovada',
                'rejeitada',
                'reenvio_solicitado',
            ])->default('aguardando_envio');
            $table->string('arquivo_cliente')->nullable()->comment('Arquivo enviado pelo cliente');
            $table->string('arquivo_final')->nullable()->comment('Arquivo final desenvolvido');
            $table->text('briefing')->nullable()->comment('Instruções do cliente');
            $table->text('observacoes')->nullable();
            $table->integer('numero_revisao')->default(0);
            $table->timestamp('prazo_entrega')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('arte_revisoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('arte_id')->constrained('artes')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->integer('numero_revisao');
            $table->string('arquivo')->nullable();
            $table->text('comentario')->nullable();
            $table->enum('acao', ['enviou', 'aprovou', 'rejeitou', 'solicitou_revisao']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('arte_revisoes');
        Schema::dropIfExists('artes');
    }
};
