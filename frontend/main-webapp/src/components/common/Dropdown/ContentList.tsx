interface ContentListProps {
  data?: string[] | null; 
  emptyLabel: string;
}

export function ContentList({ data, emptyLabel }: ContentListProps) {
  if (!data || data.length === 0) {
    return <div className="p-4 text-sm text-neutral-500 italic">{emptyLabel}</div>;
  }

  return (
    <ul className="py-1 max-h-64 overflow-y-auto scrollbar-thin"> 
      {data.map((item, index) => (
        <li 
          key={index}
          className="px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 cursor-pointer transition-colors border-b border-neutral-50 last:border-none"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}