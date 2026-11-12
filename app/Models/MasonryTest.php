<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasonryTest extends Model
{
    protected $fillable = [
        'record_no',
        'specimen_no',
        'test_date',
        'location',
        'block_type',
        'block_size',
        'length',
        'width',
        'height',
        'net_area',
        'failure_load',
        'compressive_strength',
        'required_strength',
        'dry_weight',
        'saturated_weight',
        'water_absorption',
        'max_absorption',
        'density',
        'status',
        'tested_by',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'test_date' => 'date:Y-m-d',
            'length' => 'decimal:2',
            'width' => 'decimal:2',
            'height' => 'decimal:2',
            'net_area' => 'decimal:2',
            'failure_load' => 'decimal:3',
            'compressive_strength' => 'decimal:3',
            'required_strength' => 'decimal:3',
            'dry_weight' => 'decimal:3',
            'saturated_weight' => 'decimal:3',
            'water_absorption' => 'decimal:3',
            'max_absorption' => 'decimal:3',
            'density' => 'decimal:2',
        ];
    }
}
