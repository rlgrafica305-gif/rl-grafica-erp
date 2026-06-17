<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Não autenticado.'], 401);
        }

        if (!$user->active) {
            return response()->json(['message' => 'Usuário inativo.'], 403);
        }

        if (!empty($roles) && !in_array($user->role, $roles)) {
            return response()->json([
                'message' => 'Acesso negado. Papel necessário: ' . implode(' ou ', $roles),
                'seu_papel'=> $user->role,
            ], 403);
        }

        return $next($request);
    }
}
