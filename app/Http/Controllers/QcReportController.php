<?php

namespace App\Http\Controllers;

use App\Models\QcReportLayout;
use App\Models\QcReportTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QcReportController extends Controller
{
    private const TYPES = [
        'Ready Mix',
        'Blocks',
        'Paving Blocks',
        'Sand Sieve',
        'Aggregate Sieve',
        'Water',
        'Flakiness & Elongation',
        'RMX Trial',
        'Precast',
        'Kerb Stone',
    ];

    public function index()
    {
        return response()->json([
            'types' => self::TYPES,
            'layouts' => QcReportLayout::orderBy('test_type')->get(),
            'templates' => QcReportTemplate::orderBy('test_type')
                ->orderByDesc('is_default')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function layouts()
    {
        return response()->json(
            QcReportLayout::orderBy('test_type')->get()
        );
    }

    public function updateLayout(Request $request)
    {
        $validated = $request->validate([
            'test_type' => 'required|string|max:100',
            'name' => 'required|string|max:255',
            'config' => 'required|array',
        ]);

        $layout = QcReportLayout::updateOrCreate(
            ['test_type' => $validated['test_type']],
            [
                'name' => $validated['name'],
                'config' => $validated['config'],
            ]
        );

        return response()->json([
            'message' => 'Report layout saved successfully.',
            'layout' => $layout,
        ]);
    }

    public function templates(Request $request)
    {
        $query = QcReportTemplate::query();

        if ($request->filled('test_type')) {
            $query->where('test_type', $request->test_type);
        }

        return response()->json(
            $query->orderByDesc('is_default')
                ->orderBy('name')
                ->get()
        );
    }

    public function createTemplate(Request $request)
    {
        $validated = $request->validate([
            'test_type' => 'required|string|max:100',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'design' => 'required|array',
            'is_default' => 'sometimes|boolean',
        ]);

        $template = DB::transaction(function () use ($validated) {
            $isDefault = $validated['is_default'] ?? false;

            if ($isDefault) {
                QcReportTemplate::where(
                    'test_type',
                    $validated['test_type']
                )->update(['is_default' => false]);
            }

            return QcReportTemplate::create([
                'test_type' => $validated['test_type'],
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'design' => $validated['design'],
                'is_default' => $isDefault,
                'version' => 1,
                'history' => [],
            ]);
        });

        return response()->json([
            'message' => 'Report template created successfully.',
            'template' => $template,
        ], 201);
    }

    public function updateTemplate(Request $request, QcReportTemplate $template)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'design' => 'sometimes|required|array',
        ]);

        if (array_key_exists('design', $validated)) {
            $history = $template->history ?? [];

            $history[] = [
                'version' => $template->version,
                'design' => $template->design,
                'saved_at' => now()->toISOString(),
            ];

            $template->history = $history;
            $template->version++;
        }

        $template->fill($validated);
        $template->save();

        return response()->json([
            'message' => 'Report template updated successfully.',
            'template' => $template->fresh(),
        ]);
    }

    public function deleteTemplate(QcReportTemplate $template)
    {
        $template->delete();

        return response()->json([
            'message' => 'Report template deleted successfully.',
        ]);
    }

    public function duplicateTemplate(QcReportTemplate $template)
    {
        $copy = QcReportTemplate::create([
            'test_type' => $template->test_type,
            'name' => $template->name . ' (Copy)',
            'description' => $template->description,
            'is_default' => false,
            'version' => 1,
            'design' => $template->design,
            'history' => [],
        ]);

        return response()->json([
            'message' => 'Report template duplicated successfully.',
            'template' => $copy,
        ], 201);
    }

    public function setDefault(QcReportTemplate $template)
    {
        DB::transaction(function () use ($template) {
            QcReportTemplate::where(
                'test_type',
                $template->test_type
            )->update(['is_default' => false]);

            $template->update(['is_default' => true]);
        });

        return response()->json([
            'message' => 'Default report template updated.',
            'template' => $template->fresh(),
        ]);
    }

    public function versions(QcReportTemplate $template)
    {
        return response()->json([
            'current_version' => $template->version,
            'history' => $template->history ?? [],
        ]);
    }

    public function restore(Request $request, QcReportTemplate $template)
    {
        $validated = $request->validate([
            'version' => 'required|integer|min:1',
        ]);

        $history = $template->history ?? [];

        $snapshot = collect($history)->firstWhere(
            'version',
            $validated['version']
        );

        if (!$snapshot) {
            return response()->json([
                'message' => 'The requested version was not found.',
            ], 404);
        }

        $history[] = [
            'version' => $template->version,
            'design' => $template->design,
            'saved_at' => now()->toISOString(),
        ];

        $template->design = $snapshot['design'];
        $template->history = $history;
        $template->version++;
        $template->save();

        return response()->json([
            'message' => 'Report template version restored successfully.',
            'template' => $template->fresh(),
        ]);
    }
}
