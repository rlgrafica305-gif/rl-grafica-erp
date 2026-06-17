<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class UsuarioController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('admin', $request->user());
        $users = User::when($request->role, fn($q) => $q->where('role', $request->role))
            ->when($request->busca, fn($q) => $q->where('name', 'like', "%{$request->busca}%")->orWhere('email', 'like', "%{$request->busca}%"))
            ->orderBy('name')
            ->paginate($request->get('per_page', 20));

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role'     => 'required|in:admin,vendedor,designer,producao',
            'telefone' => 'nullable|string|max:20',
        ]);

        $data['password'] = Hash::make($data['password']);
        $user = User::create($data);
        return response()->json($user, 201);
    }

    public function show(User $usuario): JsonResponse
    {
        return response()->json($usuario);
    }

    public function update(Request $request, User $usuario): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email,' . $usuario->id,
            'role'     => 'required|in:admin,vendedor,designer,producao',
            'telefone' => 'nullable|string|max:20',
            'active'   => 'boolean',
            'password' => 'nullable|string|min:6',
        ]);

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $usuario->update($data);
        return response()->json($usuario);
    }

    public function destroy(User $usuario): JsonResponse
    {
        if ($usuario->id === auth()->id()) {
            return response()->json(['message' => 'Não é possível excluir o próprio usuário.'], 422);
        }
        $usuario->delete();
        return response()->json(null, 204);
    }

    private function authorize(string $role, User $user): void
    {
        if ($user->role !== $role) {
            abort(403, 'Acesso negado.');
        }
    }
}
