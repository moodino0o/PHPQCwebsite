import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ClipboardList,
  MessageSquareWarning,
  FileText,
  Archive,
  FileCheck,
  Settings,
  ArrowUpRight,
  Plus,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import QCCharts from "./QCCharts";

type QCRecord = Record<string, unknown>;

const modules = [
  {
    title: "Readymix",
    description: "Concrete testing and inspection records",
    href: "/records/readymix",
    icon: ClipboardList,
  },
  {
    title: "Masonry",
    description: "Blocks, paving and masonry testing",
    href: "/records/masonry",
    icon: ClipboardList,
  },
  {
    title: "Aggregate",
    description: "Sieve analysis and material testing",
    href: "/records/aggregate",
    icon: ClipboardList,
  },
  {
    title: "Precast",
    description: "Precast product quality records",
    href: "/records/precast",
    icon: ClipboardList,
  },
  {
    title: "Kerb Stone",
    description: "Kerbstone testing and inspection",
    href: "/records/kerb-stone",
    icon: ClipboardList,
  },
  {
    title: "Water",
    description: "Water testing and analysis",
    href: "/records/water",
    icon: ClipboardList,
  },
  {
    title: "Complaints",
    description: "Customer complaints and follow-up",
    href: "/complaints",
    icon: MessageSquareWarning,
  },
  {
    title: "Reports",
    description: "Quality control reports",
    href: "/reports",
    icon: FileText,
  },
  {
    title: "Archive",
    description: "Archived QC documents",
    href: "/archive",
    icon: Archive,
  },
  {
    title: "Standards",
    description: "Testing standards and references",
    href: "/standards",
    icon: FileCheck,
  },
  {
    title: "QC Analytics",
    description: "Quality trends, failure analysis and performance",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    description: "Application configuration",
    href: "/settings",
    icon: Settings,
  },
];

function extractRows(value: unknown): QCRecord[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is QCRecord =>
        typeof item === "object" && item !== null
    );
  }

  if (typeof value === "object" && value !== null) {
    const object = value as Record<string, unknown>;

    for (const key of ["data", "records", "complaints", "items"]) {
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

function getDate(record: QCRecord): string {
  const value = getText(record, [
    "sample_date",
    "test_date",
    "record_date",
    "date",
    "created_at",
  ]);

  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Dashboard() {
  const [records, setRecords] = useState<QCRecord[]>([]);
  const [complaints, setComplaints] = useState<QCRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordsError, setRecordsError] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    setRecordsError(false);

    const [recordsResult, complaintsResult] = await Promise.all([
      fetch("/qc-records")
        .then(async (response) => {
          if (!response.ok) throw new Error("Records unavailable");
          return extractRows(await response.json());
        })
        .then((rows) => ({ rows, error: false }))
        .catch(() => ({ rows: [], error: true })),

      fetch("/api/complaints")
        .then(async (response) => {
          if (!response.ok) throw new Error("Complaints unavailable");
          return extractRows(await response.json());
        })
        .then((rows) => ({ rows, error: false }))
        .catch(() => ({ rows: [], error: true })),
    ]);

    setRecords(recordsResult.rows);
    setComplaints(complaintsResult.rows);
    setRecordsError(recordsResult.error);
    setLoading(false);
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const passed = records.filter((record) => getStatus(record) === "Passed").length;
  const failed = records.filter((record) => getStatus(record) === "Failed").length;

  const openComplaints = complaints.filter((record) => {
    const status = getText(record, [
      "status",
      "complaint_status",
      "resolution_status",
    ]).toLowerCase();

    return !(
      status.includes("closed") ||
      status.includes("resolved") ||
      status.includes("completed")
    );
  }).length;

  const recentRecords = useMemo(() => {
    return [...records]
      .sort((a, b) => {
        const dateA = new Date(
          getText(a, ["sample_date", "test_date", "record_date", "date", "created_at"])
        ).getTime() || 0;

        const dateB = new Date(
          getText(b, ["sample_date", "test_date", "record_date", "date", "created_at"])
        ).getTime() || 0;

        return dateB - dateA;
      })
      .slice(0, 6);
  }, [records]);

  return (
    <div className="dashboard-page">
      <header className="dashboard-welcome">
        <div>
          <p className="eyebrow">QUALITY CONTROL / DAILY OVERVIEW</p>
          <h1>Quality Control Dashboard</h1>
          <p className="welcome-description">
            Monitor quality activities, testing records and customer concerns.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadDashboard()}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <Link href="/records" className="primary-button">
            <Plus size={17} />
            QC Register
          </Link>
        </div>
      </header>

      <section className="summary-grid">
        <div className="summary-card">
          <span className="summary-label">QC Records</span>
          <strong>{loading ? "—" : records.length}</strong>
          <small>{recordsError ? "Unable to load records" : "Total registered records"}</small>
        </div>

        <div className="summary-card">
          <span className="summary-label">Passed Tests</span>
          <strong>{loading ? "—" : passed}</strong>
          <small>Records marked as passed</small>
        </div>

        <div className="summary-card">
          <span className="summary-label">Failed Tests</span>
          <strong>{loading ? "—" : failed}</strong>
          <small>Records marked as failed</small>
        </div>

        <div className="summary-card">
          <span className="summary-label">Open Complaints</span>
          <strong>{loading ? "—" : openComplaints}</strong>
          <small>Complaints requiring follow-up</small>
        </div>
      </section>

      {!loading && !recordsError && (
        <QCCharts records={records} />
      )}

      {recordsError && (
        <p style={{ color: "#b45309", marginTop: 20, fontSize: 13 }}>
          QC records could not be loaded. Please use Refresh to try again.
        </p>
      )}

      <section style={{ marginTop: 30 }}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">LATEST ENTRIES</p>
            <h2>Recent QC Activity</h2>
          </div>
          <Link href="/records" className="text-link">
            View register <ArrowUpRight size={16} />
          </Link>
        </div>

        <div
          className="summary-card"
          style={{ padding: 0, marginTop: 16, overflow: "hidden" }}
        >
          {loading ? (
            <p style={{ padding: 22 }}>Loading recent activity...</p>
          ) : recentRecords.length === 0 ? (
            <p style={{ padding: 22, color: "#64748b" }}>
              No QC records have been registered yet.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                    <th style={{ padding: 14 }}>Record Number</th>
                    <th style={{ padding: 14 }}>Category</th>
                    <th style={{ padding: 14 }}>Date</th>
                    <th style={{ padding: 14 }}>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRecords.map((record, index) => {
                    const status = getStatus(record);
                    const color =
                      status === "Passed" ? "#15803d" :
                      status === "Failed" ? "#b91c1c" :
                      status === "Pending" ? "#b45309" : "#64748b";

                    return (
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
                          {getDate(record)}
                        </td>
                        <td style={{ padding: 14 }}>
                          <span
                            style={{
                              color,
                              background: `${color}12`,
                              borderRadius: 20,
                              padding: "5px 10px",
                              fontSize: 12,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {status === "Other" ? "Not classified" : status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="modules-section" style={{ marginTop: 34 }}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">APPLICATION MODULES</p>
            <h2>Quality Control Registers</h2>
          </div>

          <Link href="/records" className="text-link">
            View all registers <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="module-grid">
          {modules.map((module) => {
            const Icon = module.icon;

            return (
              <Link
                href={module.href}
                key={module.href}
                className="dashboard-module-card"
              >
                <div className="module-card-icon">
                  <Icon size={21} />
                </div>

                <div className="module-card-content">
                  <h3>{module.title}</h3>
                  <p>{module.description}</p>
                </div>

                <ArrowUpRight className="module-arrow" size={18} />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
