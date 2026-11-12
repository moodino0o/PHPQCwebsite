import React, { useEffect, useState } from "react";
import {
  FileText,
  Plus,
  Search,
  Copy,
  Trash2,
  Star,
  Edit,
  Layout,
  History,
  RefreshCw,
  X,
} from "lucide-react";

type ReportTemplate = {
  id: number;
  test_type: string;
  name: string;
  description: string | null;
  is_default: boolean;
  version: number;
  design: Record<string, any>;
  history: any[];
};

type ReportLayout = {
  id: number;
  test_type: string;
  name: string;
  config: Record<string, any>;
};

const defaultDesign = {
  page: {
    size: "A4",
    orientation: "portrait",
    margins: {
      top: 20,
      bottom: 20,
      left: 15,
      right: 15,
    },
  },
  elements: [],
};

const defaultLayout = {
  page: "A4",
  orientation: "portrait",
  sections: [],
};

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
      throw new Error(
        Object.values(data.errors).flat().join("\n")
      );
    }

    throw new Error(data.message || "Request failed.");
  }

  return data;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #d8dee8",
  borderRadius: 7,
  fontSize: 14,
  boxSizing: "border-box",
  background: "#fff",
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #d8dee8",
  borderRadius: 7,
  padding: "9px 13px",
  background: "#fff",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  fontSize: 13,
};

