import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQcFormOptions } from "../hooks/useQcFormOptions.ts";
import {
  Search,
  Plus,
  ClipboardList,
  X,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Eye,
  Pencil,
  History,
  Download,
} from "lucide-react";

type Category =
  | "Readymix"
  | "Masonry"
  | "Aggregate"
  | "Precast"
  | "Kerb Stone"
  | "Water";

type Status = "Pending" | "Waiting for results" | "Passed" | "Failed" | "Review";

interface QcRecord {
  id: number;
  record_no: string;
  category: Category;
  test_type: string;
  sample_date: string;
  location: string;
  material: string;
  status: Status;
  tested_by: string;
  reviewed_by?: string | null;
  remarks?: string | null;
  details?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}
interface CurrentEmployee {
  employee_id: string;
  name: string;
  role: string;
  administrator: boolean;
}

const categories: { label: string; value: Category | "All" }[] = [
  { label: "All Records", value: "All" },
  { label: "Readymix", value: "Readymix" },
  { label: "Masonry", value: "Masonry" },
  { label: "Aggregate", value: "Aggregate" },
  { label: "Precast", value: "Precast" },
  { label: "Kerb Stone", value: "Kerb Stone" },
  { label: "Water", value: "Water" },
];

const emptyForm = {
  record_no: "",
  category: "Masonry" as Category,
  test_type: "",
  sample_date: new Date().toISOString().slice(0, 10),
  location: "",
  material: "",
  status: "Pending" as Status,
  tested_by: "",
  remarks: "",
  reviewed_by: "",
  details: {},
};

function csrfToken() {
  return document
    .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
    ?.content ?? "";
}

async function request(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": csrfToken(),
      ...(options.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data.message ||
      (data.errors
        ? Object.values(data.errors).flat().join(" ")
        : "Request failed.");

    throw new Error(String(message));
  }

  return data;
}

function formatDate(value: string) {
  if (!value) return "—";

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-GB").format(date);
}

function StatusBadge({ status }: { status: Status }) {
  const config = {
    Passed: {
      icon: CheckCircle2,
      className: "record-status passed",
    },
    Failed: {
      icon: XCircle,
      className: "record-status failed",
    },
    Review: {
      icon: AlertTriangle,
      className: "record-status review",
    },
    Pending: {
      icon: Clock,
      className: "record-status pending",
    },
    "Waiting for results": {
      icon: Clock,
      className: "record-status pending",
    },
  };

  const item = config[status] ?? config.Pending;
  const Icon = item.icon;

  return (
    <span className={item.className}>
      <Icon size={13} />
      {status}
    </span>
  );
}

