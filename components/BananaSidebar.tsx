import React, { useEffect, useRef, useState } from 'react';

interface BananaSidebarProps {
  t: (key: string, ...args: any[]) => any;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  disabled?: boolean;
}

// Use external SVG as icon logo
const BananaIcon: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <img
    src="/OpenMoji-color_1F34C.svg"
    width={size}
    height={size}
    alt="Banana logo"
    style={{
      display: 'block',
      objectFit: 'contain',
      filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.35))'
    }}
  />
);

// Create a simple SVG data URL thumbnail using the preset name
const makeSvgDataUrl = (label: string) => {
  const safe = label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<?xml version='1.0' encoding='UTF-8'?>\n` +
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='80'>\n` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#fff176'/><stop offset='100%' stop-color='#ffd54f'/></linearGradient></defs>\n` +
    `<rect width='100%' height='100%' rx='8' ry='8' fill='url(#g)'/>\n` +
    `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='system-ui, sans-serif' font-size='12' fill='#3b2f1e'>${safe}</text>\n` +
    `</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
};

export const BananaSidebar: React.FC<BananaSidebarProps> = ({ t, setPrompt, onGenerate, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const builtInPrompts = t('quickPrompts') as { name: string; value: string }[];

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleSelect = (value: string) => {
    if (disabled) return;
    setPrompt(value);
    setIsOpen(false);
    // Do not auto-generate; leave control to user.
    // Uncomment to auto-generate on click:
    // onGenerate();
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Gradient glass circle button styled like PodUI copy.html */}
      <button
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        disabled={disabled}
        aria-label="Banana Presets"
        title="Banana Presets"
        className="banana-circle"
        style={{
          position: 'relative',
          cursor: disabled ? 'not-allowed' : 'pointer',
          height: 40,
          width: 40,
          padding: 2,
          border: 0,
          borderRadius: 9999,
          background: 'linear-gradient(135deg, #ff6fb3 0%, #3ba6ff 50%, #ffb36b 100%)',
          boxShadow:
            '0 8px 24px rgba(59,166,255,0.35), 0 2px 6px rgba(0,0,0,0.25)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {/* Inner glass */}
          <span
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              borderRadius: '9999px',
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.10)',
              border: '1px solid rgba(255, 255, 255, 0.28)',
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -8px 18px rgba(59, 166, 255, 0.25)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              padding: 0,
              color: 'rgba(255,255,255,0.95)',
            }}
          >
          {/* Soft highlight sweep */}
          <span
            style={{
              content: "''",
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(-65deg, transparent 40%, rgba(255,255,255,0.45) 50%, transparent 70%)',
              backgroundSize: '200% 100%',
              backgroundRepeat: 'no-repeat',
              animation: 'banana_sheen 2.8s ease-in-out infinite',
              pointerEvents: 'none',
              borderRadius: 'inherit',
              mixBlendMode: 'screen',
            }}
          />

          {/* Gentle top rim glow */}
          <span
            style={{
              content: "''",
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(120% 60% at 50% -10%, rgba(255,255,255,0.45), transparent 55%)',
              pointerEvents: 'none',
              borderRadius: 'inherit',
            }}
          />

          {/* Icon centered for circular button */}
          <span style={{ position: 'relative', zIndex: 1 }}>
            <BananaIcon size={36} />
          </span>
        </span>
      </button>
      {/* Scoped styles for hover/active and sheen animation */}
      <style>{`
        @keyframes banana_sheen {
          0% { background-position: 130% 0; opacity: 1; }
          100% { background-position: -160% 0; opacity: 0; }
        }
        .banana-circle:hover > span {
          background: rgba(255, 255, 255, 0.13);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.5),
            inset 0 -10px 20px rgba(59,166,255,0.3);
        }
        .banana-circle:hover {
          transform: translateY(-1px);
          box-shadow:
            0 10px 28px rgba(59, 166, 255, 0.4),
            0 4px 10px rgba(0,0,0,0.28);
        }
        .banana-circle:active {
          transform: translateY(1px);
          box-shadow:
            0 6px 16px rgba(59, 166, 255, 0.28),
            0 2px 6px rgba(0,0,0,0.28);
        }
      `}</style>
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-3 w-[22rem] max-h-96 overflow-y-auto pod-panel p-2">
          <div className="grid grid-cols-3 gap-2">
            {(builtInPrompts || []).slice(0, 12).map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(item.value)}
                title={item.name}
                className="group relative w-full aspect-[3/2] rounded-md overflow-hidden pod-list-item"
                style={{ padding: 0 }}
              >
                <img src={makeSvgDataUrl(item.name)} alt={item.name} className="w-full h-full object-cover" />
                <span className="absolute left-1 top-1 text-[10px] px-1 py-[2px] rounded" style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: '#fff' }}>{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BananaSidebar;