export default function Reports() {
  const [types, setTypes] = useState<string[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [layouts, setLayouts] = useState<ReportLayout[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [activeTab, setActiveTab] = useState<"templates" | "layouts">(
    "templates"
  );

  const [modal, setModal] = useState<"closed" | "template" | "layout">(
    "closed"
  );

  const [editingTemplate, setEditingTemplate] =
    useState<ReportTemplate | null>(null);

  const [editingLayout, setEditingLayout] =
    useState<ReportLayout | null>(null);

  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");
  const [designText, setDesignText] = useState(
    JSON.stringify(defaultDesign, null, 2)
  );
  const [isDefault, setIsDefault] = useState(false);

  const [layoutName, setLayoutName] = useState("");
  const [layoutText, setLayoutText] = useState(
    JSON.stringify(defaultLayout, null, 2)
  );

  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/api/reports");

      setTypes(data.types || []);
      setTemplates(data.templates || []);
      setLayouts(data.layouts || []);

      if (!selectedType && data.types?.length) {
        setSelectedType(data.types[0]);
      }
    } catch (err: any) {
      setError(err.message || "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function notify(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(""), 3500);
  }

  function openNewTemplate() {
    setEditingTemplate(null);
    setTemplateName("");
    setDescription("");
    setIsDefault(false);
    setDesignText(JSON.stringify(defaultDesign, null, 2));
    setModal("template");
    setError("");
  }

  function openEditTemplate(template: ReportTemplate) {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setDescription(template.description || "");
    setIsDefault(template.is_default);
    setDesignText(JSON.stringify(template.design, null, 2));
    setModal("template");
    setError("");
  }

  function openNewLayout() {
    setEditingLayout(null);
    setLayoutName("");
    setLayoutText(JSON.stringify(defaultLayout, null, 2));
    setModal("layout");
    setError("");
  }

  function openEditLayout(layout: ReportLayout) {
    setEditingLayout(layout);
    setLayoutName(layout.name);
    setLayoutText(JSON.stringify(layout.config, null, 2));
    setModal("layout");
    setError("");
  }

  async function saveTemplate(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const design = JSON.parse(designText);

      const payload = {
        test_type: selectedType,
        name: templateName,
        description,
        design,
        is_default: isDefault,
      };

      if (editingTemplate) {
        await apiRequest(
          `/api/report-templates/${editingTemplate.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        );
      } else {
        await apiRequest("/api/report-templates", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setModal("closed");
      await loadData();
      notify("Report template saved successfully.");
    } catch (err: any) {
      setError(
        err instanceof SyntaxError
          ? "The design JSON is invalid. Please check its format."
          : err.message
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveLayout(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const config = JSON.parse(layoutText);

      await apiRequest("/api/report-layouts", {
        method: "POST",
        body: JSON.stringify({
          test_type: selectedType,
          name: layoutName,
          config,
        }),
      });

      setModal("closed");
      await loadData();
      notify("Report layout saved successfully.");
    } catch (err: any) {
      setError(
        err instanceof SyntaxError
          ? "The layout JSON is invalid. Please check its format."
          : err.message
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteTemplate(template: ReportTemplate) {
    if (!window.confirm(`Delete template "${template.name}"?`)) return;

    try {
      await apiRequest(`/api/report-templates/${template.id}`, {
        method: "DELETE",
      });

      await loadData();
      notify("Template deleted.");
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function duplicateTemplate(template: ReportTemplate) {
    try {
      await apiRequest(
        `/api/report-templates/${template.id}/duplicate`,
        { method: "POST" }
      );

      await loadData();
      notify("Template duplicated.");
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function setDefault(template: ReportTemplate) {
    try {
      await apiRequest(
        `/api/report-templates/${template.id}/default`,
        { method: "POST" }
      );

      await loadData();
      notify("Default template updated.");
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function showVersions(template: ReportTemplate) {
    try {
      const data = await apiRequest(
        `/api/report-templates/${template.id}/versions`
      );

      const versions = data.history || [];

      const summary = versions.length
        ? versions
            .map((item: any) =>
              `Version ${item.version} - ${item.saved_at}`
            )
            .join("\n")
        : "No previous versions available.";

      window.alert(
        `Current version: ${data.current_version}\n\nPrevious versions:\n${summary}`
      );
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function restoreVersion(template: ReportTemplate) {
    try {
      const data = await apiRequest(
        `/api/report-templates/${template.id}/versions`
      );

      const history = data.history || [];

      if (!history.length) {
        window.alert("No previous versions available.");
        return;
      }

      const version = window.prompt(
        "Enter the version number to restore:\n" +
          history.map((item: any) => `Version ${item.version}`).join("\n")
      );

      if (!version) return;

      await apiRequest(
        `/api/report-templates/${template.id}/restore`,
        {
          method: "POST",
          body: JSON.stringify({ version: Number(version) }),
        }
      );

      await loadData();
      notify("Template version restored.");
    } catch (err: any) {
      setError(err.message);
    }
  }

  const filteredTemplates = templates.filter((template) => {
    const matchesType = template.test_type === selectedType;
    const matchesSearch =
      template.name.toLowerCase().includes(search.toLowerCase()) ||
      (template.description || "")
        .toLowerCase()
        .includes(search.toLowerCase());

    return matchesType && matchesSearch;
  });

  const currentLayout = layouts.find(
    (layout) => layout.test_type === selectedType
  );

  return (
    <div style={{ padding: "25px", maxWidth: 1500, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 15,
          flexWrap: "wrap",
          marginBottom: 25,
        }}
      >
        <div>
          <p className="eyebrow">QUALITY CONTROL / DOCUMENTS</p>
          <h1 style={{ margin: "5px 0", fontSize: 28 }}>
            Reports Management
          </h1>
          <p style={{ color: "#718096", margin: 0 }}>
            Manage report templates, layouts and report designs.
          </p>
        </div>

        <button
          style={buttonStyle}
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {message && (
        <div
          style={{
            padding: 12,
            marginBottom: 15,
            background: "#e8f7ed",
            color: "#176b36",
            borderRadius: 7,
          }}
        >
          {message}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: 12,
            marginBottom: 15,
            background: "#fff0f0",
            color: "#b42318",
            borderRadius: 7,
            whiteSpace: "pre-line",
          }}
        >
          {error}
          <button
            onClick={() => setError("")}
            style={{ ...buttonStyle, float: "right", padding: 4 }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 15,
          marginBottom: 25,
        }}
      >
        <div className="summary-card">
          <span className="summary-label">Report Categories</span>
          <strong>{types.length}</strong>
          <small>Available report types</small>
        </div>

        <div className="summary-card">
          <span className="summary-label">Templates</span>
          <strong>{templates.length}</strong>
          <small>Saved report templates</small>
        </div>

        <div className="summary-card">
          <span className="summary-label">Layouts</span>
          <strong>{layouts.length}</strong>
          <small>Saved report layouts</small>
        </div>
      </div>

      <section
        style={{
          background: "#fff",
          border: "1px solid #e1e6ed",
          borderRadius: 10,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 15,
            flexWrap: "wrap",
            alignItems: "end",
          }}
        >
          <label style={{ flex: "1 1 250px", maxWidth: 450 }}>
            <span style={{ display: "block", marginBottom: 7, fontWeight: 600 }}>
              Report category
            </span>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={inputStyle}
            >
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setActiveTab("templates")}
              style={{
                ...buttonStyle,
                background:
                  activeTab === "templates" ? "#17365d" : "#fff",
                color: activeTab === "templates" ? "#fff" : "#333",
              }}
            >
              <FileText size={16} />
              Templates
            </button>

            <button
              onClick={() => setActiveTab("layouts")}
              style={{
                ...buttonStyle,
                background:
                  activeTab === "layouts" ? "#17365d" : "#fff",
                color: activeTab === "layouts" ? "#fff" : "#333",
              }}
            >
              <Layout size={16} />
              Layouts
            </button>
          </div>
        </div>
      </section>

      {activeTab === "templates" && (
        <section
          style={{
            background: "#fff",
            border: "1px solid #e1e6ed",
            borderRadius: 10,
            padding: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 15,
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>Report Templates</h2>
              <p style={{ color: "#718096", marginBottom: 0 }}>
                Templates for {selectedType}
              </p>
            </div>

            <button
              onClick={openNewTemplate}
              style={{
                ...buttonStyle,
                background: "#17365d",
                color: "#fff",
              }}
            >
              <Plus size={16} />
              New Template
            </button>
          </div>

          <div style={{ position: "relative", marginBottom: 18 }}>
            <Search
              size={17}
              style={{
                position: "absolute",
                left: 12,
                top: 12,
                color: "#718096",
              }}
            />
            <input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 38 }}
            />
          </div>

          {loading ? (
            <p>Loading templates...</p>
          ) : filteredTemplates.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "45px 15px",
                color: "#718096",
              }}
            >
              <FileText size={35} style={{ marginBottom: 10 }} />
              <h3 style={{ color: "#344054" }}>No templates found</h3>
              <p>Create your first template for {selectedType}.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f6f8fb", textAlign: "left" }}>
                    {["Template Name", "Description", "Version", "Default", "Actions"].map(
                      (heading) => (
                        <th
                          key={heading}
                          style={{
                            padding: 13,
                            borderBottom: "1px solid #e1e6ed",
                            fontSize: 13,
                          }}
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {filteredTemplates.map((template) => (
                    <tr key={template.id}>
                      <td style={{ padding: 13, borderBottom: "1px solid #eee" }}>
                        <strong>{template.name}</strong>
                      </td>

                      <td style={{ padding: 13, borderBottom: "1px solid #eee" }}>
                        {template.description || "—"}
                      </td>

                      <td style={{ padding: 13, borderBottom: "1px solid #eee" }}>
                        v{template.version}
                      </td>

                      <td style={{ padding: 13, borderBottom: "1px solid #eee" }}>
                        {template.is_default ? (
                          <span style={{ color: "#16803c", fontWeight: 600 }}>
                            <Star size={14} fill="currentColor" /> Default
                          </span>
                        ) : (
                          <button
                            title="Set as default"
                            style={buttonStyle}
                            onClick={() => setDefault(template)}
                          >
                            <Star size={15} />
                          </button>
                        )}
                      </td>

                      <td style={{ padding: 13, borderBottom: "1px solid #eee" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            title="Edit template"
                            style={buttonStyle}
                            onClick={() => openEditTemplate(template)}
                          >
                            <Edit size={15} />
                          </button>

                          <button
                            title="Duplicate template"
                            style={buttonStyle}
                            onClick={() => duplicateTemplate(template)}
                          >
                            <Copy size={15} />
                          </button>

                          <button
                            title="Version history"
                            style={buttonStyle}
                            onClick={() => showVersions(template)}
                          >
                            <History size={15} />
                          </button>

                          <button
                            title="Restore version"
                            style={buttonStyle}
                            onClick={() => restoreVersion(template)}
                          >
                            <RefreshCw size={15} />
                          </button>

                          <button
                            title="Delete template"
                            style={{ ...buttonStyle, color: "#b42318" }}
                            onClick={() => deleteTemplate(template)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === "layouts" && (
        <section
          style={{
            background: "#fff",
            border: "1px solid #e1e6ed",
            borderRadius: 10,
            padding: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 15,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>Report Layout</h2>
              <p style={{ color: "#718096" }}>
                Configure the page layout for {selectedType}.
              </p>
            </div>

            <button
              style={{
                ...buttonStyle,
                background: "#17365d",
                color: "#fff",
              }}
              onClick={() =>
                currentLayout
                  ? openEditLayout(currentLayout)
                  : openNewLayout()
              }
            >
              <Edit size={16} />
              {currentLayout ? "Edit Layout" : "Create Layout"}
            </button>
          </div>

          {currentLayout ? (
            <div style={{ padding: 18, background: "#f6f8fb", borderRadius: 8 }}>
              <h3>{currentLayout.name}</h3>
              <p>Category: {currentLayout.test_type}</p>
              <p>Layout configuration is saved in the database.</p>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 40, color: "#718096" }}>
              <Layout size={35} />
              <h3>No layout configured</h3>
              <p>Create a layout for this report category.</p>
            </div>
          )}
        </section>
      )}

      {modal !== "closed" && (
        <div
          onClick={() => !saving && setModal("closed")}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,.55)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
            overflowY: "auto",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              width: "100%",
              maxWidth: 750,
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: 12,
              padding: 25,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h2 style={{ margin: 0 }}>
                {modal === "template"
                  ? editingTemplate
                    ? "Edit Report Template"
                    : "Create Report Template"
                  : editingLayout
                    ? "Edit Report Layout"
                    : "Create Report Layout"}
              </h2>

              <button
                style={buttonStyle}
                onClick={() => setModal("closed")}
                disabled={saving}
              >
                <X size={18} />
              </button>
            </div>

            {modal === "template" ? (
              <form onSubmit={saveTemplate}>
                <label style={{ display: "block", marginBottom: 15 }}>
                  <span>Template Name *</span>
                  <input
                    required
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    style={{ ...inputStyle, marginTop: 6 }}
                  />
                </label>

                <label style={{ display: "block", marginBottom: 15 }}>
                  <span>Description</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    style={{ ...inputStyle, marginTop: 6 }}
                  />
                </label>

                <label style={{ display: "block", marginBottom: 15 }}>
                  <span>Design Configuration (JSON) *</span>
                  <textarea
                    required
                    value={designText}
                    onChange={(e) => setDesignText(e.target.value)}
                    rows={13}
                    spellCheck={false}
                    style={{
                      ...inputStyle,
                      marginTop: 6,
                      fontFamily: "monospace",
                      fontSize: 13,
                    }}
                  />
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    marginBottom: 20,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                  />
                  Set as default template for {selectedType}
                </label>

                {error && (
                  <p style={{ color: "#b42318", whiteSpace: "pre-line" }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    ...buttonStyle,
                    background: "#17365d",
                    color: "#fff",
                  }}
                >
                  {saving ? "Saving..." : "Save Template"}
                </button>
              </form>
            ) : (
              <form onSubmit={saveLayout}>
                <label style={{ display: "block", marginBottom: 15 }}>
                  <span>Layout Name *</span>
                  <input
                    required
                    value={layoutName}
                    onChange={(e) => setLayoutName(e.target.value)}
                    style={{ ...inputStyle, marginTop: 6 }}
                  />
                </label>

                <label style={{ display: "block", marginBottom: 15 }}>
                  <span>Layout Configuration (JSON) *</span>
                  <textarea
                    required
                    value={layoutText}
                    onChange={(e) => setLayoutText(e.target.value)}
                    rows={15}
                    spellCheck={false}
                    style={{
                      ...inputStyle,
                      marginTop: 6,
                      fontFamily: "monospace",
                      fontSize: 13,
                    }}
                  />
                </label>

                {error && (
                  <p style={{ color: "#b42318" }}>{error}</p>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    ...buttonStyle,
                    background: "#17365d",
                    color: "#fff",
                  }}
                >
                  {saving ? "Saving..." : "Save Layout"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