export default function Records() {
  const [location, setLocation] = useLocation();
    // Logged-in employee and QC Register permissions
  const [employee, setEmployee] = useState<CurrentEmployee | null>(null);

  useEffect(() => {
    fetch("/api/current-user", {
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to identify logged-in employee.");
        }
        return response.json();
      })
      .then((data) => {
        setEmployee(data.employee ?? null);
      })
      .catch((error) => {
        console.error("Employee permission loading failed:", error);
      });
  }, []);

  const employeeRole = employee?.administrator
    ? "administrator"
    : employee?.role === "technician"
      ? "lab_technician"
      : employee?.role === "visitor"
        ? "viewer"
        : employee?.role;

  const canCreateRecord = [
    "administrator",
    "manager",
    "qc_engineer",
    "lab_technician",
  ].includes(employeeRole ?? "");

  const canEditRecord = [
    "administrator",
    "manager",
    "qc_engineer",
  ].includes(employeeRole ?? "");

  const canDeleteRecord = canEditRecord;
  const { record_test_types, record_materials, record_locations, loading: referenceLoading, error: referenceError } = useQcFormOptions();

  const categoryFromPath = categories.find(
    (item) =>
      item.value !== "All" &&
      location === `/records/${item.value.toLowerCase().replace(" ", "-")}`
  );

  const [category, setCategory] = useState<Category | "All">(
    categoryFromPath?.value ?? "All"
  );
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [testType, setTestType] = useState("All");
  const [material, setMaterial] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [records, setRecords] = useState<QcRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [detailsText, setDetailsText] = useState("{}");
  const [viewingRecord, setViewingRecord] = useState<QcRecord | null>(null);
  const [recordHistory, setRecordHistory] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  async function loadRecords() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (category !== "All") params.set("category", category);
      if (status !== "All") params.set("status", status);
      if (search.trim()) params.set("search", search.trim());
      if (testType !== "All") params.set("test_type", testType);
      if (material !== "All") params.set("material", material);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      const data = await request(`/qc-records?${params.toString()}`);

      setRecords(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load QC records."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadRecords();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [category, status, search, testType, material, dateFrom, dateTo]);

  const counts = useMemo(() => ({
    total: records.length,
    passed: records.filter((record) => record.status === "Passed").length,
    failed: records.filter((record) => record.status === "Failed").length,
    pending: records.filter((record) => record.status === "Pending" || record.status === "Waiting for results").length,
  }), [records]);

  function exportRecords() {
    const columns = [
      "Record Number",
      "Test Type",
      "Sample Date",
      "Location",
      "Material / Product",
      "Status",
      "Tested By",
      "Reviewed By",
      "Remarks",
    ];

    const escapeCsv = (value: unknown) => {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = records.map((record) => [
      record.record_no,
      record.test_type,
      record.sample_date,
      record.location,
      record.material,
      record.status,
      record.tested_by,
      record.reviewed_by,
      record.remarks,
    ]);

    const csv = [columns, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\\r\\n");

    const blob = new Blob(["\\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `QC_Records_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function clearFilters() {
    setCategory("All");
    setLocation("/records");
    setStatus("All");
    setSearch("");
    setTestType("All");
    setMaterial("All");
    setDateFrom("");
    setDateTo("");
  }

  function selectCategory(value: Category | "All") {
    setCategory(value);

    if (value === "All") {
      setLocation("/records");
    } else {
      setLocation(`/records/${value.toLowerCase().replace(" ", "-")}`);
    }
  }

  function updateField(name: keyof typeof emptyForm, value: string) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function saveRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (editingRecordId !== null && !canEditRecord) {
      setFormError("You do not have permission to edit QC records.");
      return;
    }

    if (editingRecordId === null && !canCreateRecord) {
      setFormError("You do not have permission to create QC records.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      let details: Record<string, unknown>;

      try {
        const parsed = JSON.parse(detailsText || "{}");

        if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
          throw new Error();
        }

        details = parsed;
      } catch {
        throw new Error(
          "Test details must be a valid JSON object. Use {} if there are no details."
        );
      }

      const payload = { ...form, details };

      await request(
        editingRecordId
          ? `/qc-records/${editingRecordId}`
          : "/qc-records",
        {
          method: editingRecordId ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );

      setModalOpen(false);
      setForm(emptyForm);
      setEditingRecordId(null);
      setDetailsText("{}");

      await loadRecords();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to save the record."
      );
    } finally {
      setSaving(false);
    }
  }

  async function editRecord(record: QcRecord) {

    if (!canEditRecord) {
      window.alert("You do not have permission to edit QC records.");
      return;
    }

    setEditingRecordId(record.id);
    setForm({
      record_no: record.record_no,
      category: record.category,
      test_type: record.test_type,
      sample_date: record.sample_date?.slice(0, 10) || "",
      location: record.location,
      material: record.material,
      status: record.status,
      tested_by: record.tested_by,
      reviewed_by: record.reviewed_by || "",
      remarks: record.remarks || "",
      details: record.details || {},
    });
    setDetailsText(JSON.stringify(record.details || {}, null, 2));
    setFormError("");
    setModalOpen(true);
  }

  async function viewRecord(record: QcRecord) {
    setDetailLoading(true);
    setViewingRecord(null);
    setRecordHistory([]);
    try {
      const [fullRecord, history] = await Promise.all([
        request(`/qc-records/${record.id}`),
        request(`/qc-records/${record.id}/history`),
      ]);
      setViewingRecord(fullRecord);
      setRecordHistory(Array.isArray(history) ? history : []);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Unable to load record details.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function deleteRecord(record: QcRecord) {
    if (!canDeleteRecord) {
      window.alert("You do not have permission to delete QC records.");
      return;
    }

    if (!window.confirm(`Delete record ${record.record_no}?`)) return;

    try {
      await request(`/qc-records/${record.id}`, {
        method: "DELETE",
      });

      await loadRecords();
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Unable to delete record."
      );
    }
  }

  return (
    <div className="records-page">
      <div className="records-heading">
        <div>
          <p className="eyebrow">QUALITY CONTROL / RECORDS</p>
          <h1>QC Register</h1>
          <p>Manage and monitor quality control testing records.</p>
        </div>
      {canCreateRecord && (
        <button
        
          className="primary-button"
          onClick={() => {
            setForm(emptyForm);
            setEditingRecordId(null);
            setDetailsText("{}");
            setFormError("");
            setModalOpen(true);
          }}
       
        >
          <Plus size={17} />
          Add New Record
        </button> 
      )}
      </div>

      <div className="record-summary">
        <div>
          <span>Total Records</span>
          <strong>{counts.total}</strong>
        </div>
        <div>
          <span>Passed</span>
          <strong className="summary-passed">{counts.passed}</strong>
        </div>
        <div>
          <span>Failed</span>
          <strong className="summary-failed">{counts.failed}</strong>
        </div>
        <div>
          <span>Pending</span>
          <strong>{counts.pending}</strong>
        </div>
      </div>

      <section className="records-panel">
        <div className="record-category-tabs">
          {categories.map((item) => (
            <button
              key={item.value}
              className={category === item.value ? "selected" : ""}
              onClick={() => selectCategory(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="record-toolbar">
          <div className="record-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search record number, material, location..."
            />
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="All">All statuses</option>
            <option value="Passed">Passed</option>
            <option value="Failed">Failed</option>
            <option value="Review">Review</option>
            <option value="Pending">Pending</option>
          </select>

          <select value={testType} onChange={(event) => setTestType(event.target.value)} aria-label="Filter by test type">
            <option value="All">All test types</option>
            {record_test_types.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <select value={material} onChange={(event) => setMaterial(event.target.value)} aria-label="Filter by material">
            <option value="All">All materials</option>
            {record_materials.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <label className="record-date-filter">
            From
            <input type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} />
          </label>

          <label className="record-date-filter">
            To
            <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} />
          </label>

          <button className="secondary-button" onClick={clearFilters} type="button">
            Clear Filters
          </button>

          <button className="secondary-button" onClick={exportRecords} type="button" disabled={records.length === 0 || loading}>
            <Download size={16} />
            Export Excel
          </button>

          <button
            className="refresh-button"
            onClick={loadRecords}
            title="Refresh records"
            type="button"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {error && (
          <div className="record-error">
            {error}
            <button onClick={loadRecords}>Retry</button>
          </div>
        )}

        <div className="records-table-wrap">
          <table className="records-table">
            <thead>
              <tr>
                <th>Record No.</th>
                <th>Category</th>
                <th>Test Type</th>
                <th>Sample Date</th>
                <th>Location</th>
                <th>Material / Product</th>
                <th>Tested By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="records-empty">
                    Loading QC records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="records-empty">
                    <ClipboardList size={35} />
                    <strong>No QC records found</strong>
                    <span>
                      Add a new record or change your search and filters.
                    </span>
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id}>
                    <td className="record-number">{record.record_no}</td>
                    <td>{record.category}</td>
                    <td>{record.test_type}</td>
                    <td>{formatDate(record.sample_date)}</td>
                    <td>{record.location}</td>
                    <td>{record.material}</td>
                    <td>{record.tested_by}</td>
                    <td><StatusBadge status={record.status} /></td>
                    <td>
                      <button className="table-action" title="View details and history" onClick={() => viewRecord(record)}>
                        <Eye size={15} />
                      </button>

                      {canEditRecord && (
                        <button className="table-action" title="Edit record" onClick={() => editRecord(record)}>
                          <Pencil size={15} />
                        </button>
                      )}
                      
                      {canDeleteRecord && (
                        <button
                          className="table-action delete"
                          title="Delete record"
                          onClick={() => deleteRecord(record)}
                        >
                        <Trash2 size={15} />
                      </button>
                      )}
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>

        <div className="records-table-footer">
          Showing {records.length} filtered record{records.length === 1 ? "" : "s"}
        </div>
      </section>

      {modalOpen && (
        <div
          className="record-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setModalOpen(false);
            }
          }}
        >
          <div className="record-modal">
            <div className="record-modal-header">
              <div>
                <p className="eyebrow">QC REGISTER</p>
                <h2>{editingRecordId ? "Edit QC Record" : "Create New Record"}</h2>
              </div>

              <button
                className="modal-close"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveRecord}>
              {referenceError && (
                <div className="record-error">
                  {referenceError} Reference fields are loaded from the existing PostgreSQL records.
                </div>
              )}

              <div className="record-form-grid">
                <label>
                  Record Number *
                  <input
                    required
                    maxLength={50}
                    value={form.record_no}
                    onChange={(e) => updateField("record_no", e.target.value)}
                    placeholder="e.g. QC-2026-001"
                  />
                </label>

                <label>
                  Category *
                  <select
                    value={form.category}
                    onChange={(e) => updateField("category", e.target.value)}
                  >
                    {categories.filter((item) => item.value !== "All").map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Test Type *
                  <select
                    required
                    value={form.test_type}
                    disabled={referenceLoading || !!referenceError || record_test_types.length === 0}
                    onChange={(e) => updateField("test_type", e.target.value)}
                  >
                    <option value="">
                      {referenceLoading ? "Loading database values..." : referenceError ? "Database options unavailable" : "Select test type"}
                    </option>
                    {record_test_types.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Sample Date *
                  <input
                    required
                    type="date"
                    value={form.sample_date}
                    onChange={(e) => updateField("sample_date", e.target.value)}
                  />
                </label>

                <label>
                  Location / Plant *
                  <select
                    required
                    value={form.location}
                    disabled={referenceLoading || !!referenceError || record_locations.length === 0}
                    onChange={(e) => updateField("location", e.target.value)}
                  >
                    <option value="">
                      {referenceLoading ? "Loading database values..." : referenceError ? "Database options unavailable" : "Select location"}
                    </option>
                    {record_locations.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Material / Product *
                  <select
                    required
                    value={form.material}
                    disabled={referenceLoading || !!referenceError || record_materials.length === 0}
                    onChange={(e) => updateField("material", e.target.value)}
                  >
                    <option value="">
                      {referenceLoading ? "Loading database values..." : referenceError ? "Database options unavailable" : "Select material / product"}
                    </option>
                    {record_materials.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Tested By *
                  <input
                    required
                    value={form.tested_by}
                    onChange={(e) => updateField("tested_by", e.target.value)}
                    placeholder="Technician name"
                  />
                </label>

                <label>
                  Reviewed By
                  <input value={form.reviewed_by || ""} onChange={(e) => updateField("reviewed_by", e.target.value)} placeholder="Reviewer name" />
                </label>

                <label>
                  Status *
                  <select
                    value={form.status}
                    onChange={(e) => updateField("status", e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Passed">Passed</option>
                    <option value="Failed">Failed</option>
                    <option value="Review">Review</option>
                  </select>
                </label>

                <label className="full-width">
                  Test Details (JSON)
                  <textarea rows={6} value={detailsText} onChange={(e) => setDetailsText(e.target.value)} spellCheck={false} placeholder={'{ "result": "", "value": "" }'} />
                  <small>Keep test-specific values here. Enter a valid JSON object, or {} if not applicable.</small>
                </label>

                <label className="full-width">
                  Remarks
                  <textarea
                    rows={3}
                    value={form.remarks}
                    onChange={(e) => updateField("remarks", e.target.value)}
                    placeholder="Additional notes..."
                  />
                </label>
              </div>

              {formError && (
                <div className="record-error">{formError}</div>
              )}

              <div className="record-modal-actions">
                <button
                  className="secondary-button"
                  onClick={() => setViewingRecord(null)}
                >
                  Close
                </button>

                {canEditRecord && viewingRecord && (
                  <button
                    className="primary-button"
                    onClick={() => {
                      const record = viewingRecord;
                      setViewingRecord(null);
                      editRecord(record);
                    }}
                  >
                    Edit Record
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {(detailLoading || viewingRecord) && (
        <div className="record-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setViewingRecord(null); }}>
          <div className="record-modal" style={{ width: "min(900px, 96vw)", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="record-modal-header">
              <div><p className="eyebrow">QC RECORD DETAILS</p><h2>{detailLoading ? "Loading record..." : viewingRecord?.record_no}</h2></div>
              <button className="modal-close" onClick={() => setViewingRecord(null)} aria-label="Close"><X size={20} /></button>
            </div>
            {detailLoading ? <p>Loading record information and history...</p> : viewingRecord && <>
              <div className="record-form-grid">
                {[
                  ["Category", viewingRecord.category], ["Test Type", viewingRecord.test_type],
                  ["Sample Date", formatDate(viewingRecord.sample_date)], ["Location", viewingRecord.location],
                  ["Material / Product", viewingRecord.material], ["Status", viewingRecord.status],
                  ["Tested By", viewingRecord.tested_by], ["Reviewed By", viewingRecord.reviewed_by || "—"],
                  ["Created", viewingRecord.created_at ? new Date(viewingRecord.created_at).toLocaleString() : "—"],
                  ["Last Updated", viewingRecord.updated_at ? new Date(viewingRecord.updated_at).toLocaleString() : "—"],
                ].map(([label, value]) => <div key={label}><small style={{ color: "#64748b" }}>{label}</small><div style={{ fontWeight: 600, marginTop: 4 }}>{value || "—"}</div></div>)}
                <div className="full-width"><strong>Remarks</strong><p style={{ whiteSpace: "pre-wrap" }}>{viewingRecord.remarks || "—"}</p></div>
                <div className="full-width"><strong>Test Details</strong><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", background: "#f8fafc", padding: 12, borderRadius: 8 }}>{JSON.stringify(viewingRecord.details || {}, null, 2)}</pre></div>
              </div>
              <div style={{ marginTop: 24 }}><h3><History size={17} style={{ verticalAlign: "middle" }} /> Change History</h3>
                {recordHistory.length === 0 ? <p>No history entries are available for this record.</p> : <div style={{ display: "grid", gap: 12 }}>{recordHistory.map((item) => <div key={item.id} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><strong>{item.action}</strong><small>{item.created_at ? new Date(item.created_at).toLocaleString() : ""} · {item.changed_by}</small></div>
                  {item.changes && Object.keys(item.changes).length > 0 && <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 12, marginBottom: 0 }}>{JSON.stringify(item.changes, null, 2)}</pre>}
                </div>)}</div>}
              </div>
              <div className="record-modal-actions"><button className="secondary-button" onClick={() => setViewingRecord(null)}>Close</button><button className="primary-button" onClick={() => { const record = viewingRecord; setViewingRecord(null); editRecord(record); }}>Edit Record</button></div>
            </>}
          </div>
        </div>
      )}
    </div>
  );
}
