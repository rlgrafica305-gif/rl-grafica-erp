<?php

namespace App\Http\Controllers;

use App\Models\Insumo;
use App\Models\Fornecedor;
use App\Models\MovimentacaoEstoque;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class EstoqueController extends Controller
{
    // INSUMOS
    public function indexInsumos(Request $request): JsonResponse
    {
        $query = Insumo::with('fornecedor:id,nome')
            ->when($request->busca, fn($q) => $q->where('nome', 'like', "%{$request->busca}%"))
            ->when($request->alerta, fn($q) => $q->emAlerta())
            ->orderBy('nome');

        return response()->json($query->paginate($request->get('per_page', 20)));
    }

    public function storeInsumo(Request $request): JsonResponse
    {
        $data = $request->validate([
            'fornecedor_id'    => 'nullable|exists:fornecedores,id',
            'nome'             => 'required|string|max:255',
            'codigo'           => 'nullable|string|max:50|unique:insumos,codigo',
            'descricao'        => 'nullable|string',
            'unidade_medida'   => 'required|string|max:20',
            'quantidade_atual' => 'numeric|min:0',
            'estoque_minimo'   => 'numeric|min:0',
            'estoque_maximo'   => 'nullable|numeric|min:0',
            'custo_unitario'   => 'numeric|min:0',
        ]);

        $insumo = Insumo::create($data);
        return response()->json($insumo->load('fornecedor:id,nome'), 201);
    }

    public function updateInsumo(Request $request, Insumo $insumo): JsonResponse
    {
        $data = $request->validate([
            'fornecedor_id'    => 'nullable|exists:fornecedores,id',
            'nome'             => 'required|string|max:255',
            'unidade_medida'   => 'required|string|max:20',
            'estoque_minimo'   => 'numeric|min:0',
            'estoque_maximo'   => 'nullable|numeric|min:0',
            'custo_unitario'   => 'numeric|min:0',
            'active'           => 'boolean',
        ]);

        $insumo->update($data);
        return response()->json($insumo->load('fornecedor:id,nome'));
    }

    // MOVIMENTAÇÕES
    public function movimentar(Request $request, Insumo $insumo): JsonResponse
    {
        $data = $request->validate([
            'tipo'             => 'required|in:entrada,saida,ajuste,devolucao',
            'quantidade'       => 'required|numeric|min:0.001',
            'custo_unitario'   => 'nullable|numeric|min:0',
            'motivo'           => 'nullable|string',
            'observacoes'      => 'nullable|string',
            'data_movimentacao'=> 'required|date',
            'fornecedor_id'    => 'nullable|exists:fornecedores,id',
            'pedido_id'        => 'nullable|exists:pedidos,id',
        ]);

        if ($data['tipo'] === 'saida' && $insumo->quantidade_atual < $data['quantidade']) {
            return response()->json(['message' => 'Quantidade insuficiente em estoque.'], 422);
        }

        $mov = MovimentacaoEstoque::create([
            ...$data,
            'insumo_id'     => $insumo->id,
            'user_id'       => $request->user()->id,
            'custo_total'   => ($data['custo_unitario'] ?? 0) * $data['quantidade'],
        ]);

        return response()->json($mov->load(['insumo', 'usuario:id,name']), 201);
    }

    public function historicoMovimentacoes(Request $request, Insumo $insumo): JsonResponse
    {
        $movs = $insumo->movimentacoes()
            ->with(['usuario:id,name', 'fornecedor:id,nome'])
            ->orderByDesc('data_movimentacao')
            ->paginate($request->get('per_page', 20));

        return response()->json($movs);
    }

    public function alertas(): JsonResponse
    {
        $insumos = Insumo::emAlerta()->where('active', true)->with('fornecedor:id,nome')->get();
        return response()->json($insumos);
    }

    // FORNECEDORES
    public function indexFornecedores(Request $request): JsonResponse
    {
        $query = Fornecedor::query()
            ->when($request->busca, fn($q) => $q->where('nome', 'like', "%{$request->busca}%"))
            ->orderBy('nome');

        return response()->json($query->paginate($request->get('per_page', 20)));
    }

    public function storeFornecedor(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nome'      => 'required|string|max:255',
            'cnpj'      => 'nullable|string|max:20|unique:fornecedores,cnpj',
            'telefone'  => 'nullable|string|max:20',
            'whatsapp'  => 'nullable|string|max:20',
            'email'     => 'nullable|email',
            'contato'   => 'nullable|string|max:100',
            'cep'       => 'nullable|string|max:10',
            'logradouro'=> 'nullable|string',
            'numero'    => 'nullable|string|max:20',
            'cidade'    => 'nullable|string|max:100',
            'estado'    => 'nullable|string|max:2',
            'observacoes' => 'nullable|string',
        ]);

        $fornecedor = Fornecedor::create($data);
        return response()->json($fornecedor, 201);
    }

    public function updateFornecedor(Request $request, Fornecedor $fornecedor): JsonResponse
    {
        $data = $request->validate([
            'nome'      => 'required|string|max:255',
            'cnpj'      => 'nullable|string|max:20|unique:fornecedores,cnpj,' . $fornecedor->id,
            'telefone'  => 'nullable|string|max:20',
            'email'     => 'nullable|email',
            'contato'   => 'nullable|string|max:100',
            'active'    => 'boolean',
        ]);

        $fornecedor->update($data);
        return response()->json($fornecedor);
    }

    public function destroyFornecedor(Fornecedor $fornecedor): JsonResponse
    {
        if ($fornecedor->insumos()->exists()) {
            return response()->json(['message' => 'Fornecedor possui insumos cadastrados.'], 422);
        }
        $fornecedor->delete();
        return response()->json(null, 204);
    }
}
