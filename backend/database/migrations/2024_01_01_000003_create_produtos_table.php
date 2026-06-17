<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categorias_produto', function (Blueprint $table) {
            $table->id();
            $table->string('nome')->unique();
            $table->string('descricao')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('produtos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('categoria_id')->nullable()->constrained('categorias_produto')->nullOnDelete();
            $table->string('nome');
            $table->text('descricao')->nullable();
            $table->decimal('preco_base', 10, 2)->default(0);
            $table->string('unidade_medida', 20)->default('un')->comment('un, m², m, kg, etc');
            $table->integer('tempo_producao_dias')->default(1)->comment('Prazo em dias úteis');
            $table->boolean('personalizado')->default(true)->comment('Exige arte do cliente');
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('produtos');
        Schema::dropIfExists('categorias_produto');
    }
};
