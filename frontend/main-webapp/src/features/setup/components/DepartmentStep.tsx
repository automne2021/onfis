import { useState } from "react";

interface DepartmentStepProps {
  departments: string[];
  onUpdate: (departments: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const DEFAULT_DEPARTMENTS = [
  { name: "Nhân sự", icon: "👥" },
  { name: "Kế toán", icon: "📊" },
  { name: "Kinh doanh", icon: "💼" },
  { name: "Kỹ thuật (IT)", icon: "💻" },
  { name: "Marketing", icon: "📢" },
  { name: "Hành chính", icon: "🏢" },
];

export default function DepartmentStep({ departments, onUpdate, onNext, onBack }: DepartmentStepProps) {
  const [customName, setCustomName] = useState("");
  const [error, setError] = useState("");

  const toggleDepartment = (name: string) => {
    if (departments.includes(name)) {
      onUpdate(departments.filter((d) => d !== name));
    } else {
      onUpdate([...departments, name]);
    }
  };

  const addCustom = () => {
    const trimmed = customName.trim();
    if (!trimmed) return;
    if (departments.includes(trimmed)) {
      setError("Phòng ban này đã tồn tại");
      return;
    }
    onUpdate([...departments, trimmed]);
    setCustomName("");
    setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustom();
    }
  };

  const handleNext = () => {
    if (departments.length === 0) {
      setError("Vui lòng chọn ít nhất một phòng ban");
      return;
    }
    onNext();
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Cơ cấu Tổ chức</h2>
        <p className="text-blue-200/60 text-sm">Chọn các phòng ban cốt lõi hoặc thêm phòng ban riêng</p>
      </div>

      {/* Default departments grid */}
      <div className="grid grid-cols-3 gap-3">
        {DEFAULT_DEPARTMENTS.map((dept) => {
          const isSelected = departments.includes(dept.name);
          return (
            <button
              key={dept.name}
              type="button"
              onClick={() => toggleDepartment(dept.name)}
              className={`group flex items-center gap-3 p-4 rounded-xl border transition-all duration-200
                ${isSelected
                  ? "bg-blue-600/25 border-blue-400/60 ring-2 ring-blue-500/20"
                  : "bg-white/5 border-white/15 hover:bg-white/10 hover:border-white/30"
                }`}
            >
              <span className="text-2xl">{dept.icon}</span>
              <span className={`text-sm font-medium ${isSelected ? "text-white" : "text-white/60"}`}>
                {dept.name}
              </span>
              {isSelected && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-auto text-blue-400">
                  <path d="M3.5 8L6.5 11L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom departments */}
      {departments.filter((d) => !DEFAULT_DEPARTMENTS.find((dd) => dd.name === d)).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {departments
            .filter((d) => !DEFAULT_DEPARTMENTS.find((dd) => dd.name === d))
            .map((dept) => (
              <span
                key={dept}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/20 border border-indigo-400/40 text-sm text-white"
              >
                {dept}
                <button
                  type="button"
                  onClick={() => onUpdate(departments.filter((d) => d !== dept))}
                  className="text-white/40 hover:text-red-400 transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
        </div>
      )}

      {/* Add custom input */}
      <div className="flex gap-3">
        <input
          type="text"
          value={customName}
          onChange={(e) => { setCustomName(e.target.value); setError(""); }}
          onKeyDown={handleKeyDown}
          placeholder="Thêm phòng ban khác..."
          className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30
                     focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all"
        />
        <button
          type="button"
          onClick={addCustom}
          className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-medium text-sm
                     hover:bg-white/20 transition-all"
        >
          + Thêm
        </button>
      </div>
      {error && <p className="text-xs text-red-400 -mt-4">{error}</p>}

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <button type="button" onClick={onBack} className="px-6 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm font-medium">
          ← Quay lại
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-all"
        >
          Tiếp tục →
        </button>
      </div>
    </div>
  );
}
