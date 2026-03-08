import type { OverviewProps } from "../../types/userProfileTypes";
import { TitleHeader } from "../TitleHeader";
import {
  AccountBalanceOutlined,
} from '@mui/icons-material';
import { CopyArea } from "../Copy/CopyArea";

export function BankingAndTax({ icon, userInfo }: OverviewProps) {

  const bankingInfo = [
    { label: "Bank name", icon: <AccountBalanceOutlined />, content: userInfo.banking?.bankName },
    { label: "Account number", content: userInfo.banking?.accountNumber },
    { label: "Tax ID", content: userInfo.banking?.taxId },
  ]

  return (
    <div className="profile-section">
      <TitleHeader icon={icon} title="Banking & Tax" />

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