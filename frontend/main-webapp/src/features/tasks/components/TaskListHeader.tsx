import { Checkbox } from "../../../components/common/Icons";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function TaskListHeader() {
  const { t } = useLanguage();
  return (
    <div className="bg-neutral-50 border-b border-neutral-200 grid grid-cols-[24px_2fr_1fr_1fr_1fr_1.5fr] gap-2 items-center px-3 py-1.5 w-full sticky top-0 z-10 text-xs font-medium text-neutral-500 uppercase tracking-wider">
      {/* Checkbox */}
      <div className="flex-shrink-0">
        <Checkbox checked={false} />
      </div>

      {/* Title Column */}
      <div>
        <span className="font-bold text-xs leading-4 text-neutral-500">
          {t("Title")}
        </span>
      </div>

      {/* Assignees Column */}
      <div>
        <span className="font-bold text-xs leading-4 text-neutral-500">
          {t("Assignees")}
        </span>
      </div>

      {/* Tags Column */}
      <div>
        <span className="font-bold text-xs leading-4 text-neutral-500">
          {t("Tags")}
        </span>
      </div>

      {/* Due Date Column */}
      <div>
        <span className="font-bold text-xs leading-4 text-neutral-500">
          {t("Due date")}
        </span>
      </div>

      {/* Progress Column */}
      <div>
        <span className="font-bold text-xs leading-4 text-neutral-500">
          {t("Progress")}
        </span>
      </div>
    </div>
  );
}
