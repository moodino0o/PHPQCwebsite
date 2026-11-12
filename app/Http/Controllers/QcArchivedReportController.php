<?php

namespace App\Http\Controllers;

use App\Models\QcArchivedReport;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class QcArchivedReportController extends Controller
{
    /**
     * Read the extra fields stored alongside the original description.
     */
    private function readMetadata(?string $description): array
    {
        if (!$description) {
            return [
                'notes' => '',
                'metadata' => [],
            ];
        }

        $pattern = '/\n?\[\[QC_ARCHIVE_UI_V1:([A-Za-z0-9+\/=]+)\]\]$/';

        if (preg_match($pattern, $description, $matches)) {
            $decoded = base64_decode($matches[1], true);
            $metadata = $decoded ? json_decode($decoded, true) : null;

            if (is_array($metadata)) {
                $notes = preg_replace($pattern, '', $description);

                return [
                    'notes' => trim((string) $notes),
                    'metadata' => $metadata,
                ];
            }
        }

        return [
            'notes' => $description,
            'metadata' => [],
        ];
    }

    /**
     * Store the UI metadata without changing the archive table structure.
     */
    private function makeDescription(?string $notes, array $metadata): string
    {
        $json = json_encode(
            $metadata,
            JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
        );

        $marker = '[[QC_ARCHIVE_UI_V1:' . base64_encode($json ?: '{}') . ']]';

        return trim((string) $notes) !== ''
            ? trim((string) $notes) . "\n\n" . $marker
            : $marker;
    }

    /**
     * Convert an archive_documents row into the format used by Archive.tsx.
     */
    private function formatDocument(QcArchivedReport $document): array
    {
        $stored = $this->readMetadata($document->description);
        $metadata = $stored['metadata'];

        $reportData = is_array($metadata['report_data'] ?? null)
            ? $metadata['report_data']
            : [];

        $reportData['_archive'] = [
            'category' => $document->category,
            'subcategory' => $document->subcategory,
            'mime_type' => $document->mime_type,
            'size' => $document->size,
            'object_path' => $document->object_path,
            'expiry_date' => $document->expiry_date?->format('Y-m-d'),
            'uploaded_by' => $document->uploaded_by,
            'file_attached' => !Str::startsWith(
                $document->object_path,
                'metadata-only/'
            ),
        ];

        return [
            'id' => $document->id,
            'report_number' => $metadata['report_number']
                ?? 'ARC-' . str_pad((string) $document->id, 5, '0', STR_PAD_LEFT),
            'title' => $document->original_name,
            'report_type' => $metadata['report_type']
                ?? ($document->subcategory ?: $document->category),
            'customer' => $metadata['customer'] ?? null,
            'reference_number' => $metadata['reference_number']
                ?? 'DOC-' . $document->id,
            'report_date' => $document->document_date?->format('Y-m-d'),
            'status' => $metadata['status'] ?? 'Archived',
            'report_data' => $reportData,
            'notes' => $stored['notes'],
            'created_at' => $document->created_at,
        ];
    }

    /**
     * List and filter archived documents.
     */
    public function index(Request $request)
    {
        $query = QcArchivedReport::query();

        if ($request->filled('q')) {
            $search = $request->input('q');

            $query->where(function ($q) use ($search) {
                $q->where('original_name', 'ilike', "%{$search}%")
                    ->orWhere('category', 'ilike', "%{$search}%")
                    ->orWhere('subcategory', 'ilike', "%{$search}%")
                    ->orWhere('description', 'ilike', "%{$search}%")
                    ->orWhere('object_path', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('type')) {
            $type = $request->input('type');

            $query->where(function ($q) use ($type) {
                $q->where('category', $type)
                    ->orWhere('subcategory', $type);
            });
        }

        if ($request->filled('from')) {
            $query->whereDate('document_date', '>=', $request->input('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('document_date', '<=', $request->input('to'));
        }

        $reports = $query
            ->orderByDesc('document_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn ($document) => $this->formatDocument($document))
            ->values();

        if ($request->filled('status')) {
            $status = $request->input('status');

            $reports = $reports
                ->filter(fn ($report) => $report['status'] === $status)
                ->values();
        }

        return response()->json($reports);
    }

    /**
     * Create a metadata-only archive entry.
     *
     * This form does not upload an actual document file.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'report_number' => 'nullable|string|max:100',
            'title' => 'required|string|max:255',
            'report_type' => 'required|string|max:100',
            'customer' => 'nullable|string|max:255',
            'reference_number' => 'nullable|string|max:100',
            'report_date' => 'nullable|date',
            'status' => 'nullable|string|max:50',
            'report_data' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        $reportNumber = $validated['report_number']
            ?: 'QC-ARC-' . now()->format('Ymd') . '-' . strtoupper(Str::random(6));

        $metadata = [
            'report_number' => $reportNumber,
            'report_type' => $validated['report_type'],
            'customer' => $validated['customer'] ?? null,
            'reference_number' => $validated['reference_number'] ?? null,
            'status' => $validated['status'] ?? 'Archived',
            'report_data' => $validated['report_data'] ?? [],
        ];

        $document = QcArchivedReport::create([
            'original_name' => $validated['title'],
            'object_path' => 'metadata-only/' . Str::uuid() . '.json',
            'mime_type' => 'application/json',
            'size' => 0,
            'category' => $validated['report_type'],
            'subcategory' => 'Manual archive entry',
            'description' => $this->makeDescription(
                $validated['notes'] ?? '',
                $metadata
            ),
            'uploaded_by' => null,
            'document_date' => $validated['report_date'] ?? now()->toDateString(),
            'expiry_date' => null,
        ]);

        return response()->json($this->formatDocument($document), 201);
    }

    /**
     * Display one archived document.
     */
    public function show(QcArchivedReport $archivedReport)
    {
        return response()->json($this->formatDocument($archivedReport));
    }

    /**
     * Update archive metadata while preserving the original file reference.
     */
    public function update(Request $request, QcArchivedReport $archivedReport)
    {
        $validated = $request->validate([
            'report_number' => 'required|string|max:100',
            'title' => 'required|string|max:255',
            'report_type' => 'required|string|max:100',
            'customer' => 'nullable|string|max:255',
            'reference_number' => 'nullable|string|max:100',
            'report_date' => 'nullable|date',
            'status' => 'required|string|max:50',
            'report_data' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        $metadata = [
            'report_number' => $validated['report_number'],
            'report_type' => $validated['report_type'],
            'customer' => $validated['customer'] ?? null,
            'reference_number' => $validated['reference_number'] ?? null,
            'status' => $validated['status'],
            'report_data' => $validated['report_data'] ?? [],
        ];

        $archivedReport->original_name = $validated['title'];
        $archivedReport->subcategory = $validated['report_type'];
        $archivedReport->document_date = $validated['report_date']
            ?? $archivedReport->document_date;
        $archivedReport->description = $this->makeDescription(
            $validated['notes'] ?? '',
            $metadata
        );

        $archivedReport->save();

        return response()->json(
            $this->formatDocument($archivedReport->fresh())
        );
    }

    /**
     * Protect original uploaded documents from deletion through this screen.
     */
    public function destroy(QcArchivedReport $archivedReport)
    {
        if (!Str::startsWith($archivedReport->object_path, 'metadata-only/')) {
            return response()->json([
                'message' => 'This document has an original stored file. Deletion is disabled here to protect the original archive document.',
            ], 422);
        }

        $archivedReport->delete();

        return response()->json([
            'message' => 'Archive entry deleted successfully.',
        ]);
    }
}