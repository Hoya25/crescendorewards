interface CrescendoLogoProps {
  className?: string;
  showSubtitle?: boolean;
}

export function CrescendoLogo({ className = "" }: CrescendoLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span
        className="font-extrabold text-[#C8FF00] select-none"
        style={{ fontSize: '18px', letterSpacing: '3px' }}
      >
        CRESCENDO
      </span>
      <span
        className="block"
        style={{ width: '1px', height: '20px', backgroundColor: '#27272A' }}
        aria-hidden="true"
      />
      <span className="text-[#52525B] select-none" style={{ fontSize: '12px' }}>
        by NCTR Alliance
      </span>
    </div>
  );
}
