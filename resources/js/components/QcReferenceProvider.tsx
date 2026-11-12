import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type ReferenceItem = {
  id: number;
  value: string;
};

type ReferenceCategory = {
  id: number;
  key: string;
  label: string;
  items: ReferenceItem[];
};

type ReferenceContextType = {
  categories: ReferenceCategory[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getItems: (key: string) => ReferenceItem[];
};

const ReferenceContext = createContext<ReferenceContextType | null>(null);

export function QcReferenceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [categories, setCategories] = useState<ReferenceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reference-data", {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error("Unable to connect to the QC reference database.");
      }

      const result = await response.json();

      if (!Array.isArray(result)) {
        throw new Error("Invalid reference data returned by the server.");
      }

      setCategories(result);
    } catch (err) {
      setCategories([]);
      setError(
        err instanceof Error ? err.message : "Reference data unavailable."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  function getItems(key: string) {
    const category = categories.find(
      (item) =>
        item.key.toLowerCase() === key.toLowerCase() ||
        item.label.toLowerCase() === key.toLowerCase()
    );

    return category?.items ?? [];
  }

  return (
    <ReferenceContext.Provider
      value={{ categories, loading, error, refresh, getItems }}
    >
      {children}
    </ReferenceContext.Provider>
  );
}

export function useQcReferences() {
  const context = useContext(ReferenceContext);

  if (!context) {
    throw new Error(
      "useQcReferences must be used inside QcReferenceProvider."
    );
  }

  return context;
}
