import { useEffect, useState } from "react"
import { Search } from '@mui/icons-material';

import { useDebounce } from "../../hooks/useDebounce";
import { announcementApi } from "../../features/announcements/services/announcementApi";

export interface SearchResult {
  id: string | number
  title: string
  type: 'projects' | 'tasks' | 'announcement' | 'discuss' | 'users' | 'positions' | 'documents'
  url?: string
}

interface SearchBarProps {
  scope: 'projects' | 'tasks' | 'announcement' | 'discuss' | 'users' | 'positions' | 'documents'
  onSearch: (value: SearchResult[]) => void 
  onQueryChange?: (query: string) => void 
  onIsSearchingChange?: (isSearching: boolean) => void;
  width?: string
}

export function SearchBar({ scope, onSearch, onQueryChange, onIsSearchingChange, width = 'w-[220px] md:w-[400px] lg:w-[520px]' }: SearchBarProps) {

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      if (onIsSearchingChange) onIsSearchingChange(true);
    }
  }, [searchTerm, debouncedSearchTerm, onIsSearchingChange]);

  useEffect(() => {
    const handleDynamicSearch = async () => {
      if (!debouncedSearchTerm.trim()) {
        onSearch([]);
        if (onIsSearchingChange) onIsSearchingChange(false); // Dừng loading
        return;
      }

      if (onIsSearchingChange) onIsSearchingChange(true); // Bắt đầu loading khi gọi API

      try {
        let results: SearchResult[] = [];

        switch (scope) {
          case 'announcement': { 
            const response = await announcementApi.searchAnnouncements(debouncedSearchTerm);
            if (response && response.content) {
              results = response.content.map((item: { id: string; title: string }) => ({
                id: item.id,
                title: item.title,
                type: 'announcement',
                url: `/announcements/${item.id}` 
              }));
            }
            break;
          }

          case 'projects':
            // Logic gọi API cho projects sau này
            // results = await projectApi.searchProjects(debouncedSearchTerm);
            break;

          case 'tasks':
            // Logic gọi API cho tasks sau này
            break;

          case 'users':
            // Logic gọi API cho users sau này
            break;

          default:
            // Fallback: Nếu không match case nào ở trên
            // results = await fetchResultsFromDB(debouncedSearchTerm, scope);
            break;
        }

        // 3. Trả kết quả ra ngoài
        onSearch(results);

      } catch (error) {
        console.error("Lỗi khi tìm kiếm:", error);
        onSearch([]); 
      } finally {
        if (onIsSearchingChange) onIsSearchingChange(false); 
      }
    }

    handleDynamicSearch();

  }, [debouncedSearchTerm, scope, onSearch, onIsSearchingChange]);

  return (
    <div className={`flex gap-2 items-center px-4 py-2 border bg-white border-neutral-200 outline-none rounded-full transition-colors duration-200 focus-within:border-primary focus-within:bg-white ${width}`}>
      <Search className="text-neutral-500" sx={{ fontSize: 16 }} />
      <input
        type="text"
        placeholder={`Search ${scope}...`}
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          if (onQueryChange) onQueryChange(e.target.value);
        }}
        className="outline-none w-full body-4-regular bg-transparent"
        maxLength={250}
      />
    </div>
  )
}