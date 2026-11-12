<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class ComplaintController extends Controller
{
    private const STATUSES = [
        'Open',
        'Under Investigation',
        'Pending Customer',
        'Resolved',
        'Closed',
    ];

    private const PRIORITIES = [
        'Low',
        'Medium',
        'High',
        'Urgent',
    ];

    /**
     * Read the additional fields stored inside the existing details column.
     */
    private function readExtraFields(Complaint $complaint): array
    {
        $decoded = json_decode($complaint->details ?? '', true);

        if (
            is_array($decoded) &&
            ($decoded['__qc_complaint_ui_v1'] ?? false) === true
        ) {
            return $decoded;
        }

        return [];
    }

    /**
     * Convert the original database record into the format
     * expected by the existing React Complaints page.
     */
    private function formatComplaint(Complaint $complaint): array
    {
        $extra = $this->readExtraFields($complaint);

        $description = !empty($extra)
            ? ($extra['complaint_description'] ?? '')
            : ($complaint->details ?? '');

        return [
            'id' => $complaint->id,
            'complaint_no' => $complaint->complaint_no,

            'complaint_date' => $extra['complaint_date']
                ?? $complaint->created_at?->format('Y-m-d'),

            'customer_name' => $complaint->customer_name,

            'contact_person' => $extra['contact_person'] ?? null,
            'phone' => $extra['phone'] ?? null,
            'email' => $extra['email'] ?? null,

            'site_name' => $extra['site_name'] ?? 'Not specified',
            'location' => $extra['location'] ?? null,

            'product_type' => $extra['product_type']
                ?? $complaint->material_type,

            'product_size' => $extra['product_size'] ?? null,

            'delivery_date' => $extra['delivery_date']
                ?? $complaint->delivery_date?->format('Y-m-d'),

            'invoice_no' => $extra['invoice_no'] ?? null,
            'batch_no' => $extra['batch_no'] ?? null,

            'complaint_description' => $description,

            'reported_action' => $extra['reported_action']
                ?? $complaint->solution,

            'priority' => $extra['priority'] ?? 'Medium',

            'status' => Str::headline($complaint->status),

            'assigned_to' => $extra['assigned_to']
                ?? $complaint->created_by,

            'investigation' => $extra['investigation'] ?? null,
            'root_cause' => $extra['root_cause'] ?? null,

            'corrective_action' => $extra['corrective_action']
                ?? $complaint->solution,

            'preventive_action' => $extra['preventive_action']
                ?? $complaint->recommendation,

            'resolution_date' => $extra['resolution_date']
                ?? $complaint->review_date?->format('Y-m-d'),

            'remarks' => $extra['remarks'] ?? null,

            'created_at' => $complaint->created_at,
            'updated_at' => $complaint->updated_at,
        ];
    }

    /**
     * Convert the React form into the existing PostgreSQL table structure.
     */
    private function databaseFields(array $data, ?Complaint $complaint = null): array
    {
        $extra = [
            '__qc_complaint_ui_v1' => true,

            'complaint_date' => $data['complaint_date'],
            'contact_person' => $data['contact_person'] ?? null,
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,

            'site_name' => $data['site_name'],
            'location' => $data['location'] ?? null,

            'product_type' => $data['product_type'],
            'product_size' => $data['product_size'] ?? null,

            'delivery_date' => $data['delivery_date'] ?? null,
            'invoice_no' => $data['invoice_no'] ?? null,
            'batch_no' => $data['batch_no'] ?? null,

            'complaint_description' => $data['complaint_description'],
            'reported_action' => $data['reported_action'] ?? null,

            'priority' => $data['priority'],
            'assigned_to' => $data['assigned_to'] ?? null,

            'investigation' => $data['investigation'] ?? null,
            'root_cause' => $data['root_cause'] ?? null,
            'corrective_action' => $data['corrective_action'] ?? null,
            'preventive_action' => $data['preventive_action'] ?? null,

            'resolution_date' => $data['resolution_date'] ?? null,
            'remarks' => $data['remarks'] ?? null,
        ];

        return [
            'customer_name' => $data['customer_name'],

            // The original database requires a delivery date.
            // If none is entered, use the complaint date in the database.
            'delivery_date' => !empty($data['delivery_date'])
                ? $data['delivery_date']
                : $data['complaint_date'],

            'complaint_type' => 'Product Quality',
            'material_type' => $data['product_type'],

            // Preserve the complete form data without adding database columns.
            'details' => json_encode(
                $extra,
                JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            ),

            'solution' => $data['corrective_action']
                ?: ($data['reported_action'] ?? ''),

            'recommendation' => $data['preventive_action'] ?? '',

            'status' => Str::lower($data['status']),

            'review_date' => $data['resolution_date'] ?: null,
        ];
    }

    private function validateComplaint(Request $request): array
    {
        return $request->validate([
            'complaint_date' => ['required', 'date'],
            'customer_name' => ['required', 'string', 'max:255'],

            'contact_person' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],

            'site_name' => ['required', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],

            'product_type' => ['required', 'string', 'max:255'],
            'product_size' => ['nullable', 'string', 'max:255'],

            'delivery_date' => ['nullable', 'date'],
            'invoice_no' => ['nullable', 'string', 'max:255'],
            'batch_no' => ['nullable', 'string', 'max:255'],

            'complaint_description' => ['required', 'string'],
            'reported_action' => ['nullable', 'string'],

            'priority' => ['required', 'in:' . implode(',', self::PRIORITIES)],
            'status' => ['required', 'in:' . implode(',', self::STATUSES)],

            'assigned_to' => ['nullable', 'string', 'max:255'],

            'investigation' => ['nullable', 'string'],
            'root_cause' => ['nullable', 'string'],
            'corrective_action' => ['nullable', 'string'],
            'preventive_action' => ['nullable', 'string'],

            'resolution_date' => ['nullable', 'date'],
            'remarks' => ['nullable', 'string'],
        ]);
    }

    public function index(Request $request)
    {
        $query = Complaint::query();

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('complaint_no', 'ilike', "%{$search}%")
                    ->orWhere('customer_name', 'ilike', "%{$search}%")
                    ->orWhere('complaint_type', 'ilike', "%{$search}%")
                    ->orWhere('material_type', 'ilike', "%{$search}%")
                    ->orWhere('details', 'ilike', "%{$search}%")
                    ->orWhere('solution', 'ilike', "%{$search}%")
                    ->orWhere('recommendation', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->whereRaw('LOWER(status) = ?', [
                Str::lower($request->status),
            ]);
        }

        $complaints = $query
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Complaint $complaint) => $this->formatComplaint($complaint));

        // Priority is stored in the details metadata because the original
        // PostgreSQL table does not have a priority column.
        if ($request->filled('priority')) {
            $complaints = $complaints
                ->filter(fn ($complaint) =>
                    Str::lower($complaint['priority']) ===
                    Str::lower($request->priority)
                )
                ->values();
        }

        return response()->json($complaints);
    }

    public function show(Complaint $complaint)
    {
        return response()->json(
            $this->formatComplaint($complaint)
        );
    }

    public function store(Request $request)
    {
        $validated = $this->validateComplaint($request);

        do {
            $complaintNo = 'CMP-' . now()->format('Ymd') . '-' .
                strtoupper(Str::random(5));
        } while (
            Complaint::where('complaint_no', $complaintNo)->exists()
        );

        $fields = $this->databaseFields($validated);

        $fields['complaint_no'] = $complaintNo;

        // Keep the selected complaint date for display in the existing interface.
        $fields['created_at'] = Carbon::parse(
            $validated['complaint_date']
        )->startOfDay();

        $fields['picture_paths'] = [];

        $complaint = Complaint::create($fields);

        return response()->json([
            'message' => 'Complaint created successfully.',
            'complaint' => $this->formatComplaint($complaint),
        ], 201);
    }

    public function update(Request $request, Complaint $complaint)
    {
        $validated = $this->validateComplaint($request);

        $fields = $this->databaseFields($validated, $complaint);

        $complaint->update($fields);

        return response()->json([
            'message' => 'Complaint updated successfully.',
            'complaint' => $this->formatComplaint($complaint->fresh()),
        ]);
    }

    public function destroy(Complaint $complaint)
    {
        $complaint->delete();

        return response()->json([
            'message' => 'Complaint deleted successfully.',
        ]);
    }
}