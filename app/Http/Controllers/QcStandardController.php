<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QcStandardController extends Controller
{
    public function index(Request $request)
    {
        $standards = collect();

        /*
        |--------------------------------------------------------------------------
        | Strength Standards
        |--------------------------------------------------------------------------
        */

        $strengthRows = DB::table('qc_strength_standards')
            ->orderBy('id')
            ->get();

        foreach ($strengthRows as $row) {
            $category = match ($row->test_type) {
                'Ready Mix' => 'Ready Mix',
                'Blocks' => 'Blocks',
                'Paving Blocks' => 'Paving Blocks',
                'Precast' => 'Precast',
                'Kerb Stone' => 'Kerb Stones',
                default => 'Concrete',
            };

            $titleParts = array_filter([
                $row->block_type,
                $row->material,
                $row->block_size ? 'Size: ' . $row->block_size : null,
            ]);

            $title = implode(' - ', $titleParts);

            if ($title === '') {
                $title = $row->test_type . ' Strength Requirement';
            }

            $descriptionParts = [
                'Test type: ' . $row->test_type,
                'Material: ' . $row->material,
            ];

            if ($row->block_type) {
                $descriptionParts[] = 'Block type: ' . $row->block_type;
            }

            if ($row->block_size) {
                $descriptionParts[] = 'Block size: ' . $row->block_size;
            }

            if ($row->cube_age !== null) {
                $descriptionParts[] = 'Cube age: ' . $row->cube_age . ' days';
            }

            $technicalNotes = [];

            $technicalNotes[] = 'Required strength: '
                . $row->required_strength . ' ' . $row->strength_unit;

            if ($row->dammam_average_strength !== null) {
                $technicalNotes[] = 'Dammam average strength: '
                    . $row->dammam_average_strength . ' ' . $row->strength_unit;
            }

            if ($row->dammam_minimum_strength !== null) {
                $technicalNotes[] = 'Dammam minimum strength: '
                    . $row->dammam_minimum_strength . ' ' . $row->strength_unit;
            }

            if ($row->minimum_individual_strength !== null) {
                $technicalNotes[] = 'Minimum individual strength: '
                    . $row->minimum_individual_strength . ' ' . $row->strength_unit;
            }

            if ($row->kerb_class !== null) {
                $technicalNotes[] = 'Kerb class: ' . $row->kerb_class;
            }

            if ($row->kerb_marking) {
                $technicalNotes[] = 'Kerb marking: ' . $row->kerb_marking;
            }

            if ($row->water_absorption_limit !== null) {
                $technicalNotes[] = 'Water absorption limit: '
                    . $row->water_absorption_limit . '%';
            }

            $standards->push([
                'id' => (int) $row->id,
                'standard_code' => $row->bs_standard,
                'title' => $title,
                'category' => $category,
                'issuing_body' => str_starts_with(
                    strtoupper($row->bs_standard),
                    'BS'
                ) ? 'British Standards' : 'Al Manaratain',
                'edition' => null,
                'revision' => null,
                'publication_year' => null,
                'status' => 'On file',
                'description' => implode(' | ', $descriptionParts),
                'technical_notes' => implode("\n", $technicalNotes),
                'reference_url' => null,
                'source_type' => 'Strength Standard',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Sieve Standards
        |--------------------------------------------------------------------------
        */

        $sieveRows = DB::table('qc_sieve_standards as s')
            ->join(
                'qc_reference_items as m',
                'm.id',
                '=',
                's.material_reference_item_id'
            )
            ->join(
                'qc_reference_items as z',
                'z.id',
                '=',
                's.sieve_size_reference_item_id'
            )
            ->select(
                's.*',
                'm.value as material',
                'z.value as sieve_size'
            )
            ->orderBy('s.id')
            ->get();

        foreach ($sieveRows as $row) {
            $category = (
                stripos($row->test_type, 'Sand') !== false ||
                stripos($row->material, 'Sand') !== false ||
                stripos($row->material, 'Dust') !== false
            ) ? 'Sand' : 'Aggregates';

            $technicalNotes = [
                'Measurement type: ' . $row->measurement_type,
            ];

            if ($row->minimum !== null) {
                $technicalNotes[] = 'Minimum: ' . $row->minimum . ' ' . $row->unit;
            }

            if ($row->maximum !== null) {
                $technicalNotes[] = 'Maximum: ' . $row->maximum . ' ' . $row->unit;
            }

            $standards->push([
                'id' => 100000 + (int) $row->id,
                'standard_code' => $row->standard_reference,
                'title' => $row->material . ' - ' . $row->sieve_size . ' Sieve Limit',
                'category' => $category,
                'issuing_body' => str_starts_with(
                    strtoupper($row->standard_reference),
                    'BS'
                ) ? 'British Standards' : null,
                'edition' => null,
                'revision' => null,
                'publication_year' => null,
                'status' => 'On file',
                'description' => $row->test_type
                    . ' | Material: ' . $row->material
                    . ' | Sieve size: ' . $row->sieve_size,
                'technical_notes' => implode("\n", $technicalNotes),
                'reference_url' => null,
                'source_type' => 'Sieve Standard',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Shape Factors
        |--------------------------------------------------------------------------
        */

        $shapeRows = DB::table('qc_shape_factors')
            ->orderBy('id')
            ->get();

        foreach ($shapeRows as $row) {
            $isPaving = (
                stripos((string) $row->block_size, '60') !== false ||
                stripos((string) $row->block_size, '80') !== false
            );

            $technicalNotes = [];

            if ($row->shape_factor !== null) {
                $technicalNotes[] = 'Shape factor: ' . $row->shape_factor;
            }

            if ($row->correction_factor !== null) {
                $technicalNotes[] = 'Correction factor: ' . $row->correction_factor;
            }

            $standards->push([
                'id' => 200000 + (int) $row->id,
                'standard_code' => 'INTERNAL QC FACTOR',
                'title' => 'Shape / Correction Factor - ' . ($row->block_size ?? 'Unspecified Size'),
                'category' => $isPaving ? 'Paving Blocks' : 'Blocks',
                'issuing_body' => 'Al Manaratain',
                'edition' => null,
                'revision' => null,
                'publication_year' => null,
                'status' => 'On file',
                'description' => $row->block_type ?? 'Block shape factor reference',
                'technical_notes' => implode("\n", $technicalNotes),
                'reference_url' => null,
                'source_type' => 'Shape Factor',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Water Standards
        |--------------------------------------------------------------------------
        */

        $waterRows = DB::table('qc_water_standards')
            ->orderBy('id')
            ->get();

        foreach ($waterRows as $row) {
            $technicalNotes = [
                'pH: ' . $row->ph_min . ' to ' . $row->ph_max,
                'Chloride: ' . $row->chloride_min . ' to ' . $row->chloride_max,
                'TDS: ' . $row->tds_min . ' to ' . $row->tds_max,
                'SO3: ' . $row->so3_min . ' to ' . $row->so3_max,
            ];

            $standards->push([
                'id' => 300000 + (int) $row->id,
                'standard_code' => 'WATER QUALITY LIMITS',
                'title' => $row->name,
                'category' => 'Water',
                'issuing_body' => 'Al Manaratain',
                'edition' => null,
                'revision' => null,
                'publication_year' => null,
                'status' => 'On file',
                'description' => 'Water quality testing requirements',
                'technical_notes' => implode("\n", $technicalNotes),
                'reference_url' => null,
                'source_type' => 'Water Standard',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Search and Category Filters
        |--------------------------------------------------------------------------
        */

        if ($request->filled('q')) {
            $search = strtolower(trim($request->q));

            $standards = $standards->filter(function ($standard) use ($search) {
                $searchable = strtolower(implode(' ', [
                    $standard['standard_code'] ?? '',
                    $standard['title'] ?? '',
                    $standard['category'] ?? '',
                    $standard['issuing_body'] ?? '',
                    $standard['description'] ?? '',
                    $standard['technical_notes'] ?? '',
                ]));

                return str_contains($searchable, $search);
            });
        }

        if ($request->filled('category')) {
            $category = $request->category;

            $standards = $standards->filter(
                fn ($standard) => $standard['category'] === $category
            );
        }

        return response()->json(
            $standards->values()
        );
    }

    public function store(Request $request)
    {
        return response()->json([
            'message' => 'The Standards Library is read-only because it is connected to the original QC database.',
        ], 405);
    }

    public function show($standardRecord)
    {
        return response()->json([
            'message' => 'Individual standard records are provided through the Standards Library listing.',
        ], 405);
    }

    public function update(Request $request, $standardRecord)
    {
        return response()->json([
            'message' => 'The Standards Library is read-only. Existing QC standards cannot be modified here.',
        ], 405);
    }

    public function destroy($standardRecord)
    {
        return response()->json([
            'message' => 'The Standards Library is read-only. Existing QC standards cannot be deleted here.',
        ], 405);
    }
}