import { Link } from "react-router-dom"
import { useLanguage } from "../../../../contexts/LanguageContext";

interface BreadCrumbProps {
  title: string
}

export function BreadCrumb({ title }: BreadCrumbProps) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center py-0.5 gap-1">
      <Link
        to={`./../..`}
        className="body-3-regular text-neutral-600 hover:text-primary hover:underline transition cursor-pointer"
      >
        {t("Announcement")}
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