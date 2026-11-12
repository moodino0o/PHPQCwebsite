<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Complaint extends Model
{
    protected $table = 'complaints';

    protected $fillable = [
        'complaint_no',
        'customer_name',
        'delivery_date',
        'complaint_type',
        'material_type',
        'details',
        'solution',
        'recommendation',
        'picture_paths',
        'created_by',
        'status',
        'qc_reviewer_name',
        'review_date',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'delivery_date' => 'date:Y-m-d',
            'review_date' => 'date:Y-m-d',
            'picture_paths' => 'array',
            'created_at' => 'datetime',
        ];
    }
}