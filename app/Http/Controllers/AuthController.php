<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /*
    |------------------------------------------------------------------
    | Inscription d'un nouvel utilisateur
    | POST /api/register
    |------------------------------------------------------------------
    */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'prohibited',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'membre',
            'date_creation' => now(),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        // Construire l'URL complète de la photo
        $user->photo = $user->photo ? url(Storage::url($user->photo)) : null;

        return response()->json([
            'message' => 'Inscription réussie',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    /*
    |------------------------------------------------------------------
    | Connexion d'un utilisateur existant
    | POST /api/login
    |------------------------------------------------------------------
    */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants sont incorrects.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        // Construire l'URL complète de la photo
        $user->photo = $user->photo ? url(Storage::url($user->photo)) : null;

        return response()->json([
            'message' => 'Connexion réussie',
            'user' => $user,
            'token' => $token,
        ]);
    }

    /*
    |------------------------------------------------------------------
    | Déconnexion de l'utilisateur connecté
    | POST /api/logout
    |------------------------------------------------------------------
    */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnexion réussie']);
    }

    /*
    |------------------------------------------------------------------
    | Récupérer le profil de l'utilisateur connecté
    | GET /api/me
    |------------------------------------------------------------------
    */
    public function me(Request $request)
    {
        $user = $request->user();
        // Construire l'URL complète de la photo
        $user->photo = $user->photo ? url(Storage::url($user->photo)) : null;

        return response()->json($user);
    }
}
