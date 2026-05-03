import { useState, useRef } from "react";
import Icon from "../../../components/common/Icon";

interface EmployeeProfileStepProps {
  data: ProfileFormData;
  onUpdate: (data: ProfileFormData) => void;
  onNext: () => void;
  onBack: () => void;
}

export interface ProfileFormData {
  // Basic info (users table)
  firstName: string;
  lastName: string;
  // Contact
  phoneNumber: string;
  workPhone: string;
  personalEmail: string;
  // Personal
  dob: string;
  gender: string;
  nationality: string;
  nationId: string;
  address: string;
  // Work
  workLocation: string;
  bio: string;
  skills: string[];
  // Financial (jsonb)
  bankingInfo: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  taxInfo: {
    taxCode: string;
  };
  // Emergency & Contract (jsonb)
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export const EMPTY_PROFILE: ProfileFormData = {
  firstName: "",
  lastName: "",
  phoneNumber: "",
  workPhone: "",
  personalEmail: "",
  dob: "",
  gender: "",
  nationality: "",
  nationId: "",
  address: "",
  workLocation: "",
  bio: "",
  skills: [],
  bankingInfo: { bankName: "", accountNumber: "", accountHolder: "" },
  taxInfo: { taxCode: "" },
  emergencyContact: { name: "", phone: "", relationship: "" },
};

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 mt-6 first:mt-0">
      <Icon name={icon} size={20} color="#3b82f6" />
      <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wider">{title}</h3>
      <div className="flex-1 h-px bg-blue-100 ml-2" />
    </div>
  );
}

