<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class MasonryTestController extends Controller
{
    private const MODULE_NAME = 'Masonry Tests';

    public function index(Request $request)
    {
        $query = DB::table('qc_records')
            ->where('test_type', 'Blocks')
            ->where('details->module', self::MODULE_NAME);

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('record_no', 'ilike', "%{$search}%")
                    ->orWhere('location', 'ilike', "%{$search}%")
                    ->orWhere('tested_by', 'ilike', "%{$search}%")
                    ->orWhere('details->specimen_no', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('status') && $request->status !== 'All') {
            $query->where('details->status', $request->status);
        }

        if ($request->filled('block_size') && $request->block_size !== 'All') {
            $query->where('details->block_size', $request->block_size);
        }

        $tests = $query->orderByDesc('sample_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn ($record) => $this->formatRecord($record));

        return response()->json($tests);
    }

    public function store(Request $request)
    {
        $validated = $this->validateTest($request);

        $record = $this->calculateAndSave($validated);

        return response()->json([
            'message' => 'Masonry test saved successfully.',
            'record' => $record,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $existing = DB::table('qc_records')
            ->where('id', $id)
            ->where('test_type', 'Blocks')
            ->where('details->module', self::MODULE_NAME)
            ->first();

        abort_unless($existing, 404, 'Masonry test not found.');

        $validated = $this->validateTest($request, $id);

        $record = $this->calculateAndSave($validated, $existing);

        return response()->json([
            'message' => 'Masonry test updated successfully.',
            'record' => $record,
        ]);
    }

    public function destroy($id)
    {
        $deleted = DB::table('qc_records')
            ->where('id', $id)
            ->where('test_type', 'Blocks')
            ->where('details->module', self::MODULE_NAME)
            ->delete();

        abort_unless($deleted, 404, 'Masonry test not found.');

        return response()->json([
            'message' => 'Masonry test deleted successfully.',
        ]);
    }

    private function validateTest(Request $request, $ignoreId = null): array
    {
        $validated = $request->validate([
            'record_no' => [
                'required',
                'string',
                'max:255',
                Rule::unique('qc_records', 'record_no')->ignore($ignoreId),
            ],
            'specimen_no' => ['nullable', 'string', 'max:255'],
            'test_date' => ['required', 'date'],
            'location' => ['required', 'string', 'max:255'],
            'block_type' => ['required', 'string', 'max:255'],
            'block_size' => ['required', 'string', 'max:255'],

            'length' => ['required', 'numeric', 'gt:0'],
            'width' => ['required', 'numeric', 'gt:0'],
            'height' => ['required', 'numeric', 'gt:0'],

            'net_area' => ['nullable', 'numeric', 'gt:0'],
            'failure_load' => ['nullable', 'numeric', 'gt:0'],
            'required_strength' => ['required', 'numeric', 'gt:0'],

            'dry_weight' => ['nullable', 'numeric', 'gt:0'],
            'saturated_weight' => ['nullable', 'numeric', 'gt:0'],
            'max_absorption' => ['nullable', 'numeric', 'gt:0'],

            'tested_by' => ['required', 'string', 'max:255'],
            'remarks' => ['nullable', 'string'],
        ]);

        $allowedTypes = $this->databaseOptions('block_type');
        $allowedSizes = $this->databaseOptions('block_size');

        Validator::make($validated, [
            'block_type' => ['required', Rule::in($allowedTypes)],
            'block_size' => ['required', Rule::in($allowedSizes)],
        ])->validate();

        return $validated;
    }

    private function databaseOptions(string $column): array
    {
        $shapeFactors = DB::table('qc_shape_factors')
            ->whereNotNull($column)
            ->pluck($column);

        $strengthStandards = DB::table('qc_strength_standards')
            ->whereNotNull($column)
            ->pluck($column);

        return $shapeFactors
            ->merge($strengthStandards)
            ->map(fn ($value) => trim((string) $value))
            ->filter(fn ($value) => $value !== '')
            ->unique()
            ->values()
            ->all();
    }

    private function calculateAndSave(array $data, $existing = null): array
    {
        $strength = null;
        $absorption = null;
        $density = null;

        // Compressive strength in N/mm² (MPa).
        if (!empty($data['failure_load']) && !empty($data['net_area'])) {
            $strength = ($data['failure_load'] * 1000) / $data['net_area'];
        }

        // Water absorption percentage.
        if (!empty($data['dry_weight']) && !empty($data['saturated_weight'])) {
            if ($data['saturated_weight'] < $data['dry_weight']) {
                abort(422, 'Saturated weight cannot be less than dry weight.');
            }

            $absorption = (
                ($data['saturated_weight'] - $data['dry_weight'])
                / $data['dry_weight']
            ) * 100;
        }

        // Density based on external block volume.
        if (
            !empty($data['length']) &&
            !empty($data['width']) &&
            !empty($data['height']) &&
            !empty($data['dry_weight'])
        ) {
            $volume = (
                $data['length'] *
                $data['width'] *
                $data['height']
            ) / 1000000000;

            $density = $data['dry_weight'] / $volume;
        }

        // Assess the result against the entered limits.
        $status = 'Pending';

        if ($strength !== null) {
            $strengthPass = $strength >= $data['required_strength'];

            $absorptionPass = true;

            if (!empty($data['max_absorption'])) {
                $absorptionPass = $absorption !== null
                    && $absorption <= $data['max_absorption'];
            }

            if ($strengthPass && $absorptionPass) {
                $status = 'Passed';
            } elseif (
                !$strengthPass ||
                ($absorption !== null && !$absorptionPass)
            ) {
                $status = 'Failed';
            } else {
                $status = 'Review';
            }
        }

        $details = [
            'module' => self::MODULE_NAME,
            'specimen_no' => $data['specimen_no'] ?? null,
            'block_type' => $data['block_type'],
            'block_size' => $data['block_size'],
            'length' => $data['length'],
            'width' => $data['width'],
            'height' => $data['height'],
            'net_area' => $data['net_area'] ?? null,
            'failure_load' => $data['failure_load'] ?? null,
            'required_strength' => $data['required_strength'],
            'dry_weight' => $data['dry_weight'] ?? null,
            'saturated_weight' => $data['saturated_weight'] ?? null,
            'max_absorption' => $data['max_absorption'] ?? null,
            'compressive_strength' => $strength,
            'water_absorption' => $absorption,
            'density' => $density,
            'status' => $status,
        ];

        $now = now();

        $mainRecord = [
            'record_no' => $data['record_no'],
            'test_type' => 'Blocks',
            'sample_date' => $data['test_date'],
            'location' => $data['location'],
            'material' => 'Concrete Block',
            'status' => $status === 'Pending'
                ? 'Waiting for results'
                : $status,
            'tested_by' => $data['tested_by'],
            'remarks' => $data['remarks'] ?? null,
            'details' => json_encode($details),
            'updated_at' => $now,
        ];

        if ($existing) {
            DB::table('qc_records')
                ->where('id', $existing->id)
                ->update($mainRecord);

            $id = $existing->id;
        } else {
            $mainRecord['created_at'] = $now;

            $id = DB::table('qc_records')->insertGetId($mainRecord);
        }

        $saved = DB::table('qc_records')->where('id', $id)->first();

        return $this->formatRecord($saved);
    }

    private function formatRecord($record): array
    {
        $details = $record->details ?? [];

        if (is_string($details)) {
            $details = json_decode($details, true) ?? [];
        } elseif (is_object($details)) {
            $details = (array) $details;
        }

        return array_merge([
            'id' => $record->id,
            'record_no' => $record->record_no,
            'test_date' => $record->sample_date,
            'location' => $record->location,
            'tested_by' => $record->tested_by,
            'remarks' => $record->remarks,
            'created_at' => $record->created_at,
            'updated_at' => $record->updated_at,
        ], $details);
    }
}
