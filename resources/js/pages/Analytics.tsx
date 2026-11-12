import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import QCCharts from "./QCCharts";

type QCRecord = Record<string, unknown>;

function extractRows(value: unknown): QCRecord[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is QCRecord =>
        typeof item === "object" && item !== null
    );
  }

  if (typeof value === "object" && value !== null) {
    const object = value as Record<string, unknown>;

    for (const key of ["data", "records", "items"]) {
      if (object[key] !== undefined) {
        return extractRows(object[key]);
      }
    }
  }

  return [];
}

function getText(record: QCRecord, fields: string[], fallback = ""): string {
  for (const field of fields) {
    const value = record[field];

    if (
      (typeof value === "string" || typeof value === "number") &&
      String(value).trim()
    ) {
      return String(value);
    }
  }

  return fallback;
}

function getStatus(record: QCRecord): string {
  const status = getText(record, [
    "status",
    "result",
    "test_result",
    "test_status",
    "outcome",
  ]).toLowerCase();

  if (status.includes("fail") || status.includes("reject")) return "Failed";
  if (status.includes("pass") || status.includes("approved")) return "Passed";
  if (status.includes("pending") || status.includes("progress")) return "Pending";

  return "Other";
}

function getDate(record: QCRecord): number {
  const value = getText(record, [
    "sample_date",
    "test_date",
    "record_date",
    "date",
    "created_at",
  ]);

  if (!value) return 0;

  const date = new Date(value).getTime();
  return Number.isNaN(date) ? 0 : date;
}

function formatDate(record: QCRecord): string {
  const timestamp = getDate(record);

  if (!timestamp) return "Date unavailable";

  return new Date(timestamp).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Analytics() {
  const [records, setRecords] = useState<QCRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecords = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/qc-records");

      if (!response.ok) {
        throw new Error("Unable to load QC records.");
      }

      setRecords(extractRows(await response.json()));
    } catch {
      setError("QC records could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRecords();
  }, []);

  const passed = records.filter((record) => getStatus(record) === "Passed").length;
  const failed = records.filter((record) => getStatus(record) === "Failed").length;
  const pending = records.filter((record) => getStatus(record) === "Pending").length;

  const passRate = records.length
    ? Math.round((passed / records.length) * 100)
    : 0;

  const categoryData = useMemo(() => {
    const groups: Record<string, { total: number; failed: number }> = {};

    records.forEach((record) => {
      const category = getText(record, [
        "category",
        "test_type",
        "record_type",
        "module",
        "type",
      ], "Other");

      if (!groups[category]) {
        groups[category] = { total: 0, failed: 0 };
      }

      groups[category].total += 1;

      if (getStatus(record) === "Failed") {
        groups[category].failed += 1;
      }
    });

    return Object.entries(groups)
      .map(([name, values]) => ({ name, ...values }))
      .sort((a, b) => b.failed - a.failed || b.total - a.total)
      .slice(0, 8);
  }, [records]);

  const failedRecords = useMemo(() => {
    return records
      .filter((record) => getStatus(record) === "Failed")
      .sort((a, b) => getDate(b) - getDate(a))
      .slice(0, 10);
  }, [records]);

  const maxFailures = Math.max(
    1,
    ...categoryData.map((category) => category.failed)
  );

  return (
    <div className="dashboard-page">
      <header className="dashboard-welcome">
        <div>
          <p className="eyebrow">QUALITY CONTROL / PERFORMANCE</p>
          <h1>QC Analytics</h1>
          <p className="welcome-description">
            Monitor testing performance, identify recurring failures and review quality trends.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => void loadRecords()}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh Data
        </button>
      </header>

      {error && (
        <div
          style={{
            padding: 16,
            border: "1px solid #fecaca",
            borderRadius: 10,
            color: "#b91c1c",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <section className="summary-grid">
        <div className="summary-card">
          <span className="summary-label">Total QC Records</span>
          <strong>{loading ? "—" : records.length}</strong>
          <small>All registered records</small>
        </div>

        <div className="summary-card">
          <span className="summary-label">Passed Tests</span>
          <strong>{loading ? "—" : passed}</strong>
          <small>Successfully passed</small>
        </div>

        <div className="summary-card">
          <span className="summary-label">Failed Tests</span>
          <strong>{loading ? "—" : failed}</strong>
          <small>Require quality review</small>
        </div>

        <div className="summary-card">
          <span className="summary-label">Overall Pass Rate</span>
          <strong>{loading ? "—" : `${passRate}%`}</strong>
          <small>Passed / total QC records</small>
        </div>
      </section>

      {!loading && !error && (
        <QCCharts records={records} />
      )}

      <section style={{ marginTop: 30 }}>
        <div style={{ marginBottom: 18 }}>
          <p className="eyebrow">FAILURE MONITORING</p>
          <h2 style={{ fontSize: 19, margin: 0 }}>Failure by Category</h2>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 5 }}>
            Categories ranked by number of failed test records.
          </p>
        </div>

        <div className="summary-card" style={{ padding: 22 }}>
          {loading ? (
            <p>Loading categories...</p>
          ) : categoryData.length === 0 ? (
            <p style={{ color: "#64748b" }}>No category data available.</p>
          ) : (
            <div style={{ display: "grid", gap: 20 }}>
              {categoryData.map((category) => (
                <div key={category.name}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      fontSize: 13,
                      marginBottom: 8,
                    }}
                  >
                    <strong>{category.name}</strong>
                    <span>
                      {category.failed} failed / {category.total} records
                    </span>
                  </div>

                  <div
                    style={{
                      height: 10,
                      borderRadius: 20,
                      background: "#e9edf3",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${(category.failed / maxFailures) * 100}%`,
                        height: "100%",
                        background: "#dc2626",
                        borderRadius: 20,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ marginTop: 30 }}>
        <div style={{ marginBottom: 18 }}>
          <p className="eyebrow">QUALITY FOLLOW-UP</p>
          <h2 style={{ fontSize: 19, margin: 0 }}>Failed Test Records</h2>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 5 }}>
            Latest failed records identified from the QC register.
          </p>
        </div>

        <div className="summary-card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <p style={{ padding: 22 }}>Loading failed records...</p>
          ) : failedRecords.length === 0 ? (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                color: "#64748b",
              }}
            >
              <XCircle size={25} style={{ marginBottom: 8 }} />
              <p>No failed test records were found.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 570 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                    <th style={{ padding: 14 }}>Record Number</th>
                    <th style={{ padding: 14 }}>Category</th>
                    <th style={{ padding: 14 }}>Date</th>
                    <th style={{ padding: 14 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {failedRecords.map((record, index) => (
                    <tr
                      key={String(record.id ?? index)}
                      style={{ borderTop: "1px solid #edf0f4" }}
                    >
                      <td style={{ padding: 14, fontWeight: 600 }}>
                        {getText(record, [
                          "record_no",
                          "record_number",
                          "reference_number",
                          "report_number",
                          "sample_number",
                        ], `QC Record ${record.id ?? index + 1}`)}
                      </td>
                      <td style={{ padding: 14 }}>
                        {getText(record, [
                          "category",
                          "test_type",
                          "record_type",
                          "module",
                          "type",
                        ], "General")}
                      </td>
                      <td style={{ padding: 14, whiteSpace: "nowrap" }}>
                        {formatDate(record)}
                      </td>
                      <td style={{ padding: 14 }}>
                        <span
                          style={{
                            color: "#b91c1c",
                            background: "#fef2f2",
                            padding: "5px 10px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          Failed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
