export interface ContentItem {
  content: React.ReactNode
  onClick?: () => void
}

interface ContentListProps {
  data?: ContentItem[] | null; 
  emptyLabel: string;
  onItemClick?: () => void;
}

export function ContentList({ data, emptyLabel, onItemClick }: ContentListProps) {
  if (!data || data.length === 0) {
    return <div className="px-4 py-2 body-4-regular text-neutral-500 italic">{emptyLabel}</div>;
  }

  return (
    <ul className="py-1 max-h-48 overflow-y-auto scrollbar-thin"> 
      {data.map((item, index) => (
        <li 
          key={index}
          onClick={() => {
            item.onClick?.()  // Chạy logic riêng của item này
            onItemClick?.()   // Chạy logic chung (Đóng Menu) 
          }}
          className="px-4 py-2 body-4-regular text-neutral-700 hover:bg-neutral-200 cursor-pointer transition-colors border-b border-neutral-50 last:border-none"
        >
          {item.content}
        </li>
      ))}
    </ul>
  );
}