<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Named route "login" is referenced by Laravel's default auth redirector
// (e.g. when an unauthenticated request hits a route under auth:sanctum
// outside of the api/* JSON pipeline). Returning a 401 JSON keeps the
// SPA flow consistent instead of throwing RouteNotFoundException.
Route::get('/login', fn () => response()->json(['message' => 'Unauthenticated.'], 401))->name('login');
