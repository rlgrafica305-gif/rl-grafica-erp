<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\OrcamentoController;
use App\Http\Controllers\PedidoController;
use App\Http\Controllers\ArteController;
use App\Http\Controllers\ProducaoController;
use App\Http\Controllers\EstoqueController;
use App\Http\Controllers\FinanceiroController;
use App\Http\Controllers\RelatorioController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\VendaController;

// ─── Autenticação pública ───────────────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login']);

// ─── Rotas autenticadas ─────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::get('/me',              [AuthController::class, 'me']);
    Route::put('/me',              [AuthController::class, 'updateProfile']);
    Route::post('/logout',         [AuthController::class, 'logout']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Clientes (admin, vendedor)
    Route::middleware('role:admin,vendedor')->group(function () {
        Route::post('/clientes/importar', [ClienteController::class, 'importar']);
        Route::apiResource('clientes', ClienteController::class);
        Route::get('/cep/{cep}', [ClienteController::class, 'buscarCep']);
    });

    // Orçamentos (admin, vendedor)
    Route::middleware('role:admin,vendedor')->group(function () {
        Route::apiResource('orcamentos', OrcamentoController::class);
        Route::post('/orcamentos/{orcamento}/converter',     [OrcamentoController::class, 'converterEmPedido']);
        Route::patch('/orcamentos/{orcamento}/status',       [OrcamentoController::class, 'mudarStatus']);
    });

    // Venda Rápida
    Route::middleware('role:admin,vendedor')->group(function () {
        Route::get('/vendas/buscar-cliente', [VendaController::class, 'buscarCliente']);
        Route::post('/vendas/rapida',        [VendaController::class, 'rapida']);
    });

    // Pedidos
    Route::get('/pedidos',         [PedidoController::class, 'index']);
    Route::get('/pedidos/{pedido}',[PedidoController::class, 'show']);
    Route::middleware('role:admin,vendedor')->group(function () {
        Route::post('/pedidos',              [PedidoController::class, 'store']);
        Route::put('/pedidos/{pedido}',      [PedidoController::class, 'update']);
        Route::delete('/pedidos/{pedido}',   [PedidoController::class, 'destroy']);
        Route::post('/pedidos/{pedido}/conta-receber', [PedidoController::class, 'gerarContaReceber']);
    });
    Route::patch('/pedidos/{pedido}/status', [PedidoController::class, 'mudarStatus']);

    // Artes
    Route::get('/artes',                              [ArteController::class, 'index']);
    Route::get('/artes/{arte}',                       [ArteController::class, 'show']);
    Route::middleware('role:admin,vendedor')->group(function () {
        Route::post('/artes',                         [ArteController::class, 'store']);
    });
    Route::middleware('role:admin,designer')->group(function () {
        Route::post('/artes/{arte}/upload-final',     [ArteController::class, 'uploadArteFinal']);
        Route::post('/artes/{arte}/atribuir',         [ArteController::class, 'atribuirDesigner']);
        Route::post('/artes/{arte}/aprovar',          [ArteController::class, 'aprovar']);
        Route::post('/artes/{arte}/rejeitar',         [ArteController::class, 'rejeitar']);
    });
    Route::post('/artes/{arte}/upload-cliente',   [ArteController::class, 'uploadArteCliente']);

    // Produção
    Route::get('/producao',                       [ProducaoController::class, 'index']);
    Route::get('/producao/fila',                  [ProducaoController::class, 'fila']);
    Route::get('/producao/{producao}',            [ProducaoController::class, 'show']);
    Route::middleware('role:admin')->group(function () {
        Route::post('/producao',                  [ProducaoController::class, 'store']);
        Route::post('/producao/reordenar',        [ProducaoController::class, 'reordenar']);
    });
    Route::post('/producao/{producao}/iniciar',   [ProducaoController::class, 'iniciar']);
    Route::post('/producao/{producao}/concluir',  [ProducaoController::class, 'concluir']);
    Route::post('/producao/{producao}/atribuir',  [ProducaoController::class, 'atribuir']);

    // Estoque (admin)
    Route::middleware('role:admin')->group(function () {
        // Insumos
        Route::get('/estoque/insumos',                    [EstoqueController::class, 'indexInsumos']);
        Route::post('/estoque/insumos',                   [EstoqueController::class, 'storeInsumo']);
        Route::put('/estoque/insumos/{insumo}',           [EstoqueController::class, 'updateInsumo']);
        Route::post('/estoque/insumos/{insumo}/mover',    [EstoqueController::class, 'movimentar']);
        Route::get('/estoque/insumos/{insumo}/historico', [EstoqueController::class, 'historicoMovimentacoes']);
        Route::get('/estoque/alertas',                    [EstoqueController::class, 'alertas']);
        // Fornecedores
        Route::get('/estoque/fornecedores',               [EstoqueController::class, 'indexFornecedores']);
        Route::post('/estoque/fornecedores',              [EstoqueController::class, 'storeFornecedor']);
        Route::put('/estoque/fornecedores/{fornecedor}',  [EstoqueController::class, 'updateFornecedor']);
        Route::delete('/estoque/fornecedores/{fornecedor}',[EstoqueController::class, 'destroyFornecedor']);
    });

    // Financeiro (admin)
    Route::middleware('role:admin')->group(function () {
        Route::get('/financeiro/resumo',                     [FinanceiroController::class, 'resumoFinanceiro']);
        Route::get('/financeiro/fluxo-caixa',                [FinanceiroController::class, 'fluxoCaixa']);
        // Contas a receber
        Route::get('/financeiro/receber',                    [FinanceiroController::class, 'indexReceber']);
        Route::post('/financeiro/receber',                   [FinanceiroController::class, 'storeReceber']);
        Route::post('/financeiro/receber/{conta}/receber',   [FinanceiroController::class, 'receberPagamento']);
        Route::delete('/financeiro/receber/{conta}',         [FinanceiroController::class, 'destroyReceber']);
        // Contas a pagar
        Route::get('/financeiro/pagar',                      [FinanceiroController::class, 'indexPagar']);
        Route::post('/financeiro/pagar',                     [FinanceiroController::class, 'storePagar']);
        Route::post('/financeiro/pagar/{conta}/pagar',       [FinanceiroController::class, 'pagarConta']);
        Route::get('/financeiro/relatorio',                  [FinanceiroController::class, 'relatorio']);
    });

    // Relatórios (admin)
    Route::middleware('role:admin')->prefix('relatorios')->group(function () {
        Route::get('/produtos-mais-vendidos',  [RelatorioController::class, 'produtosMaisVendidos']);
        Route::get('/clientes-top',            [RelatorioController::class, 'clientesQueMaisCompram']);
        Route::get('/lucro-periodo',           [RelatorioController::class, 'lucroPorPeriodo']);
        Route::get('/desempenho-vendedores',   [RelatorioController::class, 'desempenhoVendedores']);
        Route::get('/status-pedidos',          [RelatorioController::class, 'statusPedidos']);
    });

    // Usuários (admin)
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('usuarios', UsuarioController::class);
    });

    // Produtos (leitura para todos)
    Route::get('/produtos', fn() => \App\Models\Produto::with('categoria')->ativos()->orderBy('nome')->get());
    Route::get('/categorias', fn() => \App\Models\CategoriaProduto::where('active', true)->orderBy('nome')->get());
    Route::get('/designers', fn() => \App\Models\User::where('role', 'designer')->where('active', true)->orderBy('name')->get(['id', 'name']));
    Route::get('/operadores', fn() => \App\Models\User::whereIn('role', ['producao', 'admin'])->where('active', true)->orderBy('name')->get(['id', 'name']));
});
