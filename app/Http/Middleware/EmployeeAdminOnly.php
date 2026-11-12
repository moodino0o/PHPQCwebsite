<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EmployeeAdminOnly
{
    public function handle(Request $request, Closure $next): Response
    {
        $employee = $request->session()->get('employee');

        if (
            !$employee ||
            (
                !($employee['administrator'] ?? false) &&
                ($employee['role'] ?? '') !== 'administrator'
            )
        ) {
            return response()->json([
                'message' => 'Administrator access required.',
            ], 403);
        }

        return $next($request);
    }
}