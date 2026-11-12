import { useMemo } from "react";

type QCRecord = Record<string, unknown>;

function getText(record: QCRecord, fields: string[]): string {
  for (const field of fields) {
    const value = record[field];
    if (
      (typeof value === "string" || typeof value === "number") &&
      String(value).trim()
    ) {
      return String(value);
    }
  }
  return "";
}

function getStatus(record: QCRecord): "Passed" | "Failed" | "Pending" | "Other" {
  const status = getText(record, [
    "status",
    "result",
    "test_result",
    "test_status",
    "outcome",
  ]).toLowerCase();

  if (
    status.includes("fail") ||
    status.includes("reject") ||
    status.includes("non-compliant")
  ) return "Failed";

  if (
    status.includes("pass") ||
    status.includes("approved") ||
    status.includes("compliant")
  ) return "Passed";

  if (
    status.includes("pending") ||
    status.includes("progress") ||
    status.includes("awaiting")
  ) return "Pending";

  return "Other";
}

function getDate(record: QCRecord): Date | null {
  const value = getText(record, [
    "sample_date",
    "test_date",
    "record_date",
    "date",
    "created_at",
  ]);

  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const chartColors = {
  Passed: "#16a34a",
  Failed: "#dc2626",
  Pending: "#d97706",
  Other: "#94a3b8",
};

export default function QCCharts({ records }: { records: QCRecord[] }) {
  const statusCounts = useMemo(() => {
    const counts = {
      Passed: 0,
      Failed: 0,
      Pending: 0,
      Other: 0,
    };

    records.forEach((record) => {
      counts[getStatus(record)] += 1;
    });

    return counts;
  }, [records]);

  const monthlyData = useMemo(() => {
    const now = new Date();

    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);

      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleDateString(undefined, { month: "short" }),
        total: 0,
      };
    });

    const monthMap = new Map(months.map((month) => [month.key, month]));

    records.forEach((record) => {
      const date = getDate(record);
      if (!date) return;

      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const month = monthMap.get(key);
      if (month) month.total += 1;
    });

    return months;
  }, [records]);

  const total = records.length;
  const maxMonthly = Math.max(1, ...monthlyData.map((month) => month.total));

  const pieSegments = [
    { label: "Passed", value: statusCounts.Passed, color: chartColors.Passed },
    { label: "Failed", value: statusCounts.Failed, color: chartColors.Failed },
    { label: "Pending", value: statusCounts.Pending, color: chartColors.Pending },
    { label: "Other", value: statusCounts.Other, color: chartColors.Other },
  ];

  let accumulated = 0;
  const pieGradient = pieSegments
    .filter((segment) => segment.value > 0)
    .map((segment) => {
      const start = accumulated;
      accumulated += (segment.value / Math.max(total, 1)) * 100;
      return `${segment.color} ${start}% ${accumulated}%`;
    })
    .join(", ");

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 20,
        marginTop: 24,
      }}
    >
      <div
        className="summary-card"
        style={{ padding: 22, minWidth: 0 }}
      >
        <p className="eyebrow">SIX-MONTH PERFORMANCE</p>
        <h2 style={{ fontSize: 18, margin: "4px 0 0" }}>
          Monthly QC Records
        </h2>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 5 }}>
          Number of records registered each month
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "end",
            gap: 12,
            height: 190,
            marginTop: 24,
            padding: "0 4px 24px",
            borderBottom: "1px solid #e8edf3",
          }}
        >
          {monthlyData.map((month) => (
            <div
              key={month.key}
              style={{
                flex: 1,
                minWidth: 0,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "end",
                alignItems: "center",
                gap: 7,
              }}
            >
              <span style={{ fontSize: 11, color: "#64748b" }}>
                {month.total}
              </span>
              <div
                title={`${month.label}: ${month.total} records`}
                style={{
                  width: "100%",
                  maxWidth: 42,
                  height: `${Math.max(3, (month.total / maxMonthly) * 125)}px`,
                  background: "#315b8a",
                  borderRadius: "5px 5px 0 0",
                }}
              />
              <span style={{ fontSize: 11, color: "#64748b" }}>
                {month.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="summary-card"
        style={{ padding: 22, minWidth: 0 }}
      >
        <p className="eyebrow">TEST RESULT DISTRIBUTION</p>
        <h2 style={{ fontSize: 18, margin: "4px 0 0" }}>
          QC Results Breakdown
        </h2>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 5 }}>
          Passed, failed and pending records
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 26,
            marginTop: 24,
          }}
        >
          <div
            role="img"
            aria-label={`QC result distribution: ${pieSegments.map((segment) => `${segment.label} ${segment.value}`).join(", ")}`}
            style={{
              width: 172,
              height: 172,
              flexShrink: 0,
              borderRadius: "50%",
              background:
                total > 0
                  ? `conic-gradient(${pieGradient})`
                  : "#e9edf3",
              display: "grid",
              placeItems: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                width: 104,
                height: 104,
                borderRadius: "50%",
                background: "white",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <strong style={{ fontSize: 27 }}>{total}</strong>
              <span style={{ fontSize: 11, color: "#64748b" }}>Records</span>
            </div>
          </div>

          <div style={{ display: "grid", gap: 13 }}>
            {pieSegments.map((segment) => (
              <div
                key={segment.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 3,
                    background: segment.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: "#475569" }}>{segment.label}</span>
                <strong style={{ marginLeft: "auto" }}>{segment.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {total === 0 && (
          <p style={{ textAlign: "center", color: "#64748b", fontSize: 12 }}>
            No QC results available yet.
          </p>
        )}
      </div>
    </section>
  );
}
