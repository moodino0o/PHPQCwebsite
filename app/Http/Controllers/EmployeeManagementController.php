<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class EmployeeManagementController extends Controller
{
    private const ROLES = [
        'administrator',
        'manager',
        'qc_engineer',
        'lab_technician',
        'viewer',
    ];

    public function index()
    {
        $employees = DB::table('employee_directory as d')
            ->leftJoin('employee_access as a', 'a.employee_id', '=', 'd.employee_id')
            ->select(
                'd.employee_id',
                'd.name',
                'd.active as directory_active',
                'd.created_at',
                'a.active as access_active',
                'a.role',
                'a.administrator'
            )
            ->orderBy('d.name')
            ->get()
            ->map(function ($employee) {
                $employee->active =
                    (bool) $employee->directory_active &&
                    (bool) ($employee->access_active ?? false);

                $employee->role = \App\Http\Middleware\EmployeePermission::normalizeRole([
                    'role' => $employee->role ?: 'viewer',
                    'administrator' => (bool) $employee->administrator,
                ]);

                $employee->administrator =
                    $employee->role === 'administrator';

                return $employee;
            });
        return response()->json(['employees' => $employees]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => [
                'required',
                'string',
                'max:64',
                'unique:employee_directory,employee_id',
            ],
            'name' => ['required', 'string', 'max:255'],
            'role' => ['required', Rule::in(self::ROLES)],
            'password' => ['required', 'string', 'min:8'],
        ]);

        DB::transaction(function () use ($validated) {
            DB::table('employee_directory')->insert([
                'employee_id' => $validated['employee_id'],
                'name' => $validated['name'],
                'active' => true,
                'password_hash' => Hash::make($validated['password']),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('employee_access')->insert([
                'employee_id' => $validated['employee_id'],
                'active' => true,
                'administrator' => $validated['role'] === 'administrator',
                'role' => $validated['role'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        return response()->json([
            'message' => 'Employee account created successfully.',
        ], 201);
    }

    public function update(Request $request, string $employeeId)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'role' => ['required', Rule::in(self::ROLES)],
            'active' => ['required', 'boolean'],
        ]);

        $employee = DB::table('employee_directory')
            ->where('employee_id', $employeeId)
            ->first();

        if (!$employee) {
            return response()->json(['message' => 'Employee not found.'], 404);
        }

        $current = $request->session()->get('employee');
        $isSelf = ($current['employee_id'] ?? null) === $employeeId;

        if ($isSelf && (
            !$validated['active'] ||
            $validated['role'] !== 'administrator'
        )) {
            return response()->json([
                'message' => 'You cannot deactivate or remove your own administrator access.',
            ], 422);
        }

        $wasAdmin = DB::table('employee_access')
            ->where('employee_id', $employeeId)
            ->where('administrator', true)
            ->where('active', true)
            ->exists();

        $willBeAdmin =
            $validated['active'] &&
            $validated['role'] === 'administrator';

        if ($wasAdmin && !$willBeAdmin && $this->activeAdminCount() <= 1) {
            return response()->json([
                'message' => 'You cannot remove the last active administrator.',
            ], 422);
        }

        DB::transaction(function () use ($validated, $employeeId) {
            DB::table('employee_directory')
                ->where('employee_id', $employeeId)
                ->update([
                    'name' => $validated['name'],
                    'active' => $validated['active'],
                    'updated_at' => now(),
                ]);

            DB::table('employee_access')->updateOrInsert(
                ['employee_id' => $employeeId],
                [
                    'active' => $validated['active'],
                    'role' => $validated['role'],
                    'administrator' => $validated['role'] === 'administrator',
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        });

        return response()->json([
            'message' => 'Employee account updated successfully.',
        ]);
    }

    public function updatePassword(Request $request, string $employeeId)
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8'],
        ]);

        $updated = DB::table('employee_directory')
            ->where('employee_id', $employeeId)
            ->update([
                'password_hash' => Hash::make($validated['password']),
                'updated_at' => now(),
            ]);

        if (!$updated) {
            return response()->json(['message' => 'Employee not found.'], 404);
        }

        return response()->json([
            'message' => 'Employee password reset successfully.',
        ]);
    }

    private function activeAdminCount(): int
    {
        return DB::table('employee_directory as d')
            ->join('employee_access as a', 'a.employee_id', '=', 'd.employee_id')
            ->where('d.active', true)
            ->where('a.active', true)
            ->where('a.administrator', true)
            ->count();
    }
}