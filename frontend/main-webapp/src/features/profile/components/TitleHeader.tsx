export function TitleHeader({ icon, title }: { icon: React.ReactNode, title: string }) {
  return (
    <div className="flex items-center gap-3 text-primary">
      {icon}
      <p className="header-h6 leading-none text-neutral-900">{title}</p>
    </div>
  )
}