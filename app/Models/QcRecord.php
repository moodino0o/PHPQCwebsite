<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QcRecord extends Model
{
    protected $table = 'qc_records';
    protected $appends = ['category'];

    protected $fillable = [
        'record_no',
        'test_type',
        'sample_date',
        'location',
        'material',
        'status',
        'tested_by',
        'reviewed_by',
        'remarks',
        'details',
    ];

    protected function casts(): array
    {
        return [
            'sample_date' => 'date:Y-m-d',
            'details' => 'array',
        ];
    }

    public function getCategoryAttribute(): string
    {
        return match ($this->test_type) {
            'Ready Mix' => 'Readymix',
            'Blocks' => 'Masonry',
            'Aggregate Sieve', 'Sand Sieve' => 'Aggregate',
            'Precast' => 'Precast',
            'Kerb Stone' => 'Kerb Stone',
            'Paving Blocks' => 'Masonry',
            'Water' => 'Water',
            default => 'Other',
        };
    }
}
