import { useState } from "react";
import type { CreateExecutiveRequest, ExecutiveRequest } from "../services/delegationService";

interface DelegationFormProps {
  onSubmit: (data: CreateExecutiveRequest) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
}

const PRIORITIES: { value: ExecutiveRequest["priority"]; label: string; color: string }[] = [
  { value: "URGENT", label: "Khẩn cấp", color: "bg-red-100 text-red-700 border-red-200" },
  { value: "HIGH", label: "Cao", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "MEDIUM", label: "Trung bình", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "LOW", label: "Thấp", color: "bg-neutral-100 text-neutral-600 border-neutral-200" },
];

export default function DelegationForm({ onSubmit, isSubmitting, onCancel }: DelegationFormProps) {
  const [form, setForm] = useState<CreateExecutiveRequest>({
    title: "",
    description: "",
    priority: "HIGH",
    targetRole: "MANAGER",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Tiêu đề không được để trống";
    if (!form.description.trim()) errs.description = "Mô tả không được để trống";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white rounded-2xl border border-neutral-200/80 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">Tạo ủy quyền mới</h3>
        <button type="button" onClick={onCancel} className="text-neutral-400 hover:text-neutral-600 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-700">Tiêu đề *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => { setForm({ ...form, title: e.target.value }); setErrors({ ...errors, title: "" }); }}
          placeholder="VD: Phê duyệt ngân sách Q3 cho Marketing"
          className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all
            ${errors.title ? "border-red-300" : "border-neutral-200 focus:border-indigo-400"}`}
        />
        {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-700">Mô tả chi tiết *</label>
        <textarea
          value={form.description}
          onChange={(e) => { setForm({ ...form, description: e.target.value }); setErrors({ ...errors, description: "" }); }}
          placeholder="Mô tả rõ nội dung, yêu cầu và thời hạn..."
          rows={4}
          className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none
            ${errors.description ? "border-red-300" : "border-neutral-200 focus:border-indigo-400"}`}
        />
        {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
      </div>

      {/* Priority */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-neutral-700">Mức độ ưu tiên</label>
        <div className="flex gap-2">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setForm({ ...form, priority: p.value })}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all
                ${form.priority === p.value ? `${p.color} ring-2 ring-offset-1` : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Target role */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-neutral-700">Giao cho vai trò</label>
        <div className="flex gap-3">
          {(["ADMIN", "MANAGER"] as const).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setForm({ ...form, targetRole: role })}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition-all
                ${form.targetRole === role
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                }`}
            >
              {role === "ADMIN" ? "🛡️ Admin" : "👔 Manager"}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-xl text-sm text-neutral-500 hover:bg-neutral-100 transition-all">
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
              </svg>
              Đang tạo...
            </>
          ) : (
            "Tạo ủy quyền"
          )}
        </button>
      </div>
    </form>
  );
}
