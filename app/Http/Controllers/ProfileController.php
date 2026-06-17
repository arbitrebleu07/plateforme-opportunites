<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
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

        // Gérer l'upload de photo
        if ($request->hasFile('photo')) {
            // Supprimer l'ancienne photo si elle existe
            if ($user->photo) {
                Storage::disk('public')->delete($user->photo);
            }
            
            $path = $request->file('photo')->store('photos', 'public');
            $user->photo = $path;
        }

        $user->save();

        // Construire l'URL complète de la photo
        $user->photo = $user->photo ? url(Storage::url($user->photo)) : null;

        return response()->json([
            'message' => 'Profil mis à jour avec succès',
            'user' => $user,
        ]);
    }

    /*
    |------------------------------------------------------------------
    | Supprimer la photo de profil de l'utilisateur connecté
    | DELETE /api/profile/photo
    |------------------------------------------------------------------
    */
    public function deletePhoto(Request $request)
    {
        $user = $request->user();

        // Supprimer la photo si elle existe
        if ($user->photo) {
            Storage::disk('public')->delete($user->photo);
            $user->photo = null;
            $user->save();
        }

        return response()->json([
            'message' => 'Photo de profil supprimée avec succès',
        ]);
    }
}
