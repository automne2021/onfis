import { Link } from "react-router-dom"

interface BreadCrumbProps {
  title: string
}

export function BreadCrumb({ title }: BreadCrumbProps) {
  return (
    <div className="flex items-center py-0.5 gap-1">
      <Link
        to={`./../..`}
        className="body-3-regular text-neutral-600 hover:text-primary hover:underline transition cursor-pointer"
      >
        Announcement
      </Link>
      <span className="mx-1"> / </span>
      <Link
        to={`./`}
        className="body-3-regular text-primary hover:underline transition cursor-pointer"
      >
        {title}
      </Link>
    </div>
  )
}