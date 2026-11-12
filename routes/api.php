
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HealthController;

Route::get('/healthz', [HealthController::class, 'show']);
