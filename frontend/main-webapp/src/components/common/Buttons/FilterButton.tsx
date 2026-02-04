import { FilterList } from '@mui/icons-material';

interface FilterButtonProps {
  onClick: () => void;
}

export function FilterButton({ onClick } : FilterButtonProps) {
  return(
    <button 
      onClick={onClick}
      className="bg-neutral-50 border border-neutral-200 text-body-1-medium text-neutral-500 flex items-center gap-3 p-[8px] rounded-[10px] hover:bg-neutral-200 transition cursor-pointer"
    >
      <FilterList />
      Filter
    </button>
  )
}