import type { OverviewProps } from "../../types/userProfileTypes";
import { TitleHeader } from "../TitleHeader";
import {
  AccountBalanceOutlined,
} from '@mui/icons-material';
import { CopyArea } from "../Copy/CopyArea";
import { useLanguage } from "../../../../contexts/LanguageContext";

export function BankingAndTax({ icon, userInfo }: OverviewProps) {
  const { t } = useLanguage();

  const bankingInfo = [
    { label: t("Bank name"), icon: <AccountBalanceOutlined />, content: userInfo.bankingInfo?.bankName },
    { label: t("Account number"), content: userInfo.bankingInfo?.accountNumber },
    { label: t("Tax ID"), content: userInfo.bankingInfo?.taxId },
  ]

  return (
    <div className="profile-section">
      <TitleHeader icon={icon} title={t("Banking & Tax")} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        {bankingInfo.map((item, index) => (
          <div
            key={index}
            className="flex flex-1 flex-col justify-center gap-2 min-w-[280px] px-4 py-3"
          >
            <p className="text-neutral-500 body-3-medium uppercase">{item.label}</p>
            <CopyArea icon={item.icon} index={index} content={item.content ? item.content : 'N/A'} />
          </div>
        ))}
      </div>
    </div>
  )
}