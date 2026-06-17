<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->enum('status_pagamento', ['pago', 'sinal_entrada', 'aguardando_pagamento'])
                ->default('aguardando_pagamento')
                ->after('forma_pagamento');
        });
    }

    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropColumn('status_pagamento');
        });
    }
};
