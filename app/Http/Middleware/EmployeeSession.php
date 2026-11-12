<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class EmployeeSession
{
    public function handle(Request $request, Closure $next): Response
    {
        $sessionEmployee = $request->session()->get('employee');

        if (!$sessionEmployee) {
            return $this->unauthorized($request);
        }

        $employee = DB::table('employee_directory as d')
            ->join('employee_access as a', 'a.employee_id', '=', 'd.employee_id')
            ->where('d.employee_id', $sessionEmployee['employee_id'])
            ->select(
                'd.employee_id',
                'd.name',
                'd.active as directory_active',
                'a.active as access_active',
                'a.role',
                'a.administrator'
            )
            ->first();

        if (
            !$employee ||
            !$employee->directory_active ||
            !$employee->access_active
        ) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return $this->unauthorized($request);
        }

        $request->session()->put('employee', [
            'employee_id' => $employee->employee_id,
            'name' => $employee->name,
            'role' => EmployeePermission::normalizeRole([
                'role' => $employee->role,
                'administrator' => (bool) $employee->administrator,
            ]),
            'administrator' => (bool) $employee->administrator,
        ]);

        return $next($request);
    }

    private function unauthorized(Request $request): Response
    {
        if (
            $request->expectsJson() ||
            $request->is('api/*') ||
            $request->is('qc-records*')
        ) {
            return response()->json([
                'message' => 'Unauthenticated. Please log in.',
            ], 401);
        }

        return redirect('/login');
    }
}
