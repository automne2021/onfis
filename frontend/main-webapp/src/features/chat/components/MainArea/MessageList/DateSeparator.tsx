interface DateSeparatorProps {
  date: string;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className="w-full flex justify-center my-6">
      <span className="body-4-regular text-neutral-500">
        {date}
      </span>
    </div>
  );
}