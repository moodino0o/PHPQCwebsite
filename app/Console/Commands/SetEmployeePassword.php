<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SetEmployeePassword extends Command
{
    protected $signature = 'employee:set-password
                            {employee_id : Existing employee ID}
                            {--admin : Grant administrator access}';

    protected $description = 'Set an employee password and optionally grant administrator access';

    public function handle(): int
    {
        $employeeId = $this->argument('employee_id');

        $employee = DB::table('employee_directory')
            ->where('employee_id', $employeeId)
            ->first();

        if (!$employee) {
            $this->error('Employee ID was not found in employee_directory.');
            return self::FAILURE;
        }

        $password = $this->secret('Enter the new password');

        $confirmation = $this->secret('Confirm the new password');

        if ($password !== $confirmation) {
            $this->error('Passwords do not match.');
            return self::FAILURE;
        }

        $existingAccess = DB::table('employee_access')
            ->where('employee_id', $employeeId)
            ->first();

        $isAdmin = (bool) $this->option('admin');

        DB::transaction(function () use (
            $employeeId,
            $password,
            $existingAccess,
            $isAdmin
        ) {
            DB::table('employee_directory')
                ->where('employee_id', $employeeId)
                ->update([
                    'password_hash' => Hash::make($password),
                    'active' => true,
                    'updated_at' => now(),
                ]);

            DB::table('employee_access')->updateOrInsert(
                ['employee_id' => $employeeId],
                [
                    'active' => true,
                    'administrator' => $isAdmin
                        ? true
                        : (bool) ($existingAccess->administrator ?? false),
                    'role' => $isAdmin
                        ? 'administrator'
                        : ($existingAccess->role ?? 'technician'),
                    'updated_at' => now(),
                    'created_at' => $existingAccess->created_at ?? now(),
                ]
            );
        });

        $this->info('Employee password updated successfully.');

        if ($isAdmin) {
            $this->info('Administrator access has been granted.');
        }

        return self::SUCCESS;
    }
}
