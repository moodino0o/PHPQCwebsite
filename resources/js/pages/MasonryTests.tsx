import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQcFormOptions } from "../hooks/useQcFormOptions.ts";
import {
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Save,
  FlaskConical,
} from "lucide-react";

type MasonryTest = {
  id: number;
  record_no: string;
  specimen_no?: string | null;
  test_date: string;
  location: string;
  block_type: string;
  block_size: string;
  length: string | number;
  width: string | number;
  height: string | number;
  net_area?: string | number | null;
  failure_load?: string | number | null;
  compressive_strength?: string | number | null;
  required_strength: string | number;
  dry_weight?: string | number | null;
  saturated_weight?: string | number | null;
  water_absorption?: string | number | null;
  max_absorption?: string | number | null;
  density?: string | number | null;
  status: string;
  tested_by: string;
  remarks?: string | null;
};

type TestForm = {
  record_no: string;
  specimen_no: string;
  test_date: string;
  location: string;
  block_type: string;
  block_size: string;
  length: string;
  width: string;
  height: string;
  net_area: string;
  failure_load: string;
  required_strength: string;
  dry_weight: string;
  saturated_weight: string;
  max_absorption: string;
  tested_by: string;
  remarks: string;
};

const emptyForm: TestForm = {
  record_no: "",
  specimen_no: "",
  test_date: new Date().toISOString().slice(0, 10),
  location: "Hidd",
  block_type: "",
  block_size: "",
  length: "400",
  width: "200",
  height: "200",
  net_area: "",
  failure_load: "",
  required_strength: "",
  dry_weight: "",
  saturated_weight: "",
  max_absorption: "",
  tested_by: "",
  remarks: "",
};

function numberValue(value: string | number | null | undefined) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function calculate(form: TestForm) {
  const load = numberValue(form.failure_load);
  const area = numberValue(form.net_area);
  const dry = numberValue(form.dry_weight);
  const saturated = numberValue(form.saturated_weight);
  const maxAbsorption = numberValue(form.max_absorption);
  const requiredStrength = numberValue(form.required_strength);

  const strength =
    load > 0 && area > 0 ? (load * 1000) / area : null;

  const absorption =
    dry > 0 && saturated >= dry
      ? ((saturated - dry) / dry) * 100
      : null;

  const length = numberValue(form.length);
  const width = numberValue(form.width);
  const height = numberValue(form.height);

  const volume = (length * width * height) / 1000000000;
  const density =
    dry > 0 && volume > 0 ? dry / volume : null;

  let status = "Pending";

  if (strength !== null && requiredStrength > 0) {
    const strengthPass = strength >= requiredStrength;

    const absorptionPass =
      maxAbsorption <= 0 ||
      (absorption !== null && absorption <= maxAbsorption);

    if (strengthPass && absorptionPass) {
      status = "Passed";
    } else if (
      !strengthPass ||
      (absorption !== null && !absorptionPass)
    ) {
      status = "Failed";
    } else {
      status = "Review";
    }
  }

  return { strength, absorption, density, status };
}

