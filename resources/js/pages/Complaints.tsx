import React, { useEffect, useMemo, useState } from "react";

type Complaint = {
  id: number;
  complaint_no: string;
  complaint_date: string;
  customer_name: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  site_name: string;
  location?: string | null;
  product_type: string;
  product_size?: string | null;
  delivery_date?: string | null;
  invoice_no?: string | null;
  batch_no?: string | null;
  complaint_description: string;
  reported_action?: string | null;
  priority: string;
  status: string;
  assigned_to?: string | null;
  investigation?: string | null;
  root_cause?: string | null;
  corrective_action?: string | null;
  preventive_action?: string | null;
  resolution_date?: string | null;
  remarks?: string | null;
};

type ComplaintForm = Omit<Complaint, "id" | "complaint_no">;

const emptyForm: ComplaintForm = {
  complaint_date: new Date().toISOString().slice(0, 10),
  customer_name: "",
  contact_person: "",
  phone: "",
  email: "",
  site_name: "",
  location: "",
  product_type: "",
  product_size: "",
  delivery_date: "",
  invoice_no: "",
  batch_no: "",
  complaint_description: "",
  reported_action: "",
  priority: "Medium",
  status: "Open",
  assigned_to: "",
  investigation: "",
  root_cause: "",
  corrective_action: "",
  preventive_action: "",
  resolution_date: "",
  remarks: "",
};

const statuses = [
  "Open",
  "Under Investigation",
  "Pending Customer",
  "Resolved",
  "Closed",
];

const priorities = ["Low", "Medium", "High", "Urgent"];

async function apiRequest(url: string, options: RequestInit = {}) {
  const token = document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute("content");

  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": token || "",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 422 && data.errors) {
      const messages = Object.values(data.errors).flat().join("\n");
      throw new Error(messages || "Please check the entered information.");
    }

    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value + (value.length === 10 ? "T00:00:00" : ""));

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString();
}

