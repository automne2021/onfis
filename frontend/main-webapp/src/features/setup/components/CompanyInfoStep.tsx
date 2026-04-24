import { useState, useRef } from "react";

interface CompanyInfoStepProps {
  data: { name: string; logoFile: File | null; logoPreview: string | null; size: string };
  onUpdate: (data: CompanyInfoStepProps["data"]) => void;
  onNext: () => void;
  onBack: () => void;
}

const COMPANY_SIZES = [
  { value: "1-10", label: "1–10", desc: "Startup" },
  { value: "11-50", label: "11–50", desc: "Nhỏ" },
  { value: "51-200", label: "51–200", desc: "Vừa" },
  { value: "201-500", label: "201–500", desc: "Lớn" },
];

export default function CompanyInfoStep({ data, onUpdate, onNext, onBack }: CompanyInfoStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoSelect = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, logo: "Vui lòng chọn file ảnh" }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, logo: "File ảnh không được vượt quá 5MB" }));
      return;
    }
    setErrors((prev) => {
      const { logo: _, ...rest } = prev;
      return rest;
    });
    const reader = new FileReader();
    reader.onload = (e) => {
      onUpdate({ ...data, logoFile: file, logoPreview: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleLogoSelect(file);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!data.name.trim()) errs.name = "Tên công ty không được để trống";
    if (!data.size) errs.size = "Vui lòng chọn quy mô nhân sự";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onNext();
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Thông tin Doanh nghiệp</h2>
        <p className="text-blue-200/60 text-sm">Cập nhật thông tin cơ bản về công ty của bạn</p>
      </div>

      {/* Company Name */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-blue-100">Tên công ty *</label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => {
            onUpdate({ ...data, name: e.target.value });
            if (errors.name) setErrors((prev) => {
              const { name: _, ...rest } = prev;
              return rest;
            });
          }}
          placeholder="VD: Công ty ABC"
          className={`w-full px-4 py-3 rounded-xl bg-white/10 border text-white placeholder-white/30
                      focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all
                      ${errors.name ? "border-red-400" : "border-white/20 focus:border-blue-400"}`}
        />
        {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
      </div>

      {/* Logo Upload */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-blue-100">Logo công ty</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex items-center gap-6 p-6 rounded-xl border-2 border-dashed border-white/20
                     hover:border-blue-400/50 bg-white/5 hover:bg-white/8 cursor-pointer transition-all"
        >
          {data.logoPreview ? (
            <img src={data.logoPreview} alt="Logo preview" className="w-16 h-16 rounded-xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-white/80">
              {data.logoFile ? data.logoFile.name : "Kéo thả hoặc nhấn để tải lên"}
            </p>
            <p className="text-xs text-white/40 mt-1">PNG, JPG, SVG — tối đa 5MB</p>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoSelect(e.target.files?.[0] ?? null)} />
        {errors.logo && <p className="text-xs text-red-400">{errors.logo}</p>}
      </div>

      {/* Company Size */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-blue-100">Quy mô nhân sự *</label>
        <div className="grid grid-cols-4 gap-3">
          {COMPANY_SIZES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => {
                onUpdate({ ...data, size: s.value });
                if (errors.size) setErrors((prev) => {
                  const { size: _, ...rest } = prev;
                  return rest;
                });
              }}
              className={`flex flex-col items-center gap-1 p-4 rounded-xl border transition-all duration-200
                ${data.size === s.value
                  ? "bg-blue-600/30 border-blue-400 text-white ring-2 ring-blue-500/30"
                  : "bg-white/5 border-white/15 text-white/60 hover:bg-white/10 hover:border-white/30"
                }`}
            >
              <span className="text-lg font-bold">{s.label}</span>
              <span className="text-[11px] opacity-70">{s.desc}</span>
            </button>
          ))}
        </div>
        {errors.size && <p className="text-xs text-red-400">{errors.size}</p>}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <button type="button" onClick={onBack} className="px-6 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm font-medium">
          ← Quay lại
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-all"
        >
          Tiếp tục →
        </button>
      </div>
    </div>
  );
}
