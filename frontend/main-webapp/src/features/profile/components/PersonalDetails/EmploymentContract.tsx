import type { OverviewProps } from "../../types/userProfileTypes";
import { TitleHeader } from "../TitleHeader";
import { FILE_ICONS, FILE_COLORS, getFileType } from "../../../../config/fileConfig";
import { useLanguage } from "../../../../contexts/LanguageContext";

export function EmploymentContract({ icon, userInfo }: OverviewProps) {
  const { t } = useLanguage();

  const contractInfo = [
    { label: t("Contract Type"), content: userInfo.contractInfo?.type },
    { label: t("Working Schedule"), content: userInfo.contractInfo?.schedule },
    { label: t("Start Date"), content: userInfo.contractInfo?.startDate },
    { label: t("Notice Period"), content: userInfo.contractInfo?.noticePeriod },
    { label: t("End Date"), content: userInfo.contractInfo?.endDate },
    { label: t("Probation Period"), content: userInfo.contractInfo?.probationPeriod },
  ]

  const fileName = userInfo.contractInfo?.fileName || "N/A";
  const fileExt = getFileType(fileName);
  const fileIcon = FILE_ICONS[fileExt] || FILE_ICONS.pdf;
  const fileColor = FILE_COLORS[fileExt] || FILE_COLORS.default;

  return (
    <div className="profile-section">
      <TitleHeader icon={icon} title={t("Employment Contract")} />

      <div className="flex flex-col gap-5 justify-center mt-2">
        {/* Basic information */}
        <div className="flex flex-wrap gap-x-16 gap-y-5">
          {contractInfo.map((item, index) => (
            <div
              key={index}
              className="flex justify-between items-center border-b border-gray-100 pb-2 w-full md:basis-[calc(50%-32px)]"
            >
              <p className="text-gray-400 body-2-regular">{item.label}</p>
              <p className={`body-2-medium ${item.label === "Probation Period" && item.content === "Passed" ? "text-green-600" : ""}`}>
                {item.content || "—"}
              </p>
            </div>
          ))}
        </div>

        {/* Contract File */}
        <div
          className="mt-2 p-4 border border-neutral-200 rounded-xl flex items-center justify-between group hover:bg-neutral-50 transition-all"
        >
          <div className="flex items-center gap-4">
            {/* Icon File động dựa trên định dạng */}
            <div className={`w-12 h-12 ${fileColor.bg} rounded-lg flex items-center justify-center border border-white shadow-sm`}>
              <img src={fileIcon} alt={fileExt} className="w-7 h-7 object-contain" />
            </div>

            <div className="flex flex-col">
              <p className="body-3-medium text-neutral-900 truncate max-w-[200px] md:max-w-xs">
                {fileName}
              </p>
              <p className="body-4-regular text-neutral-500 mt-1">
                {userInfo.contractInfo?.fileSize || "2.4 MB"} • {t("Uploaded on")} {userInfo.contractInfo?.uploadDate || "Oct 12, 2020"}
              </p>
            </div>
          </div>

          <button
            type="button"
            className={`body-3-regular transition-colors text-neutral-500 hover:text-primary hover:underline`}
            onClick={() => window.open(userInfo.contractInfo?.fileUrl, '_blank')}
          >
            {t("Download")}
          </button>
        </div>
      </div>
    </div>
  )
}