import { useState } from "react";

interface PositionStepProps {
  departments: string[];
  positions: Record<string, string[]>;
  onUpdate: (positions: Record<string, string[]>) => void;
  onNext: () => void;
  onBack: () => void;
}

const SUGGESTED_POSITIONS: Record<string, string[]> = {
  "Nhân sự": ["Trưởng phòng Nhân sự", "Chuyên viên Tuyển dụng", "Chuyên viên C&B"],
  "Kế toán": ["Kế toán trưởng", "Kế toán viên", "Thủ quỹ"],
  "Kinh doanh": ["Giám đốc Kinh doanh", "Trưởng nhóm Sales", "Nhân viên Kinh doanh"],
  "Kỹ thuật (IT)": ["Tech Lead", "Frontend Developer", "Backend Developer", "QA Engineer"],
  "Marketing": ["Trưởng phòng Marketing", "Content Creator", "Digital Marketing"],
  "Hành chính": ["Trưởng phòng Hành chính", "Nhân viên Hành chính", "Lễ tân"],
};

export default function PositionStep({ departments, positions, onUpdate, onNext, onBack }: PositionStepProps) {
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const togglePosition = (dept: string, pos: string) => {
    const current = positions[dept] || [];
    if (current.includes(pos)) {
      onUpdate({ ...positions, [dept]: current.filter((p) => p !== pos) });
    } else {
      onUpdate({ ...positions, [dept]: [...current, pos] });
    }
  };

  const addCustomPosition = (dept: string) => {
    const name = customInputs[dept]?.trim();
    if (!name) return;
    const current = positions[dept] || [];
    if (current.includes(name)) return;
    onUpdate({ ...positions, [dept]: [...current, name] });
    setCustomInputs({ ...customInputs, [dept]: "" });
  };

  const handleNext = () => {
    const totalPositions = Object.values(positions).flat().length;
    if (totalPositions === 0) {
      setError("Vui lòng thêm ít nhất một vị trí");
      return;
    }
    onNext();
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Vị trí và Chức danh</h2>
        <p className="text-blue-200/60 text-sm">Khởi tạo các vai trò làm việc cho từng phòng ban</p>
      </div>

      <div className="flex flex-col gap-5 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
        {departments.map((dept) => {
          const deptPositions = positions[dept] || [];
          const suggestions = SUGGESTED_POSITIONS[dept] || [];

          return (
            <div key={dept} className="p-5 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                {dept}
                <span className="text-white/30 text-xs font-normal ml-auto">
                  {deptPositions.length} vị trí
                </span>
              </h3>

              {/* Suggested positions */}
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {suggestions.map((pos) => {
                    const isSelected = deptPositions.includes(pos);
                    return (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => togglePosition(dept, pos)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                          ${isSelected
                            ? "bg-blue-500/30 border border-blue-400/50 text-blue-200"
                            : "bg-white/5 border border-white/15 text-white/50 hover:bg-white/10 hover:text-white/70"
                          }`}
                      >
                        {isSelected ? "✓ " : "+ "}{pos}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Custom positions */}
              {deptPositions.filter((p) => !suggestions.includes(p)).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {deptPositions.filter((p) => !suggestions.includes(p)).map((pos) => (
                    <span key={pos} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-xs text-white">
                      {pos}
                      <button type="button" onClick={() => togglePosition(dept, pos)} className="text-white/40 hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add custom */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInputs[dept] || ""}
                  onChange={(e) => setCustomInputs({ ...customInputs, [dept]: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomPosition(dept); } }}
                  placeholder="Thêm vị trí khác..."
                  className="flex-1 px-3 py-2 rounded-lg bg-white/8 border border-white/15 text-sm text-white placeholder-white/25
                             focus:outline-none focus:border-blue-400 transition-all"
                />
                <button type="button" onClick={() => addCustomPosition(dept)} className="px-4 py-2 rounded-lg bg-white/10 text-white/60 text-xs font-medium hover:bg-white/15 transition-all">
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack} className="px-6 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm font-medium">
          ← Quay lại
        </button>
        <button type="button" onClick={handleNext} className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-all">
          Tiếp tục →
        </button>
      </div>
    </div>
  );
}
