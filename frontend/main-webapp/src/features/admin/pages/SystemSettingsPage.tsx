import { useState, useEffect, useCallback } from "react";
import Icon from "../../../components/common/Icon";
import { Button } from "../../../components/common/Buttons/Button";
import { useToast } from "../../../contexts/useToast";
import { adminService } from "../services/adminService";
import type {
  TenantSettings,
  StorageSettings,
  ModuleSettings,
  SecuritySettings,
  OperationalSettings,
} from "../types/adminTypes";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_TENANT: TenantSettings = {
  id: "t1",
  name: "Onfis Demo",
  legalName: "Onfis Technology Co., Ltd.",
  taxCode: "0123456789",
  address: "123 Nguyen Van Linh, District 7, Ho Chi Minh City",
  timezone: "Asia/Ho_Chi_Minh",
  dateFormat: "DD/MM/YYYY",
  workingDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
  publicHolidays: [
    { date: "2026-01-01", name: "New Year's Day" },
    { date: "2026-04-30", name: "Reunification Day" },
    { date: "2026-05-01", name: "International Workers' Day" },
    { date: "2026-09-02", name: "National Day" },
  ],
};

const MOCK_STORAGE: StorageSettings = {
  totalQuotaMb: 10240,
  usedMb: 3120,
  maxFileSizeMb: 10,
  allowedExtensions: ["jpg", "jpeg", "png", "gif", "pdf", "docx", "xlsx", "pptx", "zip"],
  bucketName: "onfis-uploads",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WEEKDAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const ALL_WEEKDAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

const TIMEZONES = [
  { value: "Asia/Ho_Chi_Minh", label: "UTC+7 - Hanoi, Ho Chi Minh City" },
  { value: "Asia/Bangkok", label: "UTC+7 – Bangkok" },
  { value: "Asia/Singapore", label: "UTC+8 – Singapore" },
  { value: "Asia/Tokyo", label: "UTC+9 – Tokyo" },
  { value: "UTC", label: "UTC+0 - Coordinated Universal Time" },
];

const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (25/04/2026)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (04/25/2026)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2026-04-25)" },
];

function StorageBar({ used, total }: { used: number; total: number }) {
  const pct = Math.min(100, (used / total) * 100);
  const color = pct > 80 ? "bg-red-500" : pct > 60 ? "bg-orange-400" : "bg-primary";
  return (
    <div>
      <div className="flex justify-between text-xs text-neutral-500 mb-1">
        <span>{(used / 1024).toFixed(1)} GB used</span>
        <span>{(total / 1024).toFixed(1)} GB total</span>
      </div>
      <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-neutral-400 mt-1">{pct.toFixed(1)}% used</p>
    </div>
  );
}

// ─── Tenant Settings Tab ──────────────────────────────────────────────────────

interface TenantTabProps {
  settings: TenantSettings;
  onSave: (s: TenantSettings) => Promise<void>;
}