function statusClass(status: string) {
  return status.toLowerCase().replaceAll(" ", "-");
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="complaint-field">
      <span>{label}{required ? " *" : ""}</span>
      <input
        type={type}
        value={value || ""}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="complaint-field complaint-field-full">
      <span>{label}</span>
      <textarea
        rows={3}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export default function Complaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const [modal, setModal] = useState<"closed" | "form" | "details">("closed");
  const [editing, setEditing] = useState<Complaint | null>(null);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [form, setForm] = useState<ComplaintForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadComplaints() {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status", statusFilter);
      if (priorityFilter) params.set("priority", priorityFilter);

      const query = params.toString();
      const data = await apiRequest(
        `/api/complaints${query ? `?${query}` : ""}`
      );

      setComplaints(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load complaints.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComplaints();
  }, [search, statusFilter, priorityFilter]);

  const summary = useMemo(() => ({
    total: complaints.length,
    open: complaints.filter((c) => c.status === "Open").length,
    investigation: complaints.filter(
      (c) => c.status === "Under Investigation"
    ).length,
    resolved: complaints.filter(
      (c) => c.status === "Resolved" || c.status === "Closed"
    ).length,
  }), [complaints]);

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm });
    setError("");
    setModal("form");
  }

  function openEdit(complaint: Complaint) {
    setEditing(complaint);

    const { id, complaint_no, ...values } = complaint;

    setForm({
      ...emptyForm,
      ...values,
      delivery_date: values.delivery_date || "",
      resolution_date: values.resolution_date || "",
    });

    setError("");
    setModal("form");
  }

  function updateField<K extends keyof ComplaintForm>(
    key: K,
    value: ComplaintForm[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveComplaint(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = editing
        ? `/api/complaints/${editing.id}`
        : "/api/complaints";

      await apiRequest(url, {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(form),
      });

      setModal("closed");
      setEditing(null);
      await loadComplaints();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save complaint.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteComplaint(complaint: Complaint) {
    if (!window.confirm(
      `Delete complaint ${complaint.complaint_no}? This cannot be undone.`
    )) return;

    try {
      await apiRequest(`/api/complaints/${complaint.id}`, {
        method: "DELETE",
      });

      if (selected?.id === complaint.id) {
        setSelected(null);
        setModal("closed");
      }

      await loadComplaints();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete complaint.");
    }
  }

  async function openDetails(complaint: Complaint) {
    try {
      const data = await apiRequest(`/api/complaints/${complaint.id}`);
      setSelected(data);
      setModal("details");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load complaint.");
    }
  }

  function printComplaint() {
    window.print();
  }

  return (
    <div className="complaints-page">
      <div className="complaints-heading">
        <div>
          <h1>Customer Complaints</h1>
          <p>Register, investigate and monitor customer complaints.</p>
        </div>

            <button
            type="button"
            onClick={openNew}
            style={{
                display: "block",
                visibility: "visible",
                opacity: 1,
                background: "#176b52",
                color: "#ffffff",
                padding: "12px 20px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: "bold",
                minWidth: "160px",
            }}
            >
            + New Complaint
            </button>
      </div>

      <div className="complaint-summary">
        <div className="complaint-summary-card">
          <span>Total Complaints</span>
          <strong>{summary.total}</strong>
        </div>
        <div className="complaint-summary-card">
          <span>Open</span>
          <strong>{summary.open}</strong>
        </div>
        <div className="complaint-summary-card">
          <span>Under Investigation</span>
          <strong>{summary.investigation}</strong>
        </div>
        <div className="complaint-summary-card">
          <span>Resolved / Closed</span>
          <strong>{summary.resolved}</strong>
        </div>
      </div>

      <div className="complaint-toolbar">
        <input
          type="search"
          placeholder="Search complaint no., customer, site, product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All priorities</option>
          {priorities.map((priority) => (
            <option key={priority} value={priority}>{priority}</option>
          ))}
        </select>

        <button className="complaint-secondary-btn" onClick={loadComplaints}>
          Refresh
        </button>
      </div>

      {error && (
        <div className="complaint-error">{error}</div>
      )}

      <div className="complaint-table-wrap">
        <table className="complaint-table">
          <thead>
            <tr>
              <th>Complaint No.</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Site</th>
              <th>Product</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td colSpan={8}>Loading complaints...</td></tr>
            ) : complaints.length === 0 ? (
              <tr><td colSpan={8}>No complaints found.</td></tr>
            ) : (
              complaints.map((complaint) => (
                <tr key={complaint.id}>
                  <td><strong>{complaint.complaint_no}</strong></td>
                  <td>{formatDate(complaint.complaint_date)}</td>
                  <td>{complaint.customer_name}</td>
                  <td>{complaint.site_name}</td>
                  <td>{complaint.product_type}</td>
                  <td>
                    <span className={`complaint-priority ${statusClass(complaint.priority)}`}>
                      {complaint.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`complaint-status ${statusClass(complaint.status)}`}>
                      {complaint.status}
                    </span>
                  </td>
                  <td>
                    <div className="complaint-actions">
                      <button onClick={() => openDetails(complaint)}>View</button>
                      <button onClick={() => openEdit(complaint)}>Edit</button>
                      <button className="danger" onClick={() => deleteComplaint(complaint)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal === "form" && (
        <div className="complaint-modal-backdrop">
          <div className="complaint-modal">
            <div className="complaint-modal-header">
              <div>
                <h2>{editing ? "Edit Complaint" : "New Complaint"}</h2>
                {editing && <p>{editing.complaint_no}</p>}
              </div>
              <button onClick={() => setModal("closed")}>✕</button>
            </div>

            <form onSubmit={saveComplaint}>
              <div className="complaint-form-section">
                <h3>Complaint Information</h3>
                <div className="complaint-form-grid">
                  <Field label="Complaint Date" type="date" required
                    value={form.complaint_date}
                    onChange={(v) => updateField("complaint_date", v)} />
                  <Field label="Customer Name" required
                    value={form.customer_name}
                    onChange={(v) => updateField("customer_name", v)} />
                  <Field label="Contact Person"
                    value={form.contact_person || ""}
                    onChange={(v) => updateField("contact_person", v)} />
                  <Field label="Phone"
                    value={form.phone || ""}
                    onChange={(v) => updateField("phone", v)} />
                  <Field label="Email" type="email"
                    value={form.email || ""}
                    onChange={(v) => updateField("email", v)} />
                  <Field label="Site Name" required
                    value={form.site_name}
                    onChange={(v) => updateField("site_name", v)} />
                  <Field label="Location"
                    value={form.location || ""}
                    onChange={(v) => updateField("location", v)} />
                </div>
              </div>

              <div className="complaint-form-section">
                <h3>Product and Delivery Information</h3>
                <div className="complaint-form-grid">
                  <Field label="Product Type" required
                    value={form.product_type}
                    onChange={(v) => updateField("product_type", v)} />
                  <Field label="Product Size"
                    value={form.product_size || ""}
                    onChange={(v) => updateField("product_size", v)} />
                  <Field label="Delivery Date" type="date"
                    value={form.delivery_date || ""}
                    onChange={(v) => updateField("delivery_date", v)} />
                  <Field label="Invoice Number"
                    value={form.invoice_no || ""}
                    onChange={(v) => updateField("invoice_no", v)} />
                  <Field label="Batch Number"
                    value={form.batch_no || ""}
                    onChange={(v) => updateField("batch_no", v)} />
                </div>
              </div>

              <div className="complaint-form-section">
                <h3>Complaint and Follow-up</h3>
                <div className="complaint-form-grid">
                  <TextField label="Complaint Description"
                    value={form.complaint_description}
                    onChange={(v) => updateField("complaint_description", v)} />
                  <TextField label="Action Reported / Taken"
                    value={form.reported_action || ""}
                    onChange={(v) => updateField("reported_action", v)} />
                  <label className="complaint-field">
                    <span>Priority</span>
                    <select value={form.priority}
                      onChange={(e) => updateField("priority", e.target.value)}>
                      {priorities.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </label>
                  <label className="complaint-field">
                    <span>Status</span>
                    <select value={form.status}
                      onChange={(e) => updateField("status", e.target.value)}>
                      {statuses.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </label>
                  <Field label="Assigned To"
                    value={form.assigned_to || ""}
                    onChange={(v) => updateField("assigned_to", v)} />
                  <Field label="Resolution Date" type="date"
                    value={form.resolution_date || ""}
                    onChange={(v) => updateField("resolution_date", v)} />
                  <TextField label="Investigation"
                    value={form.investigation || ""}
                    onChange={(v) => updateField("investigation", v)} />
                  <TextField label="Root Cause"
                    value={form.root_cause || ""}
                    onChange={(v) => updateField("root_cause", v)} />
                  <TextField label="Corrective Action"
                    value={form.corrective_action || ""}
                    onChange={(v) => updateField("corrective_action", v)} />
                  <TextField label="Preventive Action"
                    value={form.preventive_action || ""}
                    onChange={(v) => updateField("preventive_action", v)} />
                  <TextField label="Remarks"
                    value={form.remarks || ""}
                    onChange={(v) => updateField("remarks", v)} />
                </div>
              </div>

              {error && <div className="complaint-error">{error}</div>}

              <div className="complaint-modal-footer">
                <button type="button" className="complaint-secondary-btn"
                  onClick={() => setModal("closed")}>
                  Cancel
                </button>
                <button type="submit" className="complaint-primary-btn"
                  disabled={saving}>
                  {saving ? "Saving..." : editing ? "Update Complaint" : "Save Complaint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "details" && selected && (
        <div className="complaint-modal-backdrop">
          <div className="complaint-modal complaint-detail-modal">
            <div className="complaint-modal-header">
              <div>
                <h2>Complaint Details</h2>
                <p>{selected.complaint_no}</p>
              </div>
              <button onClick={() => setModal("closed")}>✕</button>
            </div>

            <div className="complaint-detail-content">
              <div className="complaint-detail-grid">
                <div><span>Complaint Date</span><strong>{formatDate(selected.complaint_date)}</strong></div>
                <div><span>Customer</span><strong>{selected.customer_name}</strong></div>
                <div><span>Contact Person</span><strong>{selected.contact_person || "—"}</strong></div>
                <div><span>Phone</span><strong>{selected.phone || "—"}</strong></div>
                <div><span>Email</span><strong>{selected.email || "—"}</strong></div>
                <div><span>Site</span><strong>{selected.site_name}</strong></div>
                <div><span>Location</span><strong>{selected.location || "—"}</strong></div>
                <div><span>Product</span><strong>{selected.product_type}</strong></div>
                <div><span>Product Size</span><strong>{selected.product_size || "—"}</strong></div>
                <div><span>Delivery Date</span><strong>{formatDate(selected.delivery_date)}</strong></div>
                <div><span>Invoice</span><strong>{selected.invoice_no || "—"}</strong></div>
                <div><span>Batch</span><strong>{selected.batch_no || "—"}</strong></div>
                <div><span>Priority</span><strong>{selected.priority}</strong></div>
                <div><span>Status</span><strong>{selected.status}</strong></div>
                <div><span>Assigned To</span><strong>{selected.assigned_to || "—"}</strong></div>
                <div><span>Resolution Date</span><strong>{formatDate(selected.resolution_date)}</strong></div>
              </div>

              {[
                ["Complaint Description", selected.complaint_description],
                ["Action Reported / Taken", selected.reported_action],
                ["Investigation", selected.investigation],
                ["Root Cause", selected.root_cause],
                ["Corrective Action", selected.corrective_action],
                ["Preventive Action", selected.preventive_action],
                ["Remarks", selected.remarks],
              ].map(([label, value]) => (
                <div className="complaint-detail-notes" key={label}>
                  <span>{label}</span>
                  <p>{value || "—"}</p>
                </div>
              ))}
            </div>

            <div className="complaint-modal-footer">
              <button className="complaint-secondary-btn" onClick={printComplaint}>
                Print
              </button>
              <button className="complaint-secondary-btn"
                onClick={() => openEdit(selected)}>
                Edit
              </button>
              <button className="complaint-primary-btn"
                onClick={() => setModal("closed")}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
