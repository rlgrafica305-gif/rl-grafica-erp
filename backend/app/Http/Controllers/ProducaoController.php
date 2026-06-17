<?php

namespace App\Http\Controllers;

use App\Models\Producao;
use App\Models\Pedido;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProducaoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Producao::with(['pedido.cliente:id,nome', 'operador:id,name'])
            ->when($request->setor, fn($q) => $q->where('setor', $request->setor))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->orderBy('prioridade')
            ->orderBy('ordem_fila');

        if ($request->user()->role === 'producao') {
            $query->where(function ($q) use ($request) {
                $q->where('operador_id', $request->user()->id)->orWhereNull('operador_id');
            });
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'pedido_id'   => 'required|exists:pedidos,id',
            'operador_id' => 'nullable|exists:users,id',
            'setor'       => 'required|in:pre_impressao,impressao,acabamento,embalagem,expedicao',
            'prioridade'  => 'integer|between:1,10',
            'instrucoes'  => 'nullable|string',
            'prazo'       => 'nullable|date',
        ]);

        $ordemMax = Producao::where('setor', $data['setor'])->max('ordem_fila') ?? 0;
        $producao = Producao::create([...$data, 'status' => 'na_fila', 'ordem_fila' => $ordemMax + 1]);

        // Atualiza status do pedido para em produção
        $pedido = Pedido::find($data['pedido_id']);
        if ($pedido->status !== 'em_producao') {
            $pedido->mudarStatus('em_producao', $request->user(), "Enviado para produção: {$data['setor']}");
        }

        return response()->json($producao->load(['pedido.cliente', 'operador:id,name']), 201);
    }

    public function show(Producao $producao): JsonResponse
    {
        return response()->json($producao->load(['pedido.cliente', 'pedido.itens.produto', 'operador:id,name']));
    }

    public function iniciar(Request $request, Producao $producao): JsonResponse
    {
        if ($producao->status !== 'na_fila') {
            return response()->json(['message' => 'Apenas itens na fila podem ser iniciados.'], 422);
        }
        $producao->iniciar();
        $producao->update(['operador_id' => $request->user()->id]);
        return response()->json($producao->load('operador:id,name'));
    }

    public function concluir(Producao $producao): JsonResponse
    {
        if ($producao->status !== 'em_andamento') {
            return response()->json(['message' => 'Apenas itens em andamento podem ser concluídos.'], 422);
        }
        $producao->concluir();
        return response()->json($producao);
    }

    public function atribuir(Request $request, Producao $producao): JsonResponse
    {
        $request->validate(['operador_id' => 'required|exists:users,id']);
        $producao->update(['operador_id' => $request->operador_id]);
        return response()->json($producao->load('operador:id,name'));
    }

    public function reordenar(Request $request): JsonResponse
    {
        $request->validate([
            'setor'  => 'required|string',
            'ordem'  => 'required|array',
            'ordem.*'=> 'integer|exists:producoes,id',
        ]);

        foreach ($request->ordem as $position => $id) {
            Producao::where('id', $id)->where('setor', $request->setor)->update(['ordem_fila' => $position + 1]);
        }

        return response()->json(['message' => 'Ordem atualizada.']);
    }

    public function fila(): JsonResponse
    {
        $setores = ['pre_impressao', 'impressao', 'acabamento', 'embalagem', 'expedicao'];
        $resultado = [];

        foreach ($setores as $setor) {
            $resultado[$setor] = Producao::with(['pedido.cliente:id,nome'])
                ->where('setor', $setor)
                ->whereIn('status', ['na_fila', 'em_andamento'])
                ->orderBy('prioridade')
                ->orderBy('ordem_fila')
                ->get();
        }

        return response()->json($resultado);
    }
}
