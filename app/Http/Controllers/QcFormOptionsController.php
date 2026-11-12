<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class QcFormOptionsController extends Controller
{
    public function index(): JsonResponse
    {
        $blockTypes = array_values(array_unique(array_merge(
            $this->databaseValues('qc_shape_factors', 'block_type'),
            $this->databaseValues('qc_strength_standards', 'block_type')
        )));

        $blockSizes = array_values(array_unique(array_merge(
            $this->databaseValues('qc_shape_factors', 'block_size'),
            $this->databaseValues('qc_strength_standards', 'block_size')
        )));

        sort($blockTypes, SORT_NATURAL | SORT_FLAG_CASE);
        sort($blockSizes, SORT_NATURAL | SORT_FLAG_CASE);

        return response()->json([
            'record_test_types' => $this->databaseValues('qc_records', 'test_type'),
            'record_materials' => $this->databaseValues('qc_records', 'material'),
            'record_locations' => $this->databaseValues('qc_records', 'location'),
            'masonry_block_types' => $blockTypes,
            'masonry_block_sizes' => $blockSizes,
        ]);
    }

    /**
     * Return distinct, non-empty values from an existing QC database column.
     * This endpoint is read-only and does not create or modify database data.
     */
    private function databaseValues(string $table, string $column): array
    {
        $values = DB::table($table)
            ->whereNotNull($column)
            ->where($column, '<>', '')
            ->distinct()
            ->orderBy($column)
            ->pluck($column)
            ->map(fn ($value) => trim((string) $value))
            ->filter(fn ($value) => $value !== '')
            ->unique()
            ->values()
            ->all();

        sort($values, SORT_NATURAL | SORT_FLAG_CASE);

        return $values;
    }
}
