<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\EmployeeAuthController;
use App\Http\Controllers\EmployeeManagementController;
use App\Http\Controllers\QcRecordController;
use App\Http\Controllers\MasonryTestController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\QcReportController;
use App\Http\Controllers\QcArchivedReportController;
use App\Http\Controllers\QcStandardController;
use App\Http\Controllers\QcReferenceDataController;
use App\Http\Controllers\QcFormOptionsController;

use App\Http\Middleware\EmployeeSession;
use App\Http\Middleware\EmployeeAdminOnly;
use App\Http\Middleware\EmployeePermission;
use App\Http\Middleware\EmployeePageAccess;

// Public authentication routes
Route::get('/login', [EmployeeAuthController::class, 'showLogin']);
Route::post('/login', [EmployeeAuthController::class, 'login']);

// All application routes require login
Route::middleware([EmployeeSession::class])->group(function () {

    Route::post('/logout', [EmployeeAuthController::class, 'logout']);
    Route::get('/api/current-user', [EmployeeAuthController::class, 'currentUser']);

    // QC Records
    Route::get('/qc-records', [QcRecordController::class, 'index'])
        ->middleware(EmployeePermission::class . ':qc_records.view');

    Route::post('/qc-records', [QcRecordController::class, 'store'])
        ->middleware(EmployeePermission::class . ':qc_records.create');

    Route::patch('/qc-records/{qcRecord}', [QcRecordController::class, 'update'])
        ->middleware(EmployeePermission::class . ':qc_records.update');

    Route::delete('/qc-records/{qcRecord}', [QcRecordController::class, 'destroy'])
        ->middleware(EmployeePermission::class . ':qc_records.delete');

    Route::get('/qc-records/{qcRecord}/history', [QcRecordController::class, 'history'])
        ->middleware(EmployeePermission::class . ':qc_records.view');

    // Masonry Testing
    Route::get('/api/masonry-tests', [MasonryTestController::class, 'index'])
        ->middleware(EmployeePermission::class . ':masonry.view');

    Route::post('/api/masonry-tests', [MasonryTestController::class, 'store'])
        ->middleware(EmployeePermission::class . ':masonry.create');

    Route::patch('/api/masonry-tests/{masonryTest}', [MasonryTestController::class, 'update'])
        ->middleware(EmployeePermission::class . ':masonry.update');

    Route::delete('/api/masonry-tests/{masonryTest}', [MasonryTestController::class, 'destroy'])
        ->middleware(EmployeePermission::class . ':masonry.delete');

    // Complaints
    Route::get('/api/complaints', [ComplaintController::class, 'index'])
        ->middleware(EmployeePermission::class . ':complaints.view');

    Route::post('/api/complaints', [ComplaintController::class, 'store'])
        ->middleware(EmployeePermission::class . ':complaints.create');

    Route::get('/api/complaints/{complaint}', [ComplaintController::class, 'show'])
        ->middleware(EmployeePermission::class . ':complaints.view');

    Route::patch('/api/complaints/{complaint}', [ComplaintController::class, 'update'])
        ->middleware(EmployeePermission::class . ':complaints.update');

    Route::delete('/api/complaints/{complaint}', [ComplaintController::class, 'destroy'])
        ->middleware(EmployeePermission::class . ':complaints.delete');

    // Reports
    Route::get('/api/reports', [QcReportController::class, 'index'])
        ->middleware(EmployeePermission::class . ':reports.view');

    Route::get('/api/report-layouts', [QcReportController::class, 'layouts'])
        ->middleware(EmployeePermission::class . ':reports.view');

    Route::post('/api/report-layouts', [QcReportController::class, 'updateLayout'])
        ->middleware(EmployeePermission::class . ':reports.manage');

    Route::get('/api/report-templates', [QcReportController::class, 'templates'])
        ->middleware(EmployeePermission::class . ':reports.view');

    Route::post('/api/report-templates', [QcReportController::class, 'createTemplate'])
        ->middleware(EmployeePermission::class . ':reports.manage');

    Route::patch('/api/report-templates/{template}', [QcReportController::class, 'updateTemplate'])
        ->middleware(EmployeePermission::class . ':reports.manage');

    Route::delete('/api/report-templates/{template}', [QcReportController::class, 'deleteTemplate'])
        ->middleware(EmployeePermission::class . ':reports.manage');

    Route::post('/api/report-templates/{template}/duplicate', [QcReportController::class, 'duplicateTemplate'])
        ->middleware(EmployeePermission::class . ':reports.manage');

    Route::post('/api/report-templates/{template}/default', [QcReportController::class, 'setDefault'])
        ->middleware(EmployeePermission::class . ':reports.manage');

    Route::get('/api/report-templates/{template}/versions', [QcReportController::class, 'versions'])
        ->middleware(EmployeePermission::class . ':reports.view');

    Route::post('/api/report-templates/{template}/restore', [QcReportController::class, 'restore'])
        ->middleware(EmployeePermission::class . ':reports.manage');

    // Archive
    Route::get('/api/archive', [QcArchivedReportController::class, 'index'])
        ->middleware(EmployeePermission::class . ':archive.view');

    Route::post('/api/archive', [QcArchivedReportController::class, 'store'])
        ->middleware(EmployeePermission::class . ':archive.manage');

    Route::get('/api/archive/{archivedReport}', [QcArchivedReportController::class, 'show'])
        ->middleware(EmployeePermission::class . ':archive.view');

    Route::patch('/api/archive/{archivedReport}', [QcArchivedReportController::class, 'update'])
        ->middleware(EmployeePermission::class . ':archive.manage');

    Route::delete('/api/archive/{archivedReport}', [QcArchivedReportController::class, 'destroy'])
        ->middleware(EmployeePermission::class . ':archive.manage');

    // Standards
    Route::get('/api/standards', [QcStandardController::class, 'index'])
        ->middleware(EmployeePermission::class . ':standards.view');

    Route::post('/api/standards', [QcStandardController::class, 'store'])
        ->middleware(EmployeePermission::class . ':standards.manage');

    Route::get('/api/standards/{standardRecord}', [QcStandardController::class, 'show'])
        ->middleware(EmployeePermission::class . ':standards.view');

    Route::patch('/api/standards/{standardRecord}', [QcStandardController::class, 'update'])
        ->middleware(EmployeePermission::class . ':standards.manage');

    Route::delete('/api/standards/{standardRecord}', [QcStandardController::class, 'destroy'])
        ->middleware(EmployeePermission::class . ':standards.manage');

    // Reference data and QC form options
    Route::get('/api/reference-data', [QcReferenceDataController::class, 'index'])
        ->middleware(EmployeePermission::class . ':reference.view');

    Route::get('/api/qc-form-options', [QcFormOptionsController::class, 'index'])
        ->middleware(EmployeePermission::class . ':reference.view');

    // User Management - Administrator only
    Route::middleware([EmployeeAdminOnly::class])->group(function () {
        Route::get('/api/users', [EmployeeManagementController::class, 'index']);
        Route::post('/api/users', [EmployeeManagementController::class, 'store']);

        Route::patch('/api/users/{employeeId}', [
            EmployeeManagementController::class,
            'update'
        ]);

        Route::patch('/api/users/{employeeId}/password', [
            EmployeeManagementController::class,
            'updatePassword'
        ]);
    });

    // React application fallback - available to authenticated employees.
    // Page access is checked by EmployeePageAccess.
    Route::get('/{any?}', function () {
        return view('app');
    })->where('any', '.*')
      ->middleware(EmployeePageAccess::class);
});
