import { useState } from "react";

interface InviteTeamStepProps {
  emails: string[];
  onUpdate: (emails: string[]) => void;
  onSubmit: () => void;
  onSkip: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function InviteTeamStep({ emails, onUpdate, onSubmit, onSkip, onBack, isSubmitting }: InviteTeamStepProps) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");

  const parseAndAddEmails = () => {
    const raw = inputValue
      .split(/[,\n;]/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const valid: string[] = [];
    const invalid: string[] = [];

    for (const email of raw) {
      if (!isValidEmail(email)) {
        invalid.push(email);
      } else if (!emails.includes(email)) {
        valid.push(email);
      }
    }

    if (invalid.length > 0) {
      setError(`Email không hợp lệ: ${invalid.join(", ")}`);
      return;
    }

    if (valid.length > 0) {
      onUpdate([...emails, ...valid]);
      setInputValue("");
      setError("");
    }
  };

  const removeEmail = (email: string) => {
    onUpdate(emails.filter((e) => e !== email));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      parseAndAddEmails();
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Mời Đội ngũ</h2>
        <p className="text-blue-200/60 text-sm">
          Nhập email cá nhân của các thành viên. Hệ thống sẽ gửi lời mời qua email.
        </p>
      </div>

      {/* Email input area */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-blue-100">Email thành viên</label>
        <textarea
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setError(""); }}
          onKeyDown={handleKeyDown}
          placeholder={"nguyenvana@gmail.com\ntranthib@gmail.com\nlethic@gmail.com"}
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/25 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all resize-none"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/30">Nhập mỗi email một dòng, hoặc phân cách bằng dấu phẩy</p>
          <button
            type="button"
            onClick={parseAndAddEmails}
            className="px-5 py-2 rounded-lg bg-white/10 border border-white/20 text-sm text-white font-medium hover:bg-white/15 transition-all"
          >
            + Thêm
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      {/* Email list */}
      {emails.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-100">
              Danh sách mời ({emails.length} người)
            </span>
            <button
              type="button"
              onClick={() => onUpdate([])}
              className="text-xs text-red-400/70 hover:text-red-400 transition-colors"
            >
              Xóa tất cả
            </button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-[25vh] overflow-y-auto pr-1 custom-scrollbar">
            {emails.map((email) => (
              <span
                key={email}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-sm text-emerald-200"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400/60">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                {email}
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  className="text-emerald-400/40 hover:text-red-400 transition-colors ml-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <button type="button" onClick={onBack} className="px-6 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm font-medium">
          ← Quay lại
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onSkip}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all text-sm font-medium disabled:opacity-50"
          >
            Bỏ qua
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="px-8 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
                </svg>
                Đang xử lý...
              </>
            ) : (
              <>
                {emails.length > 0 ? "Gửi lời mời & Hoàn tất" : "Hoàn tất thiết lập"}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3.5 8L6.5 11L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
