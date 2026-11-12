import { useEffect, useState, type FormEvent } from "react";
import { Search, Plus, Pencil, KeyRound, Users, RefreshCw } from "lucide-react";

type Role =
  | "administrator"
  | "manager"
  | "qc_engineer"
  | "lab_technician"
  | "viewer";

interface Employee {
  employee_id: string;
  name: string;
  role: Role;
  active: boolean;
  administrator: boolean;
  created_at: string | null;
}

const roles: { value: Role; label: string }[] = [
  { value: "administrator", label: "Administrator" },
  { value: "manager", label: "Manager" },
  { value: "qc_engineer", label: "QC Engineer" },
  { value: "lab_technician", label: "Lab Technician" },
  { value: "viewer", label: "Viewer" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #d8e0e9",
  borderRadius: 7,
  fontSize: 14,
  background: "#fff",
};

const buttonStyle: React.CSSProperties = {
  border: 0,
  borderRadius: 7,
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 13,
};

function csrfToken() {
  return document.querySelector<HTMLMetaElement>(
    'meta[name="csrf-token"]'
  )?.content ?? "";
}

export default function UsersPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    employee_id: "",
    name: "",
    role: "viewer" as Role,
    password: "",
    active: true,
  });

  async function apiRequest(url: string, method = "GET", body?: unknown) {
    const response = await fetch(url, {
      method,
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": csrfToken(),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      window.location.href = "/login";
      throw new Error("Your session has expired.");
    }

    if (!response.ok) {
      const validationMessage = data.errors
        ? Object.values(data.errors).flat().join(" ")
        : data.message;

      throw new Error(
        typeof validationMessage === "string"
          ? validationMessage
          : "The request could not be completed."
      );
    }

    return data;
  }

  async function loadEmployees() {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/api/users");
      setEmployees(data.employees ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load employees.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm({
      employee_id: "",
      name: "",
      role: "viewer",
      password: "",
      active: true,
    });
  }

  function startEdit(employee: Employee) {
    setEditingId(employee.employee_id);
    setForm({
      employee_id: employee.employee_id,
      name: employee.name,
      role: employee.role,
      password: "",
      active: employee.active,
    });

    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitForm(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      if (editingId) {
        await apiRequest(`/api/users/${encodeURIComponent(editingId)}`, "PATCH", {
          name: form.name,
          role: form.role,
          active: form.active,
        });

        setMessage("Employee account updated successfully.");
      } else {
        await apiRequest("/api/users", "POST", {
          employee_id: form.employee_id,
          name: form.name,
          role: form.role,
          password: form.password,
        });

        setMessage("New employee account created successfully.");
      }

      resetForm();
      await loadEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save employee.");
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword(employee: Employee) {
    const password = window.prompt(
      `Enter a new password for ${employee.name} (minimum 8 characters):`
    );

    if (password === null) return;

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    try {
      await apiRequest(
        `/api/users/${encodeURIComponent(employee.employee_id)}/password`,
        "PATCH",
        { password }
      );

      setMessage(`Password reset successfully for ${employee.name}.`);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed.");
    }
  }

  const filteredEmployees = employees.filter((employee) => {
    const term = search.toLowerCase();

    return (
      employee.name.toLowerCase().includes(term) ||
      employee.employee_id.toLowerCase().includes(term) ||
      employee.role.toLowerCase().includes(term)
    );
  });

  const activeCount = employees.filter((employee) => employee.active).length;

  const formatRole = (role: string) =>
    roles.find((item) => item.value === role)?.label ?? role;

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 15, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 25, color: "#1e293b" }}>
            User Management
          </h1>
          <p style={{ margin: "7px 0 0", color: "#718096", fontSize: 13 }}>
            Manage employee accounts, roles, passwords and access status.
          </p>
        </div>

        <button
          type="button"
          onClick={loadEmployees}
          style={{ ...buttonStyle, background: "#edf2f7", color: "#334155" }}
        >
          <RefreshCw size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
          Refresh
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 18 }}>
          <div style={{ color: "#718096", fontSize: 12 }}>Total employees</div>
          <div style={{ fontSize: 27, fontWeight: 700, marginTop: 5 }}>{employees.length}</div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 18 }}>
          <div style={{ color: "#718096", fontSize: 12 }}>Active accounts</div>
          <div style={{ fontSize: 27, fontWeight: 700, marginTop: 5, color: "#16834b" }}>{activeCount}</div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 18 }}>
          <div style={{ color: "#718096", fontSize: 12 }}>Inactive accounts</div>
          <div style={{ fontSize: 27, fontWeight: 700, marginTop: 5, color: "#b45309" }}>{employees.length - activeCount}</div>
        </div>
      </div>

      <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 11, padding: 20 }}>
        <h2 style={{ fontSize: 17, margin: "0 0 18px" }}>
          {editingId ? "Edit Employee Account" : "Add New Employee"}
        </h2>

        <form onSubmit={submitForm}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 15 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              Employee ID
              <input
                required
                disabled={!!editingId}
                value={form.employee_id}
                onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                placeholder="Enter employee ID"
                style={{ ...inputStyle, display: "block", marginTop: 7, opacity: editingId ? 0.65 : 1 }}
              />
            </label>

            <label style={{ fontSize: 13, fontWeight: 600 }}>
              Employee Name
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter full name"
                style={{ ...inputStyle, display: "block", marginTop: 7 }}
              />
            </label>

            <label style={{ fontSize: 13, fontWeight: 600 }}>
              Role
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                style={{ ...inputStyle, display: "block", marginTop: 7 }}
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </label>

            {!editingId && (
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                Initial Password
                <input
                  required
                  type="password"
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  style={{ ...inputStyle, display: "block", marginTop: 7 }}
                />
              </label>
            )}

            {editingId && (
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                Account Status
                <select
                  value={form.active ? "active" : "inactive"}
                  onChange={(e) => setForm({ ...form, active: e.target.value === "active" })}
                  style={{ ...inputStyle, display: "block", marginTop: 7 }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            )}
          </div>

          <div style={{ display: "flex", gap: 9, marginTop: 20, flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={saving}
              style={{ ...buttonStyle, background: "#173b63", color: "#fff", opacity: saving ? 0.6 : 1 }}
            >
              <Plus size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
              {saving ? "Saving..." : editingId ? "Save Changes" : "Create Employee"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{ ...buttonStyle, background: "#edf2f7", color: "#334155" }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {message && (
        <div style={{ padding: 12, borderRadius: 7, background: "#eaf7ef", color: "#17663b", fontSize: 13 }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{ padding: 12, borderRadius: 7, background: "#fff0f0", color: "#a32d2d", fontSize: 13 }}>
          {error}
        </div>
      )}

      <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 11, overflow: "hidden" }}>
        <div style={{ padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 17 }}>
            <Users size={17} style={{ verticalAlign: "middle", marginRight: 8 }} />
            Employee Accounts
          </h2>

          <div style={{ position: "relative", width: "min(100%,280px)" }}>
            <Search size={16} style={{ position: "absolute", left: 10, top: 11, color: "#94a3b8" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees..."
              style={{ ...inputStyle, paddingLeft: 34 }}
            />
          </div>
        </div>

        {loading ? (
          <p style={{ padding: 20, color: "#718096" }}>Loading employees...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
              <thead>
                <tr style={{ background: "#f7f9fc", textAlign: "left" }}>
                  {["Employee ID", "Employee Name", "Role", "Status", "Actions"].map((heading) => (
                    <th key={heading} style={{ padding: 13, fontSize: 12, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.employee_id}>
                    <td style={{ padding: 13, borderBottom: "1px solid #edf0f4", fontSize: 13 }}>
                      {employee.employee_id}
                    </td>
                    <td style={{ padding: 13, borderBottom: "1px solid #edf0f4", fontSize: 13, fontWeight: 600 }}>
                      {employee.name}
                    </td>
                    <td style={{ padding: 13, borderBottom: "1px solid #edf0f4", fontSize: 13 }}>
                      {formatRole(employee.role)}
                    </td>
                    <td style={{ padding: 13, borderBottom: "1px solid #edf0f4" }}>
                      <span style={{
                        padding: "5px 9px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 700,
                        background: employee.active ? "#e8f6ee" : "#fff1e8",
                        color: employee.active ? "#187345" : "#b45309",
                      }}>
                        {employee.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: 13, borderBottom: "1px solid #edf0f4" }}>
                      <div style={{ display: "flex", gap: 7 }}>
                        <button
                          type="button"
                          title="Edit employee"
                          onClick={() => startEdit(employee)}
                          style={{ ...buttonStyle, padding: 8, background: "#edf3fa", color: "#245b91" }}
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          title="Reset password"
                          onClick={() => resetPassword(employee)}
                          style={{ ...buttonStyle, padding: 8, background: "#f1f5f9", color: "#475569" }}
                        >
                          <KeyRound size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 25, textAlign: "center", color: "#718096" }}>
                      No employee accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}