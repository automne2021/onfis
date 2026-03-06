import { useEffect, useState } from "react"

import { Search } from '@mui/icons-material';
import { fetchResultsFromDB } from "../../services/searchService";

export interface SearchResult {
  id: string
  title: string
  type: 'projects' | 'tasks' | 'announcement' | 'discuss' | 'users' | 'positions' | 'documents'
  url?: string
}

interface SearchBarProps {
  scope: 'projects' | 'tasks' | 'announcement' | 'discuss' | 'users' | 'positions' | 'documents' // tùy chỉnh sau (Nhớ chỉnh này nếu chưa thấy hợp lý nhé)
  onSearch: (value: SearchResult[]) => void // Xử lý data khác nhau tùy nơi gọi
  width?: string
}

export function SearchBar({ scope, onSearch, width = 'w-[220px] md:w-[400px] lg:w-[520px]' }: SearchBarProps) {

  // State Managements
  const [searchTerm, setSearchTerm] = useState("")

  // useEffect
  useEffect(() => {
    const handleDynamicSearch = async (term: string, currentScope: string) => {
      // Logic gọi API hoặc lọc dữ liệu local
      console.log(`Searching for "${term}" in ${currentScope}`)

      const results = await fetchResultsFromDB(term, currentScope)
      onSearch(results)
    }

    const delayDebounceFn = setTimeout(() => {
      handleDynamicSearch(searchTerm, scope);
    }, 100)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, scope, onSearch])

  return (
    <div className={`flex gap-2 items-center px-4 py-2 border bg-white border-neutral-200 outline-none rounded-full transition-colors duration-200 focus-within:border-primary focus-within:bg-white ${width}`}>
      <Search className="text-neutral-500" />
      <input
        type="text"
        placeholder={`Search...`}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="outline-none w-full"
        maxLength={250}
      />
    </div>
  )
}