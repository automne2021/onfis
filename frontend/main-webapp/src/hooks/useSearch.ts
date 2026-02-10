import { useState, useEffect } from "react";
import { fetchResultsFromDB } from "../services/searchService";
import type { SearchResult } from "../components/common/SearchBar";

export function useSearch<T extends SearchResult>(term: string, scope: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!term) return;
    
    const handler = setTimeout(async () => {
      setLoading(true);
      const results = await fetchResultsFromDB(term, scope); // Gọi hàm từ tầng service
      setData(results as unknown as T[]);
      setLoading(false);
    }, 300);

    return () => clearTimeout(handler);
  }, [term, scope]);

  return { data, loading };
}