function Field({
  label, required, children,
}: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-neutral-600">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-800 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all";
const selectCls = inputCls;

export default function EmployeeProfileStep({ data, onUpdate, onNext, onBack }: EmployeeProfileStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [skillInput, setSkillInput] = useState("");
  const avatarRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const set = <K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) => {
    onUpdate({ ...data, [key]: value });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!data.firstName.trim()) e.firstName = "Bắt buộc";
    if (!data.lastName.trim()) e.lastName = "Bắt buộc";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !data.skills.includes(s)) {
      set("skills", [...data.skills, s]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    set("skills", data.skills.filter((s) => s !== skill));
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-neutral-800 mb-1">Thông tin cá nhân</h2>
      <p className="text-sm text-neutral-500 mb-6">Điền thông tin để hoàn thiện hồ sơ của bạn.</p>

      {/* Avatar upload */}
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => avatarRef.current?.click()}
          className="w-20 h-20 rounded-full bg-blue-50 border-2 border-dashed border-blue-200 flex items-center justify-center text-blue-400 hover:border-blue-400 hover:bg-blue-100/50 transition-all overflow-hidden"
        >
          {avatarPreview ? (
            <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
          ) : (
            <Icon name="add_a_photo" size={28} color="#93c5fd" />
          )}
        </button>
        <input
          ref={avatarRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setAvatarPreview(URL.createObjectURL(file));
          }}
        />
        <div className="text-sm text-neutral-500">
          <p className="font-medium text-neutral-700">Ảnh đại diện</p>
          <p className="text-xs">JPG, PNG. Tối đa 2MB</p>
        </div>
      </div>

      {/* ─── Basic Info ─────────────────────────────────────────────────── */}
      <SectionHeader title="Thông tin cơ bản" icon="person" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Họ" required>
          <input
            className={`${inputCls} ${errors.lastName ? "border-red-400" : ""}`}
            value={data.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            placeholder="Nguyễn"
          />
          {errors.lastName && <p className="text-xs text-red-500 mt-0.5">{errors.lastName}</p>}
        </Field>
        <Field label="Tên" required>
          <input
            className={`${inputCls} ${errors.firstName ? "border-red-400" : ""}`}
            value={data.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            placeholder="Văn A"
          />
          {errors.firstName && <p className="text-xs text-red-500 mt-0.5">{errors.firstName}</p>}
        </Field>
      </div>

      {/* ─── Contact ────────────────────────────────────────────────────── */}
      <SectionHeader title="Liên hệ" icon="call" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Số điện thoại">
          <input className={inputCls} value={data.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} placeholder="0901 234 567" />
        </Field>
        <Field label="Số điện thoại công việc">
          <input className={inputCls} value={data.workPhone} onChange={(e) => set("workPhone", e.target.value)} placeholder="028 1234 5678" />
        </Field>
        <Field label="Email cá nhân">
          <input className={inputCls} type="email" value={data.personalEmail} onChange={(e) => set("personalEmail", e.target.value)} placeholder="email@gmail.com" />
        </Field>
      </div>

      {/* ─── Personal ───────────────────────────────────────────────────── */}
      <SectionHeader title="Thông tin cá nhân" icon="badge" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Ngày sinh">
          <input className={inputCls} type="date" value={data.dob} onChange={(e) => set("dob", e.target.value)} />
        </Field>
        <Field label="Giới tính">
          <select className={selectCls} value={data.gender} onChange={(e) => set("gender", e.target.value)}>
            <option value="">Chọn</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="other">Khác</option>
          </select>
        </Field>
        <Field label="Quốc tịch">
          <input className={inputCls} value={data.nationality} onChange={(e) => set("nationality", e.target.value)} placeholder="Việt Nam" />
        </Field>
        <Field label="CCCD/CMND">
          <input className={inputCls} value={data.nationId} onChange={(e) => set("nationId", e.target.value)} placeholder="0123456789" />
        </Field>
        <Field label="Địa chỉ">
          <input className={`${inputCls} col-span-2`} value={data.address} onChange={(e) => set("address", e.target.value)} placeholder="123 Nguyễn Huệ, Q.1, TP.HCM" />
        </Field>
      </div>

      {/* ─── Work ───────────────────────────────────────────────────────── */}
      <SectionHeader title="Công việc" icon="work" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nơi làm việc">
          <input className={inputCls} value={data.workLocation} onChange={(e) => set("workLocation", e.target.value)} placeholder="Văn phòng HCM" />
        </Field>
        <Field label="Giới thiệu bản thân">
          <textarea className={`${inputCls} resize-none`} rows={2} value={data.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Giới thiệu ngắn..." />
        </Field>
      </div>

      {/* Skills tags */}
      <div className="mt-4">
        <Field label="Kỹ năng">
          <div className="flex items-center gap-2">
            <input
              className={inputCls}
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
              placeholder="Nhập kỹ năng rồi nhấn Enter"
            />
            <button type="button" onClick={addSkill} className="px-3 py-2 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors">
              Thêm
            </button>
          </div>
        </Field>
        {data.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {data.skills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                {s}
                <button type="button" onClick={() => removeSkill(s)} className="text-blue-400 hover:text-red-500">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ─── Financial (optional) ────────────────────────────────────── */}
      <SectionHeader title="Tài chính (tùy chọn)" icon="account_balance" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Ngân hàng">
          <input className={inputCls} value={data.bankingInfo.bankName} onChange={(e) => set("bankingInfo", { ...data.bankingInfo, bankName: e.target.value })} placeholder="Vietcombank" />
        </Field>
        <Field label="Số tài khoản">
          <input className={inputCls} value={data.bankingInfo.accountNumber} onChange={(e) => set("bankingInfo", { ...data.bankingInfo, accountNumber: e.target.value })} placeholder="0123456789" />
        </Field>
        <Field label="Chủ tài khoản">
          <input className={inputCls} value={data.bankingInfo.accountHolder} onChange={(e) => set("bankingInfo", { ...data.bankingInfo, accountHolder: e.target.value })} placeholder="NGUYEN VAN A" />
        </Field>
        <Field label="Mã số thuế">
          <input className={inputCls} value={data.taxInfo.taxCode} onChange={(e) => set("taxInfo", { ...data.taxInfo, taxCode: e.target.value })} placeholder="0123456789" />
        </Field>
      </div>

      {/* ─── Emergency Contact (optional) ─────────────────────────────── */}
      <SectionHeader title="Liên hệ khẩn cấp (tùy chọn)" icon="emergency" />
      <div className="grid grid-cols-3 gap-4">
        <Field label="Họ tên">
          <input className={inputCls} value={data.emergencyContact.name} onChange={(e) => set("emergencyContact", { ...data.emergencyContact, name: e.target.value })} placeholder="Nguyễn Văn B" />
        </Field>
        <Field label="Số điện thoại">
          <input className={inputCls} value={data.emergencyContact.phone} onChange={(e) => set("emergencyContact", { ...data.emergencyContact, phone: e.target.value })} placeholder="0901 234 567" />
        </Field>
        <Field label="Mối quan hệ">
          <input className={inputCls} value={data.emergencyContact.relationship} onChange={(e) => set("emergencyContact", { ...data.emergencyContact, relationship: e.target.value })} placeholder="Cha/Mẹ/Vợ/Chồng" />
        </Field>
      </div>

      {/* ─── Actions ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t border-neutral-100">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 rounded-xl text-neutral-600 text-sm font-medium hover:bg-neutral-100 transition-colors"
        >
          ← Quay lại
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="px-8 py-2.5 rounded-xl text-white text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/20 hover:shadow-xl transition-all"
        >
          Tiếp tục →
        </button>
      </div>
    </div>
  );
}
