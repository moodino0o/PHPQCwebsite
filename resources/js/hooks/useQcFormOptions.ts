import { useEffect, useState } from "react";

export type QcFormOptions = {
  record_test_types: string[];
  record_materials: string[];
  record_locations: string[];
  masonry_block_types: string[];
  masonry_block_sizes: string[];
};

const emptyOptions: QcFormOptions = {
  record_test_types: [],
  record_materials: [],
  record_locations: [],
  masonry_block_types: [],
  masonry_block_sizes: [],
};

let cachedOptions: QcFormOptions | null = null;
let pendingRequest: Promise<QcFormOptions> | null = null;

async function fetchOptions(): Promise<QcFormOptions> {
  if (cachedOptions) return cachedOptions;

  if (!pendingRequest) {
    pendingRequest = fetch("/api/qc-form-options", {
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load QC form options from the database.");
        }

        const data = await response.json();

        const result: QcFormOptions = {
          record_test_types: Array.isArray(data.record_test_types)
            ? data.record_test_types
            : [],
          record_materials: Array.isArray(data.record_materials)
            ? data.record_materials
            : [],
          record_locations: Array.isArray(data.record_locations)
            ? data.record_locations
            : [],
          masonry_block_types: Array.isArray(data.masonry_block_types)
            ? data.masonry_block_types
            : [],
          masonry_block_sizes: Array.isArray(data.masonry_block_sizes)
            ? data.masonry_block_sizes
            : [],
        };

        cachedOptions = result;
        return result;
      })
      .finally(() => {
        pendingRequest = null;
      });
  }

  return pendingRequest;
}

export function useQcFormOptions() {
  const [options, setOptions] = useState<QcFormOptions>(
    cachedOptions ?? emptyOptions
  );
  const [loading, setLoading] = useState(!cachedOptions);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetchOptions()
      .then((result) => {
        if (active) {
          setOptions(result);
          setError("");
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load database options."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { ...options, loading, error };
}
