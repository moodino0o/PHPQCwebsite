<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QcReportLayout extends Model
{
    protected $fillable = [
        'test_type',
        'name',
        'config',
    ];

    protected function casts(): array
    {
        return [
            'config' => 'array',
        ];
    }
}