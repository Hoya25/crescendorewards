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
      <span
        style={{
          fontSize: '9px',
          letterSpacing: '1px',
          color: '#5A5A58',
          border: '1px solid rgba(90,90,88,0.3)',
          backgroundColor: 'transparent',
          padding: '2px 8px',
          borderRadius: '0px',
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 600,
        }}
        className="select-none"
      >
        BETA
      </span>
    </div>
  );
}
