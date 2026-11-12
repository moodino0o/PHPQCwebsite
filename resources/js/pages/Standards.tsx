
import { useEffect, useMemo, useState } from "react";

type Standard = {
  id: number;
  standard_code: string;
  title: string;
  category: string;
  issuing_body: string | null;
  edition: string | null;
  revision: string | null;
  publication_year: number | null;
  status: string;
  description: string | null;
  technical_notes: string | null;
  reference_url: string | null;
  source_type: string;
};

const categories = [
  "All Categories",
  "Concrete",
  "Blocks",
  "Paving Blocks",
  "Kerb Stones",
  "Aggregates",
  "Sand",
  "Water",
  "Cement",
  "Ready Mix",
  "Precast",
  "Road Works",
  "General",
];

const sourceTypes = [
  "All Sources",
  "Strength Standard",
  "Sieve Standard",
  "Shape Factor",
  "Water Standard",
];

const panelStyle = {
  background: "var(--panel, #ffffff)",
  border: "1px solid var(--border, #e5e7eb)",
  borderRadius: "12px",
  padding: "20px",
};

const inputStyle = {
  width: "100%",
  padding: "11px 13px",
  border: "1px solid var(--border, #d1d5db)",
  borderRadius: "8px",
  background: "var(--background, #ffffff)",
  color: "var(--foreground, #111827)",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box" as const,
};

const mutedText = {
  color: "var(--muted-foreground, #6b7280)",
  fontSize: "13px",
};

