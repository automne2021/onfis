import { Link } from "react-router-dom"

import { ChevronRightOutlined } from '@mui/icons-material';

interface BreadCrumbProps {
  title: string
}

export function BreadCrumb({ title } : BreadCrumbProps) {
  return (
    <div className="w-full p-6 flex items-center bg-white rounded-t-lg border-b border-neutral-200">
      <Link
        to={`./../..`}
        className="body-2-regular text-neutral-600 hover:text-primary hover:underline transition cursor-pointer"
      >
        Announcement
      </Link>
      <span className="mx-1"> <ChevronRightOutlined fontSize="small"/> </span>
      <Link
        to={`./`}
        className="body-2-regular text-primary hover:underline transition cursor-pointer"
      >
        {title}
      </Link>
    </div>
  )
}