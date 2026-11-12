import { useEffect, useMemo, useState } from "react";

type ArchivedReport = {
  id: number;
  report_number: string;
  title: string;
  report_type: string;
  customer: string | null;
  reference_number: string | null;
  report_date: string | null;
  status: string;
  report_data: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
};

const reportTypes = [
  "Concrete Block Test",
  "Paving Block Test",
  "Sand Sieve Analysis",
  "Aggregate Sieve Analysis",
  "Water Quality Test",
  "Kerb Stone Test",
  "Ready Mix",
  "RMX Trial",
  "Precast",
  "Other",
];

const emptyForm = {
  report_number: "",
  title: "",
  report_type: "Concrete Block Test",
  customer: "",
  reference_number: "",
  report_date: new Date().toISOString().slice(0, 10),
  status: "Archived",
  report_data: "{}",
  notes: "",
};

export default function Archive() {
  const [reports, setReports] = useState<ArchivedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedReport, setSelectedReport] = useState<ArchivedReport | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const styles = {
    page: { padding: "24px", color: "#1f2937" } as const,
    heading: { fontSize: "26px", fontWeight: 700, marginBottom: "6px" } as const,
    muted: { color: "#6b7280", fontSize: "13px" } as const,
    panel: {
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: "10px",
      padding: "18px",
      marginTop: "18px",
    } as const,
    input: {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      background: "#fff",
      color: "#111827",
      minWidth: 0,
    } as const,
    label: {
      display: "block",
      fontSize: "13px",
      fontWeight: 600,
      marginBottom: "6px",
    } as const,
    button: {
      border: "none",
      borderRadius: "6px",
      padding: "10px 15px",
      cursor: "pointer",
      fontWeight: 600,
    } as const,
  };

  async function loadReports() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (search) params.set("q", search);
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);

      const response = await fetch(`/api/archive?${params.toString()}`);

      if (!response.ok) throw new Error("Could not load archived reports.");

      const data = await response.json();
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, [search, typeFilter, statusFilter, fromDate, toDate]);

  const stats = useMemo(() => ({
    total: reports.length,
    archived: reports.filter((r) => r.status === "Archived").length,
    draft: reports.filter((r) => r.status === "Draft").length,
  }), [reports]);

  function openNewForm() {
    setEditingId(null);
    setForm(emptyForm);
    setSelectedReport(null);
    setError("");
    setShowForm(true);
  }

  function openEditForm(report: ArchivedReport) {
    setEditingId(report.id);
    setForm({
      report_number: report.report_number,
      title: report.title,
      report_type: report.report_type,
      customer: report.customer ?? "",
      reference_number: report.reference_number ?? "",
      report_date: report.report_date?.slice(0, 10) ?? "",
      status: report.status,
      report_data: JSON.stringify(report.report_data ?? {}, null, 2),
      notes: report.notes ?? "",
    });
    setSelectedReport(null);
    setError("");
    setShowForm(true);
  }

  async function saveReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    let parsedData: Record<string, unknown>;

    try {
      parsedData = JSON.parse(form.report_data || "{}");

      if (
        parsedData === null ||
        Array.isArray(parsedData) ||
        typeof parsedData !== "object"
      ) {
        throw new Error("Report data must be a JSON object.");
      }
    } catch {
      setError("Report Data must contain valid JSON in object format.");
      setSaving(false);
      return;
    }

    const payload = {
      report_number: form.report_number || null,
      title: form.title,
      report_type: form.report_type,
      customer: form.customer || null,
      reference_number: form.reference_number || null,
      report_date: form.report_date || null,
      status: form.status,
      report_data: parsedData,
      notes: form.notes || null,
    };

    try {
      const response = await fetch(
        editingId ? `/api/archive/${editingId}` : "/api/archive",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        const message = result.message || "Could not save the report.";
        throw new Error(message);
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save report.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteReport(report: ArchivedReport) {
    if (!window.confirm(`Delete archived report ${report.report_number}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/archive/${report.id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error("Could not delete report.");

      setSelectedReport(null);
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  return (
    <div style={styles.page}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <h1 style={styles.heading}>QC Report Archive</h1>
          <p style={styles.muted}>
            Store, search and manage your archived quality control reports.
          </p>
        </div>

        <button
          style={{ ...styles.button, background: "#1d4ed8", color: "#fff" }}
          onClick={openNewForm}
        >
          + Archive New Report
        </button>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 14,
        marginTop: 20,
      }}>
        {[
          ["Total Reports", stats.total],
          ["Archived", stats.archived],
          ["Drafts", stats.draft],
        ].map(([label, value]) => (
          <div key={label} style={styles.panel}>
            <div style={styles.muted}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={styles.panel}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginTop: 0 }}>
          Search and Filter
        </h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
        }}>
          <input
            style={styles.input}
            placeholder="Search report number, title or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            style={styles.input}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Report Types</option>
            {reportTypes.map((type) => <option key={type}>{type}</option>)}
          </select>

          <select
            style={styles.input}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Archived">Archived</option>
            <option value="Draft">Draft</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <input
            style={styles.input}
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            title="From date"
          />

          <input
            style={styles.input}
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            title="To date"
          />
        </div>
      </div>

      {showForm && (
        <div style={styles.panel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0 }}>
              {editingId ? "Edit Archived Report" : "Archive New Report"}
            </h2>
            <button
              style={{ ...styles.button, background: "#e5e7eb" }}
              type="button"
              onClick={() => setShowForm(false)}
            >
              Close
            </button>
          </div>

          <form onSubmit={saveReport}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}>
              <label>
                <span style={styles.label}>Report Number (optional)</span>
                <input
                  style={styles.input}
                  value={form.report_number}
                  onChange={(e) => setForm({ ...form, report_number: e.target.value })}
                  placeholder="Auto-generated if empty"
                />
              </label>

              <label>
                <span style={styles.label}>Report Title *</span>
                <input
                  style={styles.input}
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>

              <label>
                <span style={styles.label}>Report Type *</span>
                <select
                  style={styles.input}
                  value={form.report_type}
                  onChange={(e) => setForm({ ...form, report_type: e.target.value })}
                >
                  {reportTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>

              <label>
                <span style={styles.label}>Customer</span>
                <input
                  style={styles.input}
                  value={form.customer}
                  onChange={(e) => setForm({ ...form, customer: e.target.value })}
                />
              </label>

              <label>
                <span style={styles.label}>Reference Number</span>
                <input
                  style={styles.input}
                  value={form.reference_number}
                  onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                />
              </label>

              <label>
                <span style={styles.label}>Report Date</span>
                <input
                  style={styles.input}
                  type="date"
                  value={form.report_date}
                  onChange={(e) => setForm({ ...form, report_date: e.target.value })}
                />
              </label>

              <label>
                <span style={styles.label}>Status</span>
                <select
                  style={styles.input}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option>Archived</option>
                  <option>Draft</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                </select>
              </label>
            </div>

            <label style={{ display: "block", marginTop: 16 }}>
              <span style={styles.label}>Report Data (JSON)</span>
              <textarea
                style={{ ...styles.input, minHeight: 130, fontFamily: "monospace" }}
                value={form.report_data}
                onChange={(e) => setForm({ ...form, report_data: e.target.value })}
              />
            </label>

            <label style={{ display: "block", marginTop: 16 }}>
              <span style={styles.label}>Notes</span>
              <textarea
                style={{ ...styles.input, minHeight: 80 }}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </label>

            {error && <p style={{ color: "#dc2626" }}>{error}</p>}

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button
                type="submit"
                disabled={saving}
                style={{ ...styles.button, background: "#1d4ed8", color: "#fff" }}
              >
                {saving ? "Saving..." : editingId ? "Save Changes" : "Save to Archive"}
              </button>

              <button
                type="button"
                style={{ ...styles.button, background: "#e5e7eb" }}
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedReport && (
        <div style={styles.panel}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0 }}>
              {selectedReport.title}
            </h2>
            <button
              style={{ ...styles.button, background: "#e5e7eb" }}
              onClick={() => setSelectedReport(null)}
            >
              Close Details
            </button>
          </div>

          <p><strong>Report Number:</strong> {selectedReport.report_number}</p>
          <p><strong>Type:</strong> {selectedReport.report_type}</p>
          <p><strong>Customer:</strong> {selectedReport.customer || "—"}</p>
          <p><strong>Reference:</strong> {selectedReport.reference_number || "—"}</p>
          <p><strong>Date:</strong> {selectedReport.report_date || "—"}</p>
          <p><strong>Status:</strong> {selectedReport.status}</p>
          <p><strong>Notes:</strong> {selectedReport.notes || "—"}</p>

          <h3 style={{ fontWeight: 700 }}>Stored Report Data</h3>
          <pre style={{
            background: "#f3f4f6",
            padding: 14,
            borderRadius: 6,
            overflowX: "auto",
            whiteSpace: "pre-wrap",
          }}>
            {JSON.stringify(selectedReport.report_data ?? {}, null, 2)}
          </pre>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              style={{ ...styles.button, background: "#1d4ed8", color: "#fff" }}
              onClick={() => openEditForm(selectedReport)}
            >
              Edit Report
            </button>
            <button
              style={{ ...styles.button, background: "#fee2e2", color: "#991b1b" }}
              onClick={() => deleteReport(selectedReport)}
            >
              Delete Report
            </button>
          </div>
        </div>
      )}

      <div style={styles.panel}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0 }}>
          Archived Reports
        </h2>

        {error && !showForm && <p style={{ color: "#dc2626" }}>{error}</p>}

        {loading ? (
          <p>Loading archived reports...</p>
        ) : reports.length === 0 ? (
          <p style={styles.muted}>No archived reports found. Use "Archive New Report" to add one.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 750 }}>
              <thead>
                <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
                  {["Report Number", "Title", "Type", "Customer", "Date", "Status", "Actions"].map((heading) => (
                    <th key={heading} style={{ padding: 12, fontSize: 13, borderBottom: "1px solid #e5e7eb" }}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>{report.report_number}</td>
                    <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>{report.title}</td>
                    <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>{report.report_type}</td>
                    <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>{report.customer || "—"}</td>
                    <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>{report.report_date || "—"}</td>
                    <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb" }}>{report.status}</td>
                    <td style={{ padding: 12, borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" }}>
                      <button
                        style={{ ...styles.button, background: "#dbeafe", color: "#1e40af", marginRight: 6 }}
                        onClick={() => setSelectedReport(report)}
                      >
                        View
                      </button>
                      <button
                        style={{ ...styles.button, background: "#e5e7eb" }}
                        onClick={() => openEditForm(report)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