export default function Standards() {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [sourceType, setSourceType] = useState("All Sources");
  const [selected, setSelected] = useState<Standard | null>(null);

  useEffect(() => {
    let active = true;

    async function loadStandards() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (search.trim()) {
          params.set("q", search.trim());
        }

        if (category !== "All Categories") {
          params.set("category", category);
        }

        const response = await fetch(`/api/standards?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Unable to load standards from the database.");
        }

        const data = await response.json();

        if (active) {
          setStandards(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "An unexpected error occurred."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadStandards();

    return () => {
      active = false;
    };
  }, [search, category]);

  const filteredStandards = useMemo(() => {
    if (sourceType === "All Sources") {
      return standards;
    }

    return standards.filter(
      (standard) => standard.source_type === sourceType
    );
  }, [standards, sourceType]);

  const sourceLabel = (source: string) => {
    switch (source) {
      case "Strength Standard":
        return "Strength";
      case "Sieve Standard":
        return "Sieve";
      case "Shape Factor":
        return "Shape Factor";
      case "Water Standard":
        return "Water";
      default:
        return source || "Other";
    }
  };

  const closeDetails = () => setSelected(null);

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <div>
        <h1
          style={{
            fontSize: "25px",
            fontWeight: 700,
            margin: "0 0 6px",
            color: "var(--foreground, #111827)",
          }}
        >
          Standards & Specifications
        </h1>

        <p style={{ ...mutedText, margin: 0 }}>
          View technical requirements and standards stored in the QC database.
        </p>
      </div>

      <section style={{ ...panelStyle, display: "grid", gap: "16px" }}>
        <div>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 650,
              margin: "0 0 5px",
              color: "var(--foreground, #111827)",
            }}
          >
            Search Standards
          </h2>
          <p style={{ ...mutedText, margin: 0 }}>
            Search by standard number, material, category or technical
            requirement.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "12px",
          }}
        >
          <input
            style={inputStyle}
            type="search"
            placeholder="Search standards..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            style={inputStyle}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            style={inputStyle}
            value={sourceType}
            onChange={(event) => setSourceType(event.target.value)}
          >
            {sourceTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <span style={mutedText}>
            {filteredStandards.length} records displayed
          </span>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCategory("All Categories");
              setSourceType("All Sources");
              setSelected(null);
            }}
            style={{
              border: "1px solid var(--border, #d1d5db)",
              borderRadius: "8px",
              padding: "8px 12px",
              background: "transparent",
              color: "var(--foreground, #111827)",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Clear Filters
          </button>
        </div>
      </section>

      {error && (
        <div
          style={{
            ...panelStyle,
            borderColor: "#dc2626",
            color: "#dc2626",
          }}
        >
          {error}
        </div>
      )}

      <section style={{ ...panelStyle, padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "17px 20px",
            borderBottom: "1px solid var(--border, #e5e7eb)",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 650,
              color: "var(--foreground, #111827)",
            }}
          >
            Standards Register
          </h2>
        </div>

        {loading ? (
          <div style={{ padding: "35px", textAlign: "center", ...mutedText }}>
            Loading standards...
          </div>
        ) : filteredStandards.length === 0 ? (
          <div style={{ padding: "35px", textAlign: "center", ...mutedText }}>
            No matching standards found.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "850px",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "var(--muted, #f9fafb)",
                    textAlign: "left",
                  }}
                >
                  {[
                    "Standard Reference",
                    "Title / Material",
                    "Category",
                    "Source",
                    "Details",
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: "13px 15px",
                        color: "var(--muted-foreground, #6b7280)",
                        fontWeight: 600,
                        borderBottom: "1px solid var(--border, #e5e7eb)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredStandards.map((standard) => (
                  <tr
                    key={`${standard.source_type}-${standard.id}`}
                    style={{
                      borderBottom: "1px solid var(--border, #e5e7eb)",
                    }}
                  >
                    <td style={{ padding: "14px 15px", fontWeight: 600 }}>
                      {standard.standard_code || "—"}
                    </td>

                    <td
                      style={{
                        padding: "14px 15px",
                        color: "var(--foreground, #111827)",
                      }}
                    >
                      <div style={{ fontWeight: 550 }}>
                        {standard.title}
                      </div>
                      {standard.description && (
                        <div style={{ ...mutedText, marginTop: "5px" }}>
                          {standard.description}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "14px 15px" }}>
                      {standard.category}
                    </td>

                    <td style={{ padding: "14px 15px" }}>
                      {sourceLabel(standard.source_type)}
                    </td>

                    <td style={{ padding: "14px 15px" }}>
                      <button
                        type="button"
                        onClick={() => setSelected(standard)}
                        style={{
                          border: "1px solid var(--border, #d1d5db)",
                          borderRadius: "7px",
                          padding: "7px 11px",
                          background: "transparent",
                          color: "var(--foreground, #111827)",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <section style={{ ...panelStyle, display: "grid", gap: "15px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <div>
              <p
                style={{
                  ...mutedText,
                  margin: "0 0 5px",
                }}
              >
                Standard Details
              </p>
              <h2
                style={{
                  fontSize: "18px",
                  margin: 0,
                  fontWeight: 700,
                  color: "var(--foreground, #111827)",
                }}
              >
                {selected.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={closeDetails}
              style={{
                border: "1px solid var(--border, #d1d5db)",
                borderRadius: "8px",
                padding: "8px 12px",
                background: "transparent",
                color: "var(--foreground, #111827)",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "14px",
            }}
          >
            {[
              ["Standard Reference", selected.standard_code],
              ["Category", selected.category],
              ["Source Type", selected.source_type],
              ["Issuing Body", selected.issuing_body],
              ["Edition", selected.edition],
              ["Revision", selected.revision],
              ["Publication Year", selected.publication_year],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  background: "var(--muted, #f9fafb)",
                }}
              >
                <div style={{ ...mutedText, marginBottom: "6px" }}>
                  {label}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--foreground, #111827)",
                  }}
                >
                  {value === null || value === undefined || value === ""
                    ? "Not specified in source database"
                    : String(value)}
                </div>
              </div>
            ))}
          </div>

          {selected.description && (
            <div>
              <h3 style={{ fontSize: "14px", margin: "0 0 7px" }}>
                Description
              </h3>
              <p style={{ ...mutedText, lineHeight: 1.7, margin: 0 }}>
                {selected.description}
              </p>
            </div>
          )}

          <div>
            <h3 style={{ fontSize: "14px", margin: "0 0 8px" }}>
              Technical Requirements
            </h3>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                fontFamily: "inherit",
                fontSize: "13px",
                lineHeight: 1.8,
                padding: "15px",
                borderRadius: "8px",
                background: "var(--muted, #f9fafb)",
                color: "var(--foreground, #111827)",
                margin: 0,
              }}
            >
              {selected.technical_notes || "No technical notes available."}
            </pre>
          </div>

          <p style={{ ...mutedText, margin: 0 }}>
            This is a read-only view of the original QC database. Editing and
            deletion are disabled to protect the source records.
          </p>
        </section>
      )}
    </div>
  );
}