async function apiRequest(url: string, options: RequestInit = {}) {
  const csrfToken = document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute("content");

  const response = await fetch(url, {
    ...options,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": csrfToken || "",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (data.errors) {
      const messages = Object.values(data.errors).flat();
      throw new Error(messages.join(" "));
    }

    throw new Error(data.message || "The request could not be completed.");
  }

  return data;
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "Passed"
      ? "masonry-status passed"
      : status === "Failed"
      ? "masonry-status failed"
      : status === "Review"
      ? "masonry-status review"
      : "masonry-status pending";

  return <span className={className}>{status}</span>;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  step,
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  step?: string;
  min?: string;
}) {
  return (
    <label className="masonry-field">
      <span>
        {label}
        {required && <b className="masonry-required"> *</b>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        step={step}
        min={min}
      />
    </label>
  );
}

export default function MasonryTests() {
  const {
    masonry_block_types,
    masonry_block_sizes,
    loading: referenceLoading,
    error: referenceError,
  } = useQcFormOptions();
  const [tests, setTests] = useState<MasonryTest[]>([]);
  const [form, setForm] = useState<TestForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sizeFilter, setSizeFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const results = useMemo(() => calculate(form), [form]);

  async function loadTests() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "All") params.set("status", statusFilter);
      if (sizeFilter !== "All") params.set("block_size", sizeFilter);

      const query = params.toString();
      const data = await apiRequest(
        `/api/masonry-tests${query ? `?${query}` : ""}`
      );

      setTests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load Masonry tests."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTests();
  }, [search, statusFilter, sizeFilter]);

  function updateField<K extends keyof TestForm>(
    key: K,
    value: TestForm[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openNewForm() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      test_date: new Date().toISOString().slice(0, 10),
      block_type: masonry_block_types[0] ?? "",
      block_size: masonry_block_sizes[0] ?? "",
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(test: MasonryTest) {
    setEditingId(test.id);

    setForm({
      record_no: test.record_no || "",
      specimen_no: test.specimen_no || "",
      test_date: String(test.test_date).slice(0, 10),
      location: test.location || "",
      block_type: test.block_type || "",
      block_size: test.block_size || "",
      length: String(test.length ?? ""),
      width: String(test.width ?? ""),
      height: String(test.height ?? ""),
      net_area: test.net_area == null ? "" : String(test.net_area),
      failure_load: test.failure_load == null ? "" : String(test.failure_load),
      required_strength: String(test.required_strength ?? ""),
      dry_weight: test.dry_weight == null ? "" : String(test.dry_weight),
      saturated_weight:
        test.saturated_weight == null ? "" : String(test.saturated_weight),
      max_absorption:
        test.max_absorption == null ? "" : String(test.max_absorption),
      tested_by: test.tested_by || "",
      remarks: test.remarks || "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  async function saveTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      form.saturated_weight &&
      form.dry_weight &&
      numberValue(form.saturated_weight) < numberValue(form.dry_weight)
    ) {
      setError("Saturated weight cannot be less than dry weight.");
      return;
    }

    if (form.max_absorption && (!form.dry_weight || !form.saturated_weight)) {
      setError("Enter both dry and saturated weights to assess absorption.");
      return;
    }

    if (form.failure_load && !form.net_area) {
      setError("Enter the net bearing area to calculate compressive strength.");
      return;
    }

    setSaving(true);

    try {
      const url = editingId
        ? `/api/masonry-tests/${editingId}`
        : "/api/masonry-tests";

      const method = editingId ? "PATCH" : "POST";

      await apiRequest(url, {
        method,
        body: JSON.stringify({
          ...form,
          specimen_no: form.specimen_no || null,
          net_area: form.net_area || null,
          failure_load: form.failure_load || null,
          dry_weight: form.dry_weight || null,
          saturated_weight: form.saturated_weight || null,
          max_absorption: form.max_absorption || null,
          remarks: form.remarks || null,
        }),
      });

      setSuccess(editingId ? "Test updated successfully." : "Test saved successfully.");
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadTests();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save the test."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteTest(test: MasonryTest) {
    if (!window.confirm(`Delete test ${test.record_no}? This cannot be undone.`)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await apiRequest(`/masonry-tests/${test.id}`, {
        method: "DELETE",
      });

      setSuccess("Test deleted successfully.");
      await loadTests();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete the test."
      );
    }
  }

  const passed = tests.filter((test) => test.status === "Passed").length;
  const failed = tests.filter((test) => test.status === "Failed").length;
  const pending = tests.filter((test) => test.status === "Pending").length;

  return (
    <div className="masonry-page">
      <div className="masonry-header">
        <div>
          <div className="masonry-eyebrow">
            <FlaskConical size={16} />
            QUALITY CONTROL / MASONRY
          </div>
          <h1>Masonry Testing</h1>
          <p>Block testing, calculated results and laboratory test history.</p>
        </div>

        <button className="masonry-primary-button" onClick={openNewForm}>
          <Plus size={18} />
          New Test
        </button>
      </div>

      {error && <div className="masonry-alert error">{error}</div>}
      {success && <div className="masonry-alert success">{success}</div>}

      <div className="masonry-stats">
        <div className="masonry-stat-card">
          <span>Total Tests</span>
          <strong>{tests.length}</strong>
        </div>
        <div className="masonry-stat-card">
          <span>Passed</span>
          <strong>{passed}</strong>
        </div>
        <div className="masonry-stat-card">
          <span>Failed</span>
          <strong>{failed}</strong>
        </div>
        <div className="masonry-stat-card">
          <span>Pending</span>
          <strong>{pending}</strong>
        </div>
      </div>

      <section className="masonry-panel">
        <div className="masonry-panel-heading">
          <div>
            <h2>Test Register</h2>
            <p>Search and review previously recorded Masonry tests.</p>
          </div>
          <button
            className="masonry-secondary-button"
            onClick={loadTests}
            type="button"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        <div className="masonry-filters">
          <label className="masonry-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search record, specimen, location or tester..."
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All statuses</option>
            <option value="Passed">Passed</option>
            <option value="Failed">Failed</option>
            <option value="Pending">Pending</option>
            <option value="Review">Review</option>
          </select>

          <select
            value={sizeFilter}
            onChange={(event) => setSizeFilter(event.target.value)}
          >
            <option value="All">All block sizes</option>
            {masonry_block_sizes.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        <div className="masonry-table-wrap">
          <table className="masonry-table">
            <thead>
              <tr>
                <th>Record No.</th>
                <th>Date</th>
                <th>Block</th>
                <th>Location</th>
                <th>Strength (N/mm²)</th>
                <th>Absorption (%)</th>
                <th>Density (kg/m³)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="masonry-empty">
                    Loading Masonry tests...
                  </td>
                </tr>
              ) : tests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="masonry-empty">
                    No Masonry tests found. Select New Test to enter your first test.
                  </td>
                </tr>
              ) : (
                tests.map((test) => (
                  <tr key={test.id}>
                    <td>
                      <strong>{test.record_no}</strong>
                      {test.specimen_no && (
                        <small>{test.specimen_no}</small>
                      )}
                    </td>
                    <td>{String(test.test_date).slice(0, 10)}</td>
                    <td>
                      {test.block_size} {test.block_type}
                    </td>
                    <td>{test.location}</td>
                    <td>
                      {test.compressive_strength == null
                        ? "—"
                        : numberValue(test.compressive_strength).toFixed(2)}
                    </td>
                    <td>
                      {test.water_absorption == null
                        ? "—"
                        : numberValue(test.water_absorption).toFixed(2)}
                    </td>
                    <td>
                      {test.density == null
                        ? "—"
                        : numberValue(test.density).toFixed(0)}
                    </td>
                    <td><StatusBadge status={test.status} /></td>
                    <td>
                      <div className="masonry-actions">
                        <button
                          type="button"
                          title="Edit test"
                          onClick={() => openEditForm(test)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          title="Delete test"
                          onClick={() => deleteTest(test)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showForm && (
        <div className="masonry-modal-backdrop">
          <div className="masonry-modal">
            <div className="masonry-modal-header">
              <div>
                <h2>{editingId ? "Edit Masonry Test" : "New Masonry Test"}</h2>
                <p>Enter specimen details and laboratory measurements.</p>
              </div>
              <button
                type="button"
                className="masonry-close-button"
                onClick={() => setShowForm(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveTest}>
              <div className="masonry-form-body">
                {referenceError && (
                  <div className="masonry-alert error">
                    {referenceError} Block options are loaded from PostgreSQL.
                  </div>
                )}
                <h3>Test Information</h3>
                <div className="masonry-form-grid">
                  <Field label="Record Number" value={form.record_no}
                    onChange={(v) => updateField("record_no", v)} required />
                  <Field label="Specimen Number" value={form.specimen_no}
                    onChange={(v) => updateField("specimen_no", v)} />
                  <Field label="Test Date" type="date" value={form.test_date}
                    onChange={(v) => updateField("test_date", v)} required />
                  <Field label="Location / Site" value={form.location}
                    onChange={(v) => updateField("location", v)} required />
                  <label className="masonry-field">
                    <span>Block Type *</span>
                    <select
                      required
                      value={form.block_type}
                      disabled={referenceLoading || !!referenceError || masonry_block_types.length === 0}
                      onChange={(e) => updateField("block_type", e.target.value)}
                    >
                      <option value="">
                        {referenceLoading ? "Loading database values..." : referenceError ? "Database options unavailable" : "Select block type"}
                      </option>
                      {masonry_block_types.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </label>
                  <label className="masonry-field">
                    <span>Block Size *</span>
                    <select
                      required
                      value={form.block_size}
                      disabled={referenceLoading || !!referenceError || masonry_block_sizes.length === 0}
                      onChange={(e) => updateField("block_size", e.target.value)}
                    >
                      <option value="">
                        {referenceLoading ? "Loading database values..." : referenceError ? "Database options unavailable" : "Select block size"}
                      </option>
                      {masonry_block_sizes.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </label>
                  <Field label="Tested By" value={form.tested_by}
                    onChange={(v) => updateField("tested_by", v)} required />
                </div>

                <h3>Block Dimensions (mm)</h3>
                <div className="masonry-form-grid three">
                  <Field label="Length (mm)" type="number" min="0.01" step="0.01"
                    value={form.length} onChange={(v) => updateField("length", v)} required />
                  <Field label="Width (mm)" type="number" min="0.01" step="0.01"
                    value={form.width} onChange={(v) => updateField("width", v)} required />
                  <Field label="Height (mm)" type="number" min="0.01" step="0.01"
                    value={form.height} onChange={(v) => updateField("height", v)} required />
                </div>

                <h3>Compressive Strength</h3>
                <div className="masonry-form-grid three">
                  <Field label="Net Bearing Area (mm²)" type="number" min="0.01" step="0.01"
                    value={form.net_area} onChange={(v) => updateField("net_area", v)}
                    placeholder="Enter measured net area" />
                  <Field label="Failure Load (kN)" type="number" min="0.001" step="0.001"
                    value={form.failure_load} onChange={(v) => updateField("failure_load", v)} />
                  <Field label="Required Strength (N/mm²)" type="number" min="0.001" step="0.001"
                    value={form.required_strength}
                    onChange={(v) => updateField("required_strength", v)} required />
                </div>

                <h3>Water Absorption</h3>
                <div className="masonry-form-grid three">
                  <Field label="Dry Weight (kg)" type="number" min="0.001" step="0.001"
                    value={form.dry_weight} onChange={(v) => updateField("dry_weight", v)} />
                  <Field label="Saturated Weight (kg)" type="number" min="0.001" step="0.001"
                    value={form.saturated_weight}
                    onChange={(v) => updateField("saturated_weight", v)} />
                  <Field label="Maximum Absorption (%)" type="number" min="0.001" step="0.001"
                    value={form.max_absorption}
                    onChange={(v) => updateField("max_absorption", v)} />
                </div>

                <h3>Live Calculated Results</h3>
                <div className="masonry-results">
                  <div>
                    <span>Compressive Strength</span>
                    <strong>
                      {results.strength === null ? "—" : `${results.strength.toFixed(2)} N/mm²`}
                    </strong>
                  </div>
                  <div>
                    <span>Water Absorption</span>
                    <strong>
                      {results.absorption === null ? "—" : `${results.absorption.toFixed(2)}%`}
                    </strong>
                  </div>
                  <div>
                    <span>Dry Density</span>
                    <strong>
                      {results.density === null ? "—" : `${results.density.toFixed(0)} kg/m³`}
                    </strong>
                  </div>
                  <div>
                    <span>Assessment</span>
                    <strong><StatusBadge status={results.status} /></strong>
                  </div>
                </div>

                <p className="masonry-calculation-note">
                  Strength = failure load × 1000 ÷ net area.
                  Absorption = (saturated weight − dry weight) ÷ dry weight × 100.
                  Density uses the external block volume.
                </p>

                <h3>Remarks</h3>
                <label className="masonry-field">
                  <span>Comments / Observations</span>
                  <textarea
                    rows={3}
                    value={form.remarks}
                    onChange={(e) => updateField("remarks", e.target.value)}
                    placeholder="Enter observations or test remarks..."
                  />
                </label>
              </div>

              {error && <div className="masonry-alert error">{error}</div>}

              <div className="masonry-modal-footer">
                <button type="button" className="masonry-secondary-button"
                  onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="masonry-primary-button" disabled={saving}>
                  <Save size={16} />
                  {saving ? "Saving..." : editingId ? "Update Test" : "Save Test"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