function TenantTab({ settings, onSave }: TenantTabProps) {
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [holidayDraft, setHolidayDraft] = useState({ date: "", name: "" });
  const { showToast } = useToast();

  useEffect(() => { setDraft(settings); }, [settings]);

  const set = <K extends keyof TenantSettings>(key: K, value: TenantSettings[K]) =>
    setDraft((p) => ({ ...p, [key]: value }));

  const toggleDay = (day: string) => {
    setDraft((p) => ({
      ...p,
      workingDays: p.workingDays.includes(day)
        ? p.workingDays.filter((d) => d !== day)
        : [...p.workingDays, day],
    }));
  };

  const addHoliday = () => {
    if (!holidayDraft.date || !holidayDraft.name.trim()) return;
    setDraft((p) => ({
      ...p,
      publicHolidays: [...p.publicHolidays, { ...holidayDraft }].sort((a, b) => a.date.localeCompare(b.date)),
    }));
    setHolidayDraft({ date: "", name: "" });
  };

  const removeHoliday = (date: string) =>
    setDraft((p) => ({ ...p, publicHolidays: p.publicHolidays.filter((h) => h.date !== date) }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      showToast("Tenant settings saved.", "success");
    } catch {
      showToast("Unable to save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white";

  return (
    <div className="space-y-6">
      {/* Legal info */}
      <div className="section-card p-5 space-y-4">
        <p className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
          <Icon name="business" size={16} color="#0014A8" /> Legal Information
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Display Name</label>
            <input className={inputCls} value={draft.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Legal Name</label>
            <input className={inputCls} value={draft.legalName} onChange={(e) => set("legalName", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Tax Code</label>
            <input className={inputCls} value={draft.taxCode} onChange={(e) => set("taxCode", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Address</label>
            <input className={inputCls} value={draft.address} onChange={(e) => set("address", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Time & Format */}
      <div className="section-card p-5 space-y-4">
        <p className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
          <Icon name="schedule" size={16} color="#0014A8" /> Timezone & Format
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">System Timezone</label>
            <select className={inputCls} value={draft.timezone} onChange={(e) => set("timezone", e.target.value)}>
              {TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Date Format</label>
            <select className={inputCls} value={draft.dateFormat} onChange={(e) => set("dateFormat", e.target.value)}>
              {DATE_FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Working days */}
      <div className="section-card p-5 space-y-3">
        <p className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
          <Icon name="date_range" size={16} color="#0014A8" /> Working Days
        </p>
        <div className="flex flex-wrap gap-2">
          {ALL_WEEKDAYS.map((day) => {
            const active = draft.workingDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  active
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                {WEEKDAY_LABELS[day]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Public holidays */}
      <div className="section-card p-5 space-y-3">
        <p className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
          <Icon name="celebration" size={16} color="#0014A8" /> Public Holidays
        </p>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {draft.publicHolidays.map((h) => (
            <div key={h.date} className="flex items-center justify-between px-3 py-2 bg-neutral-50 rounded-lg border border-neutral-100">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-neutral-400">{h.date}</span>
                <span className="text-sm text-neutral-700">{h.name}</span>
              </div>
              <button type="button" onClick={() => removeHoliday(h.date)}
                className="p-1 hover:bg-red-50 rounded transition-colors">
                <Icon name="close" size={12} color="#ef4444" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input
            type="date"
            className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            value={holidayDraft.date}
            onChange={(e) => setHolidayDraft((p) => ({ ...p, date: e.target.value }))}
          />
          <input
            type="text"
            className="flex-1 border border-neutral-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Holiday name"
            value={holidayDraft.name}
            onChange={(e) => setHolidayDraft((p) => ({ ...p, name: e.target.value }))}
          />
          <Button style="sub" title="Add" onClick={addHoliday} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button style="primary" title="Save Tenant Settings" loading={saving} onClick={() => void handleSave()} />
      </div>
    </div>
  );
}

// ─── Storage Settings Tab ─────────────────────────────────────────────────────

interface StorageTabProps {
  settings: StorageSettings;
  onSave: (s: StorageSettings) => Promise<void>;
}

function StorageTab({ settings, onSave }: StorageTabProps) {
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [extDraft, setExtDraft] = useState("");
  const { showToast } = useToast();

  useEffect(() => { setDraft(settings); }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      showToast("Storage settings saved.", "success");
    } catch {
      showToast("Unable to save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const addExt = () => {
    const ext = extDraft.trim().toLowerCase().replace(/^\./, "");
    if (!ext || draft.allowedExtensions.includes(ext)) return;
    setDraft((p) => ({ ...p, allowedExtensions: [...p.allowedExtensions, ext] }));
    setExtDraft("");
  };

  const removeExt = (ext: string) =>
    setDraft((p) => ({ ...p, allowedExtensions: p.allowedExtensions.filter((e) => e !== ext) }));

  return (
    <div className="space-y-6">
      {/* Usage */}
      <div className="section-card p-5 space-y-4">
        <p className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
          <Icon name="storage" size={16} color="#0014A8" /> Storage Usage
        </p>
        <StorageBar used={draft.usedMb} total={draft.totalQuotaMb} />
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Total Quota", value: `${(draft.totalQuotaMb / 1024).toFixed(1)} GB`, color: "text-neutral-700" },
            { label: "Used", value: `${(draft.usedMb / 1024).toFixed(1)} GB`, color: "text-orange-600" },
            { label: "Available", value: `${((draft.totalQuotaMb - draft.usedMb) / 1024).toFixed(1)} GB`, color: "text-green-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-neutral-50 rounded-xl p-3 border border-neutral-100">
              <p className={`text-lg font-bold ${color}`}>{value}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">Bucket Name</label>
          <input
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-neutral-50 text-neutral-500 cursor-not-allowed"
            value={draft.bucketName}
            readOnly
          />
          <p className="text-[11px] text-neutral-400 mt-1">Configured in Supabase Storage. Change it from the dashboard.</p>
        </div>
      </div>

      {/* Upload limits */}
      <div className="section-card p-5 space-y-4">
        <p className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
          <Icon name="upload_file" size={16} color="#0014A8" /> Upload Limits
        </p>
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">
            Maximum file size (MB): <span className="font-bold text-neutral-700">{draft.maxFileSizeMb} MB</span>
          </label>
          <input
            type="range"
            min={1}
            max={200}
            value={draft.maxFileSizeMb}
            onChange={(e) => setDraft((p) => ({ ...p, maxFileSizeMb: Number(e.target.value) }))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
            <span>1 MB</span>
            <span>100 MB</span>
            <span>200 MB</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-2">Allowed file formats</label>
          <div className="flex flex-wrap gap-1.5 mb-2 p-3 bg-neutral-50 rounded-lg border border-neutral-100 min-h-[40px]">
            {draft.allowedExtensions.map((ext) => (
              <span key={ext} className="inline-flex items-center gap-1 bg-white border border-neutral-200 text-neutral-600 text-xs px-2 py-0.5 rounded-md">
                .{ext}
                <button type="button" onClick={() => removeExt(ext)} className="hover:text-red-500 transition-colors">
                  <Icon name="close" size={10} color="currentColor" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white w-40"
              placeholder=".pdf, .docx..."
              value={extDraft}
              onChange={(e) => setExtDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addExt(); }}
            />
            <Button style="sub" title="Add" onClick={addExt} />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button style="primary" title="Save Storage Settings" loading={saving} onClick={() => void handleSave()} />
      </div>
    </div>
  );
}

// ─── Module Settings Tab ──────────────────────────────────────────────────────

interface ModulesTabProps {
  settings: ModuleSettings;
  onSave: (s: ModuleSettings) => Promise<void>;
}

function ModulesTab({ settings, onSave }: ModulesTabProps) {
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => { setDraft(settings); }, [settings]);

  const toggle = (key: keyof ModuleSettings) =>
    setDraft((p) => ({ ...p, [key]: !p[key] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      showToast("Module settings saved.", "success");
    } catch {
      showToast("Unable to save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const modules: { key: keyof ModuleSettings; label: string; desc: string; icon: string }[] = [
    { key: "chatEnabled",              label: "Real-time Chat",        desc: "Allow users to send direct messages and participate in group chats.", icon: "chat" },
    { key: "announcementsEnabled",     label: "Announcements",         desc: "Enable company-wide and department-level announcement broadcasts.",   icon: "campaign" },
    { key: "meetingsEnabled",          label: "Meeting Scheduler",     desc: "Let users schedule and manage internal meetings.",                    icon: "video_call" },
    { key: "projectManagementEnabled", label: "Project Management",    desc: "Enable project boards, task tracking and sprint planning.",          icon: "dashboard" },
  ];

  return (
    <div className="space-y-4">
      <div className="section-card p-5 space-y-1">
        <p className="text-sm font-semibold text-neutral-700 flex items-center gap-2 mb-3">
          <Icon name="extension" size={16} color="#0014A8" /> Feature Modules
        </p>
        {modules.map(({ key, label, desc, icon }) => (
          <label key={key} className="flex items-start gap-4 p-3 rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors">
            <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
              <Icon name={icon} size={18} color="#0014A8" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-800">{label}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
            </div>
            <div
              onClick={() => toggle(key)}
              className={`relative shrink-0 mt-1 w-10 h-6 rounded-full transition-colors cursor-pointer ${draft[key] ? "bg-primary" : "bg-neutral-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${draft[key] ? "translate-x-4" : "translate-x-0"}`} />
            </div>
          </label>
        ))}
      </div>
      <div className="flex justify-end">
        <Button style="primary" title="Save Module Settings" loading={saving} onClick={() => void handleSave()} />
      </div>
    </div>
  );
}

// ─── Security Settings Tab ────────────────────────────────────────────────────

interface SecurityTabProps {
  settings: SecuritySettings;
  onSave: (s: SecuritySettings) => Promise<void>;
}

function SecurityTab({ settings, onSave }: SecurityTabProps) {
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => { setDraft(settings); }, [settings]);

  const setN = (key: keyof SecuritySettings, v: number) =>
    setDraft((p) => ({ ...p, [key]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      showToast("Security settings saved.", "success");
    } catch {
      showToast("Unable to save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white";

  return (
    <div className="space-y-5">
      <div className="section-card p-5 space-y-4">
        <p className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
          <Icon name="password" size={16} color="#0014A8" /> Password Policy
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Minimum length</label>
            <input type="number" min={4} max={128} className={inputCls}
              value={draft.passwordMinLength}
              onChange={(e) => setN("passwordMinLength", Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Max login attempts before lockout</label>
            <input type="number" min={1} max={20} className={inputCls}
              value={draft.loginMaxAttempts}
              onChange={(e) => setN("loginMaxAttempts", Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Account lockout duration (minutes)</label>
            <input type="number" min={1} max={1440} className={inputCls}
              value={draft.accountLockoutMinutes}
              onChange={(e) => setN("accountLockoutMinutes", Number(e.target.value))} />
          </div>
        </div>
      </div>

      <div className="section-card p-5 space-y-4">
        <p className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
          <Icon name="lock_clock" size={16} color="#0014A8" /> Session Policy
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Session timeout (minutes)</label>
            <input type="number" min={5} max={1440} className={inputCls}
              value={draft.sessionTimeoutMinutes}
              onChange={(e) => setN("sessionTimeoutMinutes", Number(e.target.value))} />
            <p className="text-[11px] text-neutral-400 mt-1">480 min = 8 hours. Idle sessions will be logged out.</p>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setDraft((p) => ({ ...p, mfaRequired: !p.mfaRequired }))}
            className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${draft.mfaRequired ? "bg-primary" : "bg-neutral-300"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${draft.mfaRequired ? "translate-x-4" : "translate-x-0"}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-800">Require MFA for all users</p>
            <p className="text-xs text-neutral-500">Users must verify identity via email OTP on login.</p>
          </div>
        </label>
      </div>

      <div className="flex justify-end">
        <Button style="primary" title="Save Security Settings" loading={saving} onClick={() => void handleSave()} />
      </div>
    </div>
  );
}

// ─── Operational Settings Tab ─────────────────────────────────────────────────

interface OperationsTabProps {
  settings: OperationalSettings;
  onSave: (s: OperationalSettings) => Promise<void>;
}

function OperationsTab({ settings, onSave }: OperationsTabProps) {
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => { setDraft(settings); }, [settings]);

  const toggleBool = (key: keyof OperationalSettings) =>
    setDraft((p) => ({ ...p, [key]: !p[key] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      showToast("Operational settings saved.", "success");
    } catch {
      showToast("Unable to save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggles: { key: keyof OperationalSettings; label: string; desc: string; icon: string; danger?: boolean }[] = [
    { key: "maintenanceMode",            label: "Maintenance Mode",          desc: "Blocks all non-admin access. Use during upgrades or emergencies.", icon: "construction", danger: true },
    { key: "newUserRegistrationEnabled", label: "New User Registration",     desc: "Allow invitations and self-service sign-up for the tenant.",       icon: "person_add" },
    { key: "dataExportEnabled",          label: "Data Export",               desc: "Users with permission can export project data as CSV/JSON.",        icon: "download" },
  ];

  return (
    <div className="space-y-5">
      <div className="section-card p-5 space-y-1">
        <p className="text-sm font-semibold text-neutral-700 flex items-center gap-2 mb-3">
          <Icon name="settings_suggest" size={16} color="#0014A8" /> Platform Controls
        </p>
        {toggles.map(({ key, label, desc, icon, danger }) => (
          <label key={key} className={`flex items-start gap-4 p-3 rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors ${danger && draft[key as keyof OperationalSettings] ? "bg-red-50/50" : ""}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${danger ? "bg-red-100" : "bg-primary/8"}`}>
              <Icon name={icon} size={18} color={danger ? "#ef4444" : "#0014A8"} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-800">{label}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
            </div>
            <div
              onClick={() => toggleBool(key as keyof OperationalSettings)}
              className={`relative shrink-0 mt-1 w-10 h-6 rounded-full transition-colors cursor-pointer ${draft[key as keyof OperationalSettings] ? (danger ? "bg-red-500" : "bg-primary") : "bg-neutral-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${draft[key as keyof OperationalSettings] ? "translate-x-4" : "translate-x-0"}`} />
            </div>
          </label>
        ))}
      </div>

      <div className="section-card p-5 space-y-3">
        <p className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
          <Icon name="contact_support" size={16} color="#0014A8" /> Support Contact
        </p>
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">Support email address</label>
          <input
            type="email"
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            placeholder="support@yourcompany.com"
            value={draft.supportContactEmail}
            onChange={(e) => setDraft((p) => ({ ...p, supportContactEmail: e.target.value }))}
          />
          <p className="text-[11px] text-neutral-400 mt-1">Displayed to users in the help section.</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button style="primary" title="Save Operational Settings" loading={saving} onClick={() => void handleSave()} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type TabId = "tenant" | "storage" | "modules" | "security" | "operations";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "tenant",     label: "Tenant Settings",    icon: "business" },
  { id: "storage",    label: "Storage Management", icon: "storage" },
  { id: "modules",    label: "Modules",            icon: "extension" },
  { id: "security",   label: "Security",           icon: "security" },
  { id: "operations", label: "Operations",         icon: "settings_suggest" },
];

let tenantSettingsSnapshot: TenantSettings | null = null;
let storageSettingsSnapshot: StorageSettings | null = null;
let moduleSettingsSnapshot: ModuleSettings | null = null;
let securitySettingsSnapshot: SecuritySettings | null = null;
let operationalSettingsSnapshot: OperationalSettings | null = null;

const DEFAULT_MODULES: ModuleSettings = { chatEnabled: true, announcementsEnabled: true, meetingsEnabled: true, projectManagementEnabled: true };
const DEFAULT_SECURITY: SecuritySettings = { passwordMinLength: 8, sessionTimeoutMinutes: 480, mfaRequired: false, loginMaxAttempts: 5, accountLockoutMinutes: 30 };
const DEFAULT_OPERATIONS: OperationalSettings = { maintenanceMode: false, newUserRegistrationEnabled: true, dataExportEnabled: true, supportContactEmail: "" };

export default function SystemSettingsPage() {
  const [initialCache] = useState(() => ({
    tenant: adminService.getCachedTenantSettings() ?? tenantSettingsSnapshot,
    storage: adminService.getCachedStorageSettings() ?? storageSettingsSnapshot,
    modules: adminService.getCachedModuleSettings() ?? moduleSettingsSnapshot,
    security: adminService.getCachedSecuritySettings() ?? securitySettingsSnapshot,
    operations: adminService.getCachedOperationalSettings() ?? operationalSettingsSnapshot,
  }));

  const [activeTab, setActiveTab] = useState<TabId>("tenant");
  const [tenantSettings, setTenantSettings] = useState<TenantSettings>(initialCache.tenant ?? MOCK_TENANT);
  const [storageSettings, setStorageSettings] = useState<StorageSettings>(initialCache.storage ?? MOCK_STORAGE);
  const [moduleSettings, setModuleSettings] = useState<ModuleSettings>(initialCache.modules ?? DEFAULT_MODULES);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(initialCache.security ?? DEFAULT_SECURITY);
  const [operationalSettings, setOperationalSettings] = useState<OperationalSettings>(initialCache.operations ?? DEFAULT_OPERATIONS);
  const [isLoading, setIsLoading] = useState(!(initialCache.tenant && initialCache.storage));
  const { showToast } = useToast();

  const load = useCallback(async (showLoading = false, forceRefresh = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const [tenant, storage, modules, security, operations] = await Promise.all([
        adminService.getTenantSettings({ forceRefresh }),
        adminService.getStorageSettings({ forceRefresh }),
        adminService.getModuleSettings({ forceRefresh }),
        adminService.getSecuritySettings({ forceRefresh }),
        adminService.getOperationalSettings({ forceRefresh }),
      ]);
      tenantSettingsSnapshot = tenant;
      storageSettingsSnapshot = storage;
      moduleSettingsSnapshot = modules;
      securitySettingsSnapshot = security;
      operationalSettingsSnapshot = operations;
      setTenantSettings(tenant);
      setStorageSettings(storage);
      setModuleSettings(modules);
      setSecuritySettings(security);
      setOperationalSettings(operations);
    } catch {
      setTenantSettings(tenantSettingsSnapshot ?? MOCK_TENANT);
      setStorageSettings(storageSettingsSnapshot ?? MOCK_STORAGE);
      setModuleSettings(moduleSettingsSnapshot ?? DEFAULT_MODULES);
      setSecuritySettings(securitySettingsSnapshot ?? DEFAULT_SECURITY);
      setOperationalSettings(operationalSettingsSnapshot ?? DEFAULT_OPERATIONS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(!(initialCache.tenant && initialCache.storage), false); }, [initialCache.storage, initialCache.tenant, load]);

  const handleSaveTenant = async (s: TenantSettings) => {
    try {
      const updated = await adminService.updateTenantSettings(s);
      tenantSettingsSnapshot = updated;
      setTenantSettings(updated);
    } catch {
      tenantSettingsSnapshot = s;
      setTenantSettings(s);
    }
    showToast("Tenant settings saved.", "success");
  };

  const handleSaveStorage = async (s: StorageSettings) => {
    try {
      const updated = await adminService.updateStorageSettings(s);
      storageSettingsSnapshot = updated;
      setStorageSettings(updated);
    } catch {
      storageSettingsSnapshot = s;
      setStorageSettings(s);
    }
    showToast("Storage settings saved.", "success");
  };

  const handleSaveModules = async (s: ModuleSettings) => {
    try {
      const updated = await adminService.updateModuleSettings(s);
      moduleSettingsSnapshot = updated;
      setModuleSettings(updated);
    } catch {
      moduleSettingsSnapshot = s;
      setModuleSettings(s);
    }
    showToast("Module settings saved.", "success");
  };

  const handleSaveSecurity = async (s: SecuritySettings) => {
    try {
      const updated = await adminService.updateSecuritySettings(s);
      securitySettingsSnapshot = updated;
      setSecuritySettings(updated);
    } catch {
      securitySettingsSnapshot = s;
      setSecuritySettings(s);
    }
    showToast("Security settings saved.", "success");
  };

  const handleSaveOperations = async (s: OperationalSettings) => {
    try {
      const updated = await adminService.updateOperationalSettings(s);
      operationalSettingsSnapshot = updated;
      setOperationalSettings(updated);
    } catch {
      operationalSettingsSnapshot = s;
      setOperationalSettings(s);
    }
    showToast("Operational settings saved.", "success");
  };

  return (
    <div className="onfis-section">
      {/* Navbar */}
      <div className="navbar-style">
        <div className="flex items-center gap-3">
          <Icon name="tune" size={22} color="#0014A8" />
          <div>
            <h1 className="text-base font-bold text-neutral-900">System Settings</h1>
            <p className="text-xs text-neutral-500">Manage tenant, storage, and advanced platform settings</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="px-6 py-8 space-y-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-neutral-100 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="px-6 pt-4 pb-6 flex gap-5">
          {/* Sidebar tabs */}
          <div className="w-52 shrink-0 space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  activeTab === tab.id
                    ? "bg-primary/8 text-primary shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <Icon name={tab.icon} size={16} color={activeTab === tab.id ? "#0014A8" : "#62748E"} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {activeTab === "tenant" && (
              <TenantTab settings={tenantSettings} onSave={handleSaveTenant} />
            )}
            {activeTab === "storage" && (
              <StorageTab settings={storageSettings} onSave={handleSaveStorage} />
            )}
            {activeTab === "modules" && (
              <ModulesTab settings={moduleSettings} onSave={handleSaveModules} />
            )}
            {activeTab === "security" && (
              <SecurityTab settings={securitySettings} onSave={handleSaveSecurity} />
            )}
            {activeTab === "operations" && (
              <OperationsTab settings={operationalSettings} onSave={handleSaveOperations} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
