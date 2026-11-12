
import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  ClipboardList,
  MessageSquareWarning,
  FileText,
  Archive,
  FileCheck,
  Settings,
  Beaker,
  LogOut,
  UserRound,
  ChartNoAxesCombined,
  FlaskConical,
  FilePenLine,
} from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

interface Employee {
  employee_id: string;
  name: string;
  role: string;
  administrator: boolean;
}


const navigation = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, permission: "dashboard.view" },
  { label: "Analytics", href: "/analytics", icon: ChartNoAxesCombined, permission: "analytics.view" },
  { label: "QC Register", href: "/records", icon: ClipboardList, permission: "qc_records.view" },
  { label: "Masonry Tests", href: "/masonry-tests", icon: FlaskConical, permission: "masonry.view" },
  { label: "Complaints", href: "/complaints", icon: MessageSquareWarning, permission: "complaints.view" },
  { label: "Reports", href: "/reports", icon: FileText, permission: "reports.view" },
  { label: "Report Designer", href: "/report-designer", icon: FilePenLine, permission: "reports.manage" },
  { label: "Archive", href: "/archive", icon: Archive, permission: "archive.view" },
  { label: "Standards", href: "/standards", icon: FileCheck, permission: "standards.view" },
  { label: "Settings", href: "/settings", icon: Settings, permission: "settings.manage" },
];

const frontendPermissions: Record<string, string[]> = {
  administrator: ["*"],

  manager: [
    "dashboard.view", "analytics.view",
    "qc_records.view", "masonry.view",
    "complaints.view", "reports.view", "reports.manage",
    "archive.view", "standards.view", "settings.manage",
  ],

  qc_engineer: [
    "dashboard.view", "analytics.view",
    "qc_records.view", "masonry.view",
    "complaints.view", "reports.view", "reports.manage",
    "archive.view", "standards.view",
  ],

  lab_technician: [
    "dashboard.view", "analytics.view",
    "qc_records.view", "masonry.view",
    "complaints.view", "reports.view",
    "archive.view", "standards.view",
  ],

  viewer: [
    "dashboard.view", "analytics.view",
    "qc_records.view", "masonry.view",
    "complaints.view", "reports.view",
    "archive.view", "standards.view",
  ],
};

function employeeCanAccess(employee: Employee | null, permission: string) {
  if (!employee) return false;

  const role =
    employee.administrator || employee.role === "administrator"
      ? "administrator"
      : employee.role === "technician"
        ? "lab_technician"
        : employee.role === "visitor"
          ? "viewer"
          : employee.role;

  const permissions = frontendPermissions[role] ?? [];

  return permissions.includes("*") || permissions.includes(permission);
}


export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const [employee, setEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    fetch("/api/current-user", {
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          window.location.href = "/login";
          return null;
        }
        return response.json();
      })
      .then((data) => {
        if (data?.employee) {
          setEmployee(data.employee);
        }
      })
      .catch(() => {
        window.location.href = "/login";
      });
  }, []);

  const isActive = (href: string) =>
    href === "/"
      ? location === "/"
      : location === href || location.startsWith(href + "/");

  const logout = async () => {
    const token = document
      .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
      ?.content;

    const response = await fetch("/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "X-CSRF-TOKEN": token ?? "",
      },
    });

    if (response.ok || response.redirected) {
      window.location.href = "/login";
    }
  };

  const displayRole = (role: string) =>
    role
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-mark">AM</span>
          <span className="brand-name">
            AL MANARATAIN
            <small>QUALITY CONTROL</small>
          </span>
        </Link>

        <div className="sidebar-section-title">QUALITY CONTROL</div>

        <nav className="sidebar-navigation">
          {navigation.filter((item) => employeeCanAccess(employee, item.permission)).map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive(item.href) ? "active" : ""}`}
              >
                <Icon size={20} strokeWidth={1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {(employee?.administrator || employee?.role === "administrator") && (
            <Link
              href="/users"
              className={`nav-link ${isActive("/users") ? "active" : ""}`}
            >
              <UserRound size={18} strokeWidth={1.8} />
              <span>User Management</span>
            </Link>
          )}


        </nav>

        <div className="sidebar-footer">
          <div className="user-avatar">
            {employee?.name?.charAt(0).toUpperCase() ?? "U"}
          </div>

          <div className="user-details">
            <strong>{employee?.name ?? "Loading user..."}</strong>
            <small>
              {employee ? displayRole(employee.role) : "Employee"}
            </small>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              color: "inherit",
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="top-header">
          <div className="header-title">
            <Beaker size={19} />
            <span>Al Manaratain Quality Control System</span>
          </div>

          <div className="system-status">
            <span className="status-dot"></span>
            System Operational
          </div>
        </header>

        <nav className="mobile-navigation">
          <div className="mobile-brand">
            <span className="brand-mark">AM</span>
            <strong>AL MANARATAIN QC</strong>
          </div>

          <div className="mobile-nav-links">
            {navigation.filter((item) => employeeCanAccess(employee, item.permission)).map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mobile-nav-link ${isActive(item.href) ? "active" : ""}`}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {(employee?.administrator || employee?.role === "administrator") && (
            <Link
              href="/users"
              className={`mobile-nav-link ${isActive("/users") ? "active" : ""}`}
            >
              <UserRound size={17} />
              <span>User Management</span>
            </Link>
          )}
        </nav>

        <div className="page-content">
          <div className="page-container">{children}</div>
        </div>
      </main>
    </div>
  );
}
