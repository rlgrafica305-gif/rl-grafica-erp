<?php

namespace App\Http\Controllers;

use App\Models\Arte;
use App\Models\ArteRevisao;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class ArteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Arte::with(['pedido.cliente:id,nome', 'designer:id,name'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->pedido_id, fn($q) => $q->where('pedido_id', $request->pedido_id))
            ->orderByDesc('created_at');

        if ($request->user()->role === 'designer') {
            $query->where('designer_id', $request->user()->id)
                  ->orWhereNull('designer_id');
        }

        return response()->json($query->paginate($request->get('per_page', 20)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'pedido_id'   => 'required|exists:pedidos,id',
            'designer_id' => 'nullable|exists:users,id',
            'briefing'    => 'nullable|string',
            'prazo_entrega' => 'nullable|date',
        ]);

        $arte = Arte::create([...$data, 'status' => 'aguardando_envio']);
        return response()->json($arte->load(['pedido.cliente', 'designer:id,name']), 201);
    }

    public function show(Arte $arte): JsonResponse
    {
        return response()->json($arte->load(['pedido.cliente', 'designer:id,name', 'revisoes.autor:id,name']));
    }

    public function uploadArteCliente(Request $request, Arte $arte): JsonResponse
    {
        $request->validate(['arquivo' => 'required|file|mimes:pdf,ai,psd,eps,png,jpg,jpeg,zip|max:51200']);

        if ($arte->arquivo_cliente) {
            Storage::disk('public')->delete($arte->arquivo_cliente);
        }

        $path = $request->file('arquivo')->store('artes/clientes', 'public');
        $arte->update(['arquivo_cliente' => $path, 'status' => 'em_desenvolvimento']);

        ArteRevisao::create([
            'arte_id'        => $arte->id,
            'created_by'     => $request->user()->id,
            'numero_revisao' => 0,
            'arquivo'        => $path,
            'comentario'     => 'Arte do cliente enviada.',
            'acao'           => 'enviou',
        ]);

        return response()->json($arte->fresh()->load('revisoes.autor:id,name'));
    }

    public function uploadArteFinal(Request $request, Arte $arte): JsonResponse
    {
        $request->validate([
            'arquivo'    => 'required|file|mimes:pdf,ai,psd,eps,png,jpg,jpeg,zip|max:51200',
            'comentario' => 'nullable|string',
        ]);

        if ($arte->arquivo_final) {
            Storage::disk('public')->delete($arte->arquivo_final);
        }

        $revisao = $arte->numero_revisao + 1;
        $path = $request->file('arquivo')->store('artes/finais', 'public');

        $arte->update([
            'arquivo_final'  => $path,
            'status'         => 'aguardando_aprovacao',
            'numero_revisao' => $revisao,
        ]);

        ArteRevisao::create([
            'arte_id'        => $arte->id,
            'created_by'     => $request->user()->id,
            'numero_revisao' => $revisao,
            'arquivo'        => $path,
            'comentario'     => $request->comentario,
            'acao'           => 'enviou',
        ]);

        return response()->json($arte->fresh()->load('revisoes.autor:id,name'));
    }

    public function aprovar(Request $request, Arte $arte): JsonResponse
    {
        $arte->update(['status' => 'aprovada']);

        ArteRevisao::create([
            'arte_id'        => $arte->id,
            'created_by'     => $request->user()->id,
            'numero_revisao' => $arte->numero_revisao,
            'comentario'     => $request->comentario ?? 'Arte aprovada.',
            'acao'           => 'aprovou',
        ]);

        return response()->json($arte->fresh()->load('revisoes.autor:id,name'));
    }

    public function rejeitar(Request $request, Arte $arte): JsonResponse
    {
        $request->validate(['comentario' => 'required|string']);

        $arte->update(['status' => 'reenvio_solicitado']);

        ArteRevisao::create([
            'arte_id'        => $arte->id,
            'created_by'     => $request->user()->id,
            'numero_revisao' => $arte->numero_revisao,
            'comentario'     => $request->comentario,
            'acao'           => 'rejeitou',
        ]);

        return response()->json($arte->fresh()->load('revisoes.autor:id,name'));
    }

    public function atribuirDesigner(Request $request, Arte $arte): JsonResponse
    {
        $request->validate(['designer_id' => 'required|exists:users,id']);
        $arte->update(['designer_id' => $request->designer_id, 'status' => 'em_desenvolvimento']);
        return response()->json($arte->load('designer:id,name'));
    }
}
