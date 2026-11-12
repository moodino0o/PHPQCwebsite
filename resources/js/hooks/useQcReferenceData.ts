
import { useCallback, useEffect, useState } from "react";

export type QcReferenceItem = {
  id: number;
  value: string;
};

export type QcReferenceCategory = {
  id: number;
  key: string;
  label: string;
  items: QcReferenceItem[];
};

export function useQcReferenceData() {
  const [categories, setCategories] = useState<QcReferenceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reference-data", {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error("Reference database connection failed.");
      }

      const result: QcReferenceCategory[] = await response.json();

      if (!Array.isArray(result)) {
        throw new Error("Invalid reference-data response.");
      }

      setCategories(result);
    } catch (err) {
      setCategories([]);
      setError(
        err instanceof Error ? err.message : "Unable to load reference data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getCategory = useCallback(
    (key: string) =>
      categories.find(
        (item) =>
          item.key.toLowerCase() === key.toLowerCase() ||
          item.label.toLowerCase() === key.toLowerCase()
      ),
    [categories]
  );

  const getItems = useCallback(
    (key: string) => getCategory(key)?.items ?? [],
    [getCategory]
  );

  return { categories, loading, error, refresh, getCategory, getItems };
}
