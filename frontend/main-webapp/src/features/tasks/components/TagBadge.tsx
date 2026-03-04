interface TagBadgeProps {
  type: "department" | "scope";
  label: string;
}

export default function TagBadge({ type, label }: TagBadgeProps) {
  const styles = {
    department: {
      bg: "bg-tag-department/15",
      text: "text-tag-department",
    },
    scope: {
      bg: "bg-tag-scope/15",
      text: "text-tag-scope",
    },
  };

  const { bg, text } = styles[type];

  return (
    <div
      className={`inline-flex items-center justify-center px-2.5 py-1.5 rounded-[20px] ${bg}`}
    >
      <span className={`font-medium text-sm leading-[18px] ${text} whitespace-nowrap`}>
        {label}
      </span>
    </div>
  );
}
