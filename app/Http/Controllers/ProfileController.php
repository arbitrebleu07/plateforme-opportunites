<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    /*
    |------------------------------------------------------------------
    | Mettre à jour le profil de l'utilisateur connecté
    | POST /api/profile
    |------------------------------------------------------------------
    */
    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $user->name = $request->name;
        $user->email = $request->email;

        if ($request->hasFile('photo')) {
            if ($user->photo) {
                Storage::disk('public')->delete($user->photo);
            }

            $path = $request->file('photo')->store('photos', 'public');
            if (!$path) {
                Log::error('Échec de l\'upload de la photo pour l\'utilisateur ' . $user->id);
                return response()->json([
                    'message' => 'Erreur lors de l\'upload de la photo',
                ], 500);
            }
            $user->photo = $path;
        }

        $user->save();

        return response()->json([
            'message' => 'Profil mis à jour avec succès',
            'user' => $user,
        ]);
    }
}
