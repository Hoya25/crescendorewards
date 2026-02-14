interface CrescendoLogoProps {
  className?: string;
  showSubtitle?: boolean;
}

export function CrescendoLogo({ className = "" }: CrescendoLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span
        className="font-extrabold text-[#323232] dark:text-[#E2FF6D] select-none"
        style={{ fontSize: '18px', letterSpacing: '3px' }}
      >
        CRESCENDO
      </span>
      <span
        className="block"
        style={{ width: '1px', height: '20px', backgroundColor: '#27272A' }}
        aria-hidden="true"
      />
      <img
        src="/brands/nctr-alliance-grey.png"
        alt="by NCTR Alliance"
        className="h-5 select-none opacity-60"
      />
    </div>
  );
}
