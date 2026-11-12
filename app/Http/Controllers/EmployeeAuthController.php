<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class EmployeeAuthController extends Controller
{
    public function showLogin()
    {
        if (session()->has('employee')) {
            return redirect('/');
        }

        return view('auth.login');
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $employee = DB::table('employee_directory as d')
            ->join('employee_access as a', 'a.employee_id', '=', 'd.employee_id')
            ->where('d.employee_id', $validated['employee_id'])
            ->select(
                'd.employee_id',
                'd.name',
                'd.password_hash',
                'd.active as directory_active',
                'a.active as access_active',
                'a.role',
                'a.administrator'
            )
            ->first();

        if (
            !$employee ||
            !$employee->directory_active ||
            !$employee->access_active ||
            !$employee->password_hash ||
            !Hash::check($validated['password'], $employee->password_hash)
        ) {
            return back()
                ->withInput($request->only('employee_id'))
                ->withErrors([
                    'employee_id' => 'Invalid employee ID or password, or account is inactive.',
                ]);
        }

        $request->session()->regenerate();

        $request->session()->put('employee', [
            'employee_id' => $employee->employee_id,
            'name' => $employee->name,
            'role' => \App\Http\Middleware\EmployeePermission::normalizeRole([
                'role' => $employee->role,
                'administrator' => (bool) $employee->administrator,
            ]),
            'administrator' => (bool) $employee->administrator,
        ]);

        return redirect()->intended('/');
    }

    public function logout(Request $request)
    {
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }

    public function currentUser(Request $request)
    {
        return response()->json([
            'employee' => $request->session()->get('employee'),
        ]);
    }
}

