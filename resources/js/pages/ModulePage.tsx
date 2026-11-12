import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  ClipboardList,
  FileText,
  Settings,
} from "lucide-react";

const modules: Record<string, { title: string; description: string }> = {
  "/records": {
    title: "QC Register",
    description: "Manage quality control records and test results.",
  },
  "/records/readymix": {
    title: "Readymix Records",
    description: "Manage readymix concrete test records.",
  },
  "/records/masonry": {
    title: "Masonry Records",
    description: "Manage concrete block and paving test records.",
  },
  "/records/aggregate": {
    title: "Aggregate Records",
    description: "Manage aggregate testing and sieve analysis.",
  },
  "/records/precast": {
    title: "Precast Records",
    description: "Manage precast product quality records.",
  },
  "/records/kerb-stone": {
    title: "Kerb Stone Records",
    description: "Manage kerbstone inspection and testing.",
  },
  "/records/water": {
    title: "Water Records",
    description: "Manage water quality testing records.",
  },
  "/complaints": {
    title: "Complaints",
    description: "Manage and follow up customer complaints.",
  },
  "/reports": {
    title: "Reports",
    description: "Prepare and manage quality control reports.",
  },
  "/archive": {
    title: "Document Archive",
    description: "Access archived quality control documents.",
  },
  "/standards": {
    title: "Standards",
    description: "Manage testing standards and reference values.",
  },
  "/settings": {
    title: "Settings",
    description: "Configure the quality control system.",
  },
};

export default function ModulePage() {
  const [location] = useLocation();

  const page = modules[location] ?? {
    title: "Page not found",
    description: "The requested page does not exist.",
  };

  return (
    <section className="module-page">
      <div className="breadcrumb">
        <Link href="/">Dashboard</Link>
        <span>/</span>
        <span>{page.title}</span>
      </div>

      <div className="module-heading">
        <div className="module-icon">
          <ClipboardList size={25} />
        </div>

        <div>
          <p className="eyebrow">QUALITY CONTROL SYSTEM</p>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </div>
      </div>

      <div className="module-empty">
        <div className="empty-icon">
          <FileText size={30} />
        </div>

        <h2>{page.title} module</h2>

        <p>
          This page is connected to the main application navigation.
          Its forms, tables, database operations, and functionality
          will be implemented in the next development stages.
        </p>

        <Link href="/" className="back-link">
          <ArrowLeft size={16} />
          Return to dashboard
        </Link>
      </div>
    </section>
  );
}
