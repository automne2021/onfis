import { useState } from "react";
import { supabase } from "../../../services/supabaseClient";

interface ChangePasswordStepProps {
  onComplete: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export default function ChangePasswordStep({ onComplete, onBack, isSubmitting }: ChangePasswordStepProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setChanging(true);
    try {
      const { error: supabaseError } = await supabase.auth.updateUser({
        password,
      });

      if (supabaseError) {
        setError(supabaseError.message);
        return;
      }

      onComplete();
    } catch (err) {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setChanging(false);
    }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm text-neutral-800 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all";

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Đổi mật khẩu</h2>
        <p className="text-sm text-neutral-500">
          Mật khẩu mặc định là <span className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-700">123456</span>. 
          Hãy đổi mật khẩu để bảo mật tài khoản.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-neutral-600 mb-1 block">
            Mật khẩu mới <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            className={inputCls}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-600 mb-1 block">
            Xác nhận mật khẩu <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            className={inputCls}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu"
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>
            {error}
          </div>
        )}

        {/* Password strength indicator */}
        {password.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    password.length >= i * 3
                      ? password.length >= 12
                        ? "bg-green-500"
                        : password.length >= 8
                        ? "bg-yellow-500"
                        : "bg-red-400"
                      : "bg-neutral-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-neutral-500">
              {password.length < 6
                ? "Quá ngắn"
                : password.length < 8
                ? "Yếu"
                : password.length < 12
                ? "Khá tốt"
                : "Mạnh"}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
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
          onClick={handleSubmit}
          disabled={changing || isSubmitting}
          className="px-8 py-2.5 rounded-xl text-white text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/20 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {changing || isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Đang xử lý...
            </span>
          ) : (
            "Hoàn thành ✓"
          )}
        </button>
      </div>
    </div>
  );
}
