import { useState, useEffect, useRef } from "react";
import { useTenantSettings } from "../../../contexts/TenantSettingsContext";

interface WelcomeStepProps {
  onNext: () => void;
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  const { logoUrl, companyName } = useTenantSettings();
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [showButton, setShowButton] = useState(false);
  const [particles] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 4,
    }))
  );

  const fullLine1 = "Chào mừng bạn đến với ONFIS";
  const fullLine2 = "Hãy cùng thiết lập không gian làm việc cho doanh nghiệp của bạn";
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const speed = 55;

    // Type line 1
    for (let i = 0; i <= fullLine1.length; i++) {
      const t = setTimeout(() => setLine1(fullLine1.slice(0, i)), i * speed);
      timeoutRefs.current.push(t);
    }

    // Pause then type line 2
    const pauseAt = fullLine1.length * speed + 600;
    for (let i = 0; i <= fullLine2.length; i++) {
      const t = setTimeout(() => setLine2(fullLine2.slice(0, i)), pauseAt + i * speed);
      timeoutRefs.current.push(t);
    }

    // Show button after all typing
    const btnT = setTimeout(
      () => setShowButton(true),
      pauseAt + fullLine2.length * speed + 400
    );
    timeoutRefs.current.push(btnT);

    return () => timeoutRefs.current.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex h-full w-full">
      {/* Left Half — Text */}
      <div className="w-1/2 flex flex-col justify-center px-24 lg:px-32 relative z-10">
        <div className="max-w-lg mx-auto">
          <h1
            className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6"
            style={{ minHeight: "3.5rem" }}
          >
            {line1}
            {line1.length < fullLine1.length && (
              <span className="animate-pulse text-blue-400">|</span>
            )}
          </h1>

          {line2.length > 0 && (
            <p
              className="text-lg md:text-xl text-blue-200/80 leading-relaxed mb-10"
              style={{ minHeight: "2rem" }}
            >
              {line2}
              {line2.length < fullLine2.length && (
                <span className="animate-pulse text-blue-400">|</span>
              )}
            </p>
          )}

          <div
            className={`transition-all duration-700 ease-out ${showButton
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
              }`}
          >
            <button
              type="button"
              onClick={onNext}
              className="group relative px-10 py-4 rounded-xl text-white font-semibold text-lg
                         bg-gradient-to-r from-blue-600 to-indigo-600
                         hover:from-blue-500 hover:to-indigo-500
                         shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-500/40
                         transition-all duration-300 ease-out
                         hover:-translate-y-0.5 active:translate-y-0"
            >
              <span className="relative z-10 flex items-center gap-2">
                Bắt đầu
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="transition-transform group-hover:translate-x-1">
                  <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Half — Logo + Particles */}
      <div className="w-1/2 flex items-center justify-center relative overflow-hidden">
        {/* Floating particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-blue-400/20"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: `${p.x}%`,
              top: `${p.y}%`,
              animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
            }}
          />
        ))}

        {/* Glow effect */}
        <div className="absolute w-80 h-80 rounded-full bg-blue-500/10 blur-[80px]" />
        <div className="absolute w-60 h-60 rounded-full bg-indigo-500/15 blur-[60px] translate-x-10 translate-y-10" />

        {/* Logo */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="w-32 h-32 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={companyName || 'Company Logo'}
                className="w-24 h-24 rounded-2xl object-contain drop-shadow-lg"
              />
            ) : (
              <img
                src="/src/assets/logowhite.svg"
                alt="ONFIS"
                className="w-20 h-20 drop-shadow-lg"
              />
            )}
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white tracking-wide">{companyName || 'ONFIS'}</h2>
            <p className="text-sm text-blue-300/60 tracking-widest uppercase mt-1">Enterprise Platform</p>
          </div>
        </div>
      </div>

      {/* Float animation keyframes */}
      <style>{`
        @keyframes float {
          from { transform: translateY(0) translateX(0); opacity: 0.3; }
          to { transform: translateY(-20px) translateX(10px); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
