<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QcArchivedReport extends Model
{
    protected $table = 'archive_documents';

    protected $fillable = [
        'original_name',
        'object_path',
        'mime_type',
        'size',
        'category',
        'subcategory',
        'description',
        'uploaded_by',
        'document_date',
        'expiry_date',
    ];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
            'document_date' => 'date:Y-m-d',
            'expiry_date' => 'date:Y-m-d',
        ];
    }
}