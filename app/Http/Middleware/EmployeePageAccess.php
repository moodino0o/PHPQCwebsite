<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EmployeePageAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $path = trim($request->path(), '/');

        $permission = match (true) {
            $path === '' => 'dashboard.view',
            $path === 'analytics' => 'analytics.view',
            $path === 'records' || str_starts_with($path, 'records/') => 'qc_records.view',
            $path === 'masonry-tests' => 'masonry.view',
            $path === 'complaints' => 'complaints.view',
            $path === 'reports' => 'reports.view',
            $path === 'report-designer' => 'reports.manage',
            $path === 'archive' => 'archive.view',
            $path === 'standards' => 'standards.view',
            $path === 'settings' => 'settings.manage',
            $path === 'users' => 'users.manage',
            default => 'dashboard.view',
        };

        $employee = $request->session()->get('employee');

        if (
            !$employee ||
            !EmployeePermission::allows($employee, $permission)
        ) {
            return response(
                'You do not have permission to access this page.',
                403
            );
        }

        return $next($request);
    }
}
