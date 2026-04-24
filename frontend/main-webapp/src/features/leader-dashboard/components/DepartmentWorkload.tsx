interface DepartmentWorkloadProps {
  departments: { name: string; load: number; maxLoad: number }[];
}

export default function DepartmentWorkload({ departments }: DepartmentWorkloadProps) {
  const getColor = (load: number) => {
    if (load >= 90) return { bar: "bg-red-500", text: "text-red-600", bg: "bg-red-50", label: "Quá tải" };
    if (load >= 70) return { bar: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50", label: "Cao" };
    return { bar: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50", label: "Ổn định" };
  };

  const sorted = [...departments].sort((a, b) => b.load - a.load);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">Phân bổ nguồn lực</h3>
          <p className="text-xs text-neutral-400 mt-0.5">Tỷ lệ tải công việc theo phòng ban</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-neutral-400">&lt;70%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[10px] text-neutral-400">70–89%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[10px] text-neutral-400">≥90%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {sorted.map((dept, i) => {
          const color = getColor(dept.load);
          return (
            <div key={dept.name} className="group animate-page-enter" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900 transition-colors">
                  {dept.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${color.bg} ${color.text}`}>
                    {color.label}
                  </span>
                  <span className="text-sm font-bold text-neutral-900 min-w-[40px] text-right">
                    {dept.load}%
                  </span>
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${color.bar} transition-all duration-700 ease-out`}
                  style={{ width: `${dept.load}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
