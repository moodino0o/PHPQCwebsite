<?php

namespace App\Http\Controllers;

use App\Models\QcRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class QcRecordController extends Controller
{
    private const TEST_TYPES = ['Ready Mix','Blocks','Aggregate Sieve','Sand Sieve','Kerb Stone','Paving Blocks','Precast','Water'];
    private const CATEGORIES = ['Readymix','Masonry','Aggregate','Precast','Kerb Stone','Water'];
    private const STATUSES = ['Passed','Failed','Review','Waiting for results','Pending'];

    private function categoryTestTypes(string $category): array
    {
        return match ($category) {
            'Readymix' => ['Ready Mix'],
            'Masonry' => ['Blocks', 'Paving Blocks'],
            'Aggregate' => ['Aggregate Sieve', 'Sand Sieve'],
            'Precast' => ['Precast'],
            'Kerb Stone' => ['Kerb Stone'],
            'Water' => ['Water'],
            default => [],
        };
    }

    private function normalizeStatus(array $data): array
    {
        if (($data['status'] ?? null) === 'Pending') $data['status'] = 'Waiting for results';
        return $data;
    }

    private function actorName(): string
    {
        $user = auth()->user();
        return $user?->name ?? $user?->email ?? 'Unknown user';
    }

    private function logHistory(QcRecord $record, string $action, array $snapshot, array $changes = []): void
    {
        DB::table('qc_record_histories')->insert([
            'qc_record_id' => $record->id,
            'record_no' => $record->record_no,
            'action' => $action,
            'changed_by' => $this->actorName(),
            'snapshot' => json_encode($snapshot, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE),
            'changes' => json_encode($changes, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE),
            'created_at' => now(),
        ]);
    }

    public function index(Request $request)
    {
        $filters = $request->validate([
            'category' => ['nullable','string',Rule::in(array_merge(['All'], self::CATEGORIES))],
            'status' => ['nullable','string',Rule::in(array_merge(['All'], self::STATUSES))],
            'test_type' => ['nullable','string','max:255'], 'material' => ['nullable','string','max:255'],
            'date_from' => ['nullable','date'], 'date_to' => ['nullable','date','after_or_equal:date_from'],
            'search' => ['nullable','string','max:255'],
        ]);

        $records = QcRecord::query()
            ->when(!empty($filters['category']) && $filters['category'] !== 'All', function ($q) use ($filters) {
                $types = $this->categoryTestTypes($filters['category']);
                $types ? $q->whereIn('test_type', $types) : $q->whereRaw('1 = 0');
            })
            ->when(!empty($filters['status']) && $filters['status'] !== 'All', function ($q) use ($filters) {
                $q->where('status', $filters['status'] === 'Pending' ? 'Waiting for results' : $filters['status']);
            })
            ->when(!empty($filters['test_type']) && $filters['test_type'] !== 'All', fn($q) => $q->where('test_type', $filters['test_type']))
            ->when(!empty($filters['material']) && $filters['material'] !== 'All', fn($q) => $q->where('material', $filters['material']))
            ->when(!empty($filters['date_from']), fn($q) => $q->whereDate('sample_date', '>=', $filters['date_from']))
            ->when(!empty($filters['date_to']), fn($q) => $q->whereDate('sample_date', '<=', $filters['date_to']))
            ->when(!empty($filters['search']), function ($q) use ($filters) {
                $search = $filters['search'];
                $q->where(fn($s) => $s->where('record_no','ilike',"%{$search}%")
                    ->orWhere('material','ilike',"%{$search}%")->orWhere('location','ilike',"%{$search}%")
                    ->orWhere('tested_by','ilike',"%{$search}%")->orWhere('test_type','ilike',"%{$search}%"));
            })
            ->orderByDesc('sample_date')->orderByDesc('id')->get()
            ->map(function ($record) {
                $record->category = match ($record->test_type) {
                    'Ready Mix' => 'Readymix', 'Blocks','Paving Blocks' => 'Masonry',
                    'Aggregate Sieve','Sand Sieve' => 'Aggregate', 'Precast' => 'Precast',
                    'Kerb Stone' => 'Kerb Stone', 'Water' => 'Water', default => 'Other',
                };
                return $record;
            });
        return response()->json($records);
    }

    public function show(QcRecord $qcRecord)
    {
        $qcRecord->category = match ($qcRecord->test_type) {
            'Ready Mix' => 'Readymix', 'Blocks','Paving Blocks' => 'Masonry',
            'Aggregate Sieve','Sand Sieve' => 'Aggregate', 'Precast' => 'Precast',
            'Kerb Stone' => 'Kerb Stone', 'Water' => 'Water', default => 'Other',
        };
        return response()->json($qcRecord);
    }

    public function history(QcRecord $qcRecord)
    {
        $history = DB::table('qc_record_histories')->where('qc_record_id', $qcRecord->id)
            ->orderByDesc('id')->get()->map(function ($item) {
                $item->snapshot = json_decode($item->snapshot, true) ?? [];
                $item->changes = json_decode($item->changes, true) ?? [];
                return $item;
            });
        return response()->json($history);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'record_no' => ['required','string','max:255','unique:qc_records,record_no'],
            'category' => ['required',Rule::in(self::CATEGORIES)], 'test_type' => ['required',Rule::in(self::TEST_TYPES)],
            'sample_date' => ['required','date'], 'location' => ['required','string','max:255'],
            'material' => ['required','string','max:255'], 'status' => ['required',Rule::in(self::STATUSES)],
            'tested_by' => ['required','string','max:255'], 'reviewed_by' => ['nullable','string','max:255'],
            'remarks' => ['nullable','string'], 'details' => ['nullable','array'],
        ]);
        if (!in_array($validated['test_type'], $this->categoryTestTypes($validated['category']), true)) {
            return response()->json(['message' => 'The selected test type does not match the selected category.'], 422);
        }
        unset($validated['category']);
        $validated = $this->normalizeStatus($validated);
        $validated['details'] = $validated['details'] ?? [];

        $record = DB::transaction(function () use ($validated) {
            $record = QcRecord::create($validated);
            $this->logHistory($record, 'Created', $record->fresh()->toArray());
            return $record;
        });
        return response()->json(['message' => 'QC record created successfully.','record' => $record->fresh()], 201);
    }

    public function update(Request $request, QcRecord $qcRecord)
    {
        $validated = $request->validate([
            'record_no' => ['required','string','max:255',Rule::unique('qc_records','record_no')->ignore($qcRecord->id)],
            'category' => ['required',Rule::in(self::CATEGORIES)], 'test_type' => ['required',Rule::in(self::TEST_TYPES)],
            'sample_date' => ['required','date'], 'location' => ['required','string','max:255'],
            'material' => ['required','string','max:255'], 'status' => ['required',Rule::in(self::STATUSES)],
            'tested_by' => ['required','string','max:255'], 'reviewed_by' => ['nullable','string','max:255'],
            'remarks' => ['nullable','string'], 'details' => ['nullable','array'],
        ]);
        if (!in_array($validated['test_type'], $this->categoryTestTypes($validated['category']), true)) {
            return response()->json(['message' => 'The selected test type does not match the selected category.'], 422);
        }
        unset($validated['category']);
        $validated = $this->normalizeStatus($validated);
        $validated['details'] = $validated['details'] ?? [];

        DB::transaction(function () use ($qcRecord, $validated) {
            $before = $qcRecord->fresh()->toArray();
            $qcRecord->update($validated);
            $after = $qcRecord->fresh()->toArray();
            $changes = [];
            foreach ($after as $key => $value) {
                if (in_array($key, ['updated_at'], true)) continue;
                $old = $before[$key] ?? null;
                if ($old != $value) $changes[$key] = ['old' => $old, 'new' => $value];
            }
            if ($changes) $this->logHistory($qcRecord, 'Updated', $after, $changes);
        });
        return response()->json(['message' => 'QC record updated successfully.','record' => $qcRecord->fresh()]);
    }

    public function destroy(QcRecord $qcRecord)
    {
        DB::transaction(function () use ($qcRecord) {
            $snapshot = $qcRecord->fresh()->toArray();
            $this->logHistory($qcRecord, 'Deleted', $snapshot);
            $qcRecord->delete();
        });
        return response()->json(['message' => 'QC record deleted successfully.']);
    }
}
