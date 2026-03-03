import type { OverviewProps } from "../../types/userProfileTypes";
import { TitleHeader } from "../TitleHeader";

export function PayrollAndCompensation({ icon, userInfo } : OverviewProps) {

  const payrollInfo = [
    {label: 'Base salary', content: userInfo.compensation?.baseSalary, subcontent: 'per annum'},
    {label: 'Pay frequency', content: userInfo.compensation?.payFrequency},
    {label: 'Bonus target', content: userInfo.compensation?.bonusTarget},
    {label: 'Next review', content: userInfo.compensation?.nextReview},
  ]

  return(
    <div className="bg-white rounded-lg py-10 px-6 flex flex-col gap-6 relative">
      <TitleHeader icon={icon} title="Payroll & Compensation" /> 

      <div className="flex flex-wrap items-stretch justify-between gap-3">
        {payrollInfo.map((item, index) => (
          <div
            key={index}
            className={`flex flex-1 flex-col gap-3 px-4 py-3 min-w-[280px] rounded-md border border-neutral-200 ${index === 0 && 'border-green-200 bg-green-50'}`}
          >
            <p className="uppercase body-3-medium text-neutral-500">{item.label}</p>
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <p className="text-neutral-900 body-2-medium">{item.content}</p>
                {item.subcontent && <p className="text-neutral-500 body-4-regular">{item.subcontent}</p>}
              </div>
            </div>
          </div>
        ))}

      </div>
    </div>
  )
}