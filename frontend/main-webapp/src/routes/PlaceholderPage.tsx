export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">{title}</h1>
        <p className="text-neutral-500">This page is under construction</p>
      </div>
    </div>
  );
}
