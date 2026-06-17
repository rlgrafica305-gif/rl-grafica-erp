<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ClienteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Cliente::query()->with('criador:id,name');

        if ($request->busca) {
            $query->busca($request->busca);
        }
        if ($request->filled('active')) {
            $query->where('active', $request->boolean('active'));
        }
        if ($request->filled('tipo_pessoa')) {
            $query->where('tipo_pessoa', $request->tipo_pessoa);
        }

        $clientes = $query->orderBy('nome')
            ->paginate($request->get('per_page', 20));

        return response()->json($clientes);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nome'        => 'required|string|max:255',
            'tipo_pessoa' => 'required|in:F,J',
            'cpf_cnpj'    => 'nullable|string|max:20|unique:clientes,cpf_cnpj',
            'telefone'    => 'nullable|string|max:20',
            'whatsapp'    => 'nullable|string|max:20',
            'email'       => 'nullable|email|max:255',
            'cep'         => 'nullable|string|max:10',
            'logradouro'  => 'nullable|string|max:255',
            'numero'      => 'nullable|string|max:20',
            'complemento' => 'nullable|string|max:100',
            'bairro'      => 'nullable|string|max:100',
            'cidade'      => 'nullable|string|max:100',
            'estado'      => 'nullable|string|max:2',
            'observacoes' => 'nullable|string',
        ]);

        $data['created_by'] = auth()->id();
        $cliente = Cliente::create($data);

        return response()->json($cliente->load('criador:id,name'), 201);
    }

    public function show(Cliente $cliente): JsonResponse
    {
        $cliente->load(['criador:id,name']);

        $historico = $cliente->pedidos()
            ->with(['itens.produto', 'vendedor:id,name'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get(['id', 'numero', 'status', 'total', 'prazo_entrega', 'created_at', 'vendedor_id']);

        return response()->json([
            ...$cliente->toArray(),
            'total_compras'   => $cliente->total_compras,
            'total_pedidos'   => $cliente->pedidos()->count(),
            'historico_pedidos' => $historico,
        ]);
    }

    public function update(Request $request, Cliente $cliente): JsonResponse
    {
        $data = $request->validate([
            'nome'        => 'required|string|max:255',
            'tipo_pessoa' => 'required|in:F,J',
            'cpf_cnpj'    => 'nullable|string|max:20|unique:clientes,cpf_cnpj,' . $cliente->id,
            'telefone'    => 'nullable|string|max:20',
            'whatsapp'    => 'nullable|string|max:20',
            'email'       => 'nullable|email|max:255',
            'cep'         => 'nullable|string|max:10',
            'logradouro'  => 'nullable|string|max:255',
            'numero'      => 'nullable|string|max:20',
            'complemento' => 'nullable|string|max:100',
            'bairro'      => 'nullable|string|max:100',
            'cidade'      => 'nullable|string|max:100',
            'estado'      => 'nullable|string|max:2',
            'observacoes' => 'nullable|string',
            'active'      => 'boolean',
        ]);

        $cliente->update($data);
        return response()->json($cliente);
    }

    public function destroy(Cliente $cliente): JsonResponse
    {
        if ($cliente->pedidos()->whereNotIn('status', ['entregue', 'cancelado'])->exists()) {
            return response()->json(['message' => 'Cliente possui pedidos em aberto.'], 422);
        }
        $cliente->delete();
        return response()->json(null, 204);
    }

    public function importar(Request $request): JsonResponse
    {
        $request->validate([
            'contatos'           => 'required|array|min:1|max:5000',
            'contatos.*.nome'    => 'required|string|max:255',
            'contatos.*.telefone'=> 'nullable|string|max:30',
        ]);

        $criados    = 0;
        $duplicados = 0;

        foreach ($request->contatos as $contato) {
            $nome     = trim($contato['nome']);
            $telefone = isset($contato['telefone']) ? preg_replace('/\D/', '', trim($contato['telefone'])) : null;

            if (!$nome) continue;

            // Busca por telefone primeiro (mais preciso)
            $existentePorTel = $telefone
                ? Cliente::where('telefone', $telefone)->orWhere('whatsapp', $telefone)->first()
                : null;

            if ($existentePorTel) {
                $duplicados++;
                continue;
            }

            // Busca por nome
            $existentePorNome = Cliente::whereRaw('LOWER(nome) = ?', [mb_strtolower($nome)])->first();

            if ($existentePorNome) {
                // Atualiza telefone se estava vazio
                if ($telefone && !$existentePorNome->telefone) {
                    $existentePorNome->update(['telefone' => $telefone, 'whatsapp' => $telefone]);
                }
                $duplicados++;
                continue;
            }

            Cliente::create([
                'nome'       => $nome,
                'telefone'   => $telefone,
                'whatsapp'   => $telefone,
                'tipo_pessoa'=> 'F',
                'active'     => true,
                'created_by' => auth()->id(),
            ]);
            $criados++;
        }

        return response()->json([
            'criados'    => $criados,
            'duplicados' => $duplicados,
            'total'      => count($request->contatos),
        ]);
    }

    public function buscarCep(string $cep): JsonResponse
    {
        $cep = preg_replace('/\D/', '', $cep);
        $response = \Illuminate\Support\Facades\Http::get("https://viacep.com.br/ws/{$cep}/json/");

        if ($response->failed() || isset($response->json()['erro'])) {
            return response()->json(['message' => 'CEP não encontrado.'], 404);
        }

        $data = $response->json();
        return response()->json([
            'cep'        => $data['cep'],
            'logradouro' => $data['logradouro'],
            'bairro'     => $data['bairro'],
            'cidade'     => $data['localidade'],
            'estado'     => $data['uf'],
        ]);
    }
}
