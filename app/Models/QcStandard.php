<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QcStandard extends Model
{
    protected $fillable = [
        'standard_code',
        'title',
        'category',
        'issuing_body',
        'edition',
        'revision',
        'publication_year',
        'status',
        'description',
        'technical_notes',
        'reference_url',
    ];

    protected function casts(): array
    {
        return [
            'publication_year' => 'integer',
        ];
    }
}
