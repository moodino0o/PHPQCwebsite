<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EmployeePermission
{
    public static function normalizeRole(array $employee): string
    {
        if (
            ($employee['administrator'] ?? false) ||
            ($employee['role'] ?? '') === 'administrator'
        ) {
            return 'administrator';
        }

        return match ($employee['role'] ?? '') {
            'technician' => 'lab_technician',
            'visitor' => 'viewer',
            default => $employee['role'] ?? 'viewer',
        };
    }

    public static function allows(array $employee, string $permission): bool
    {
        $role = self::normalizeRole($employee);

        if ($role === 'administrator') {
            return true;
        }

        $permissions = [
            'manager' => [
                'dashboard.view', 'analytics.view',
                'qc_records.view', 'qc_records.create',
                'qc_records.update', 'qc_records.delete',
                'masonry.view', 'masonry.create',
                'masonry.update', 'masonry.delete',
                'complaints.view', 'complaints.create',
                'complaints.update', 'complaints.delete',
                'reports.view', 'reports.manage',
                'archive.view', 'archive.manage',
                'standards.view', 'standards.manage',
                'reference.view', 'settings.manage',
            ],

            'qc_engineer' => [
                'dashboard.view', 'analytics.view',
                'qc_records.view', 'qc_records.create',
                'qc_records.update', 'qc_records.delete',
                'masonry.view', 'masonry.create',
                'masonry.update', 'masonry.delete',
                'complaints.view', 'complaints.create',
                'complaints.update', 'complaints.delete',
                'reports.view', 'reports.manage',
                'archive.view',
                'standards.view', 'standards.manage',
                'reference.view',
            ],

            'lab_technician' => [
                'dashboard.view', 'analytics.view',
                'qc_records.view', 'qc_records.create',
                'masonry.view', 'masonry.create',
                'complaints.view',
                'reports.view',
                'archive.view',
                'standards.view',
                'reference.view',
            ],

            'viewer' => [
                'dashboard.view', 'analytics.view',
                'qc_records.view',
                'masonry.view',
                'complaints.view',
                'reports.view',
                'archive.view',
                'standards.view',
                'reference.view',
            ],
        ];

        return in_array(
            $permission,
            $permissions[$role] ?? [],
            true
        );
    }

    public function handle(
        Request $request,
        Closure $next,
        string $permission
    ): Response {
        $employee = $request->session()->get('employee');

        if (
            !$employee ||
            !self::allows($employee, $permission)
        ) {
            return response()->json([
                'message' => 'You do not have permission to perform this action.',
                'required_permission' => $permission,
            ], 403);
        }

        return $next($request);
    }
}
