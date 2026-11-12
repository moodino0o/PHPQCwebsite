import { useEffect, useState } from "react";
import ReportDesigner from "./ReportDesigner";

type Template = {
  id: number;
  name: string;
  test_type: string;
  description?: string;
  design?: {
    page?: {
      size?: string;
      orientation?: string;
      margins?: Record<string, number>;
    };
    elements?: any[];
  };
  version?: number;
  is_default?: boolean;
};

export default function ReportDesignerPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadTemplates() {
    try {
      setLoading(true);

      const response = await fetch("/api/report-templates");
      if (!response.ok) throw new Error("Could not load templates.");

      const data = await response.json();
      setTemplates(Array.isArray(data) ? data : data.templates || []);
    } catch (error) {
      setMessage("Unable to load report templates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTemplates();
  }, []);

  async function saveDesign(design: any) {
    if (!selected) return;

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch(
        `/api/report-templates/${selected.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ design }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(
          error?.message || "The design could not be saved."
        );
      }

      const updated = await response.json();

      setSelected({
        ...selected,
        ...updated,
        design,
      });

      setTemplates((previous) =>
        previous.map((template) =>
          template.id === selected.id
            ? { ...template, ...updated, design }
            : template
        )
      );

      setMessage("Design saved successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save design."
      );
    } finally {
      setSaving(false);
    }
  }

  if (selected) {
    return (
      <>
        {saving && (
          <div
            style={{
              position: "fixed",
              top: 70,
              right: 20,
              zIndex: 3000,
              background: "#17365d",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: 7,
            }}
          >
            Saving...
          </div>
        )}

        {message && (
          <div
            style={{
              position: "fixed",
              bottom: 20,
              right: 20,
              zIndex: 3000,
              background: "#fff",
              border: "1px solid #d8dee8",
              padding: "12px 18px",
              borderRadius: 7,
            }}
          >
            {message}
          </div>
        )}

        <ReportDesigner
          initialDesign={selected.design}
          templateName={selected.name}
          onSave={saveDesign}
          onClose={() => {
            setSelected(null);
            setMessage("");
            loadTemplates();
          }}
        />
      </>
    );
  }

  return (
    <div style={{ padding: 28, color: "#243247" }}>
      <div style={{ marginBottom: 25 }}>
        <h1 style={{ fontSize: 25, fontWeight: 700 }}>
          Visual Report Designer
        </h1>
        <p style={{ color: "#718096", marginTop: 7 }}>
          Select a report template to open and edit its design.
        </p>
      </div>

      {message && (
        <p style={{ color: "#b42318" }}>{message}</p>
      )}

      {loading ? (
        <p>Loading templates...</p>
      ) : templates.length === 0 ? (
        <div
          style={{
            background: "#fff",
            padding: 25,
            border: "1px solid #e2e8f0",
            borderRadius: 10,
          }}
        >
          <strong>No report templates found.</strong>
          <p style={{ color: "#718096" }}>
            Create a report template in Reports Management first.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: 16,
          }}
        >
          {templates.map((template) => (
            <div
              key={template.id}
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: 20,
              }}
            >
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>
                {template.name}
              </h3>

              <p style={{ color: "#718096", fontSize: 13, marginTop: 7 }}>
                {template.test_type}
              </p>

              <p style={{ color: "#718096", fontSize: 12, marginTop: 5 }}>
                Version: {template.version || 1}
              </p>

              <button
                onClick={() => setSelected(template)}
                style={{
                  marginTop: 18,
                  width: "100%",
                  padding: "10px 14px",
                  background: "#17365d",
                  color: "#fff",
                  border: 0,
                  borderRadius: 7,
                  cursor: "pointer",
                }}
              >
                Open Designer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

