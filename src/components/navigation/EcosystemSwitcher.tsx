import { cn } from "@/lib/utils";

interface EcosystemSwitcherProps {
  surface?: "light" | "auto";
}

export function EcosystemSwitcher({ surface = "auto" }: EcosystemSwitcherProps) {
  const lightOnly = surface === "light";

  // Contrast: names neutral-600 on light / neutral-300 on dark; roles neutral-600 / neutral-400 (all ≥4.5:1).
  const otherName = lightOnly
    ? "text-neutral-600 hover:text-neutral-800"
    : "text-neutral-600 hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-neutral-100";
  const role = lightOnly ? "text-neutral-600" : "text-neutral-600 dark:text-neutral-400";
  const divider = cn(
    "hidden md:block h-3 w-px",
    lightOnly ? "bg-neutral-300" : "bg-neutral-300 dark:bg-neutral-700"
  );
  const cell =
    "min-w-0 px-1 md:px-3 py-1 flex flex-col md:flex-row md:items-center items-center text-center md:gap-1 break-words transition-colors";

  return (
    <div className="w-full flex items-center justify-center" aria-label="Ecosystem apps">
      <div className="grid grid-cols-3 w-full md:w-auto md:flex md:items-center text-[12px] uppercase tracking-[0.06em] md:tracking-[0.12em] font-medium">
        <a href="https://themall.nctr.live" className={cn(cell, otherName)}>
          <span>THE MALL</span>
          <span className={cn("font-normal", role)}>— Discover</span>
        </a>
        <span className={divider} aria-hidden="true" />
        <a href="https://bountyhunter.nctr.live" className={cn(cell, otherName)}>
          <span>BOUNTY HUNTER</span>
          <span className={cn("font-normal", role)}>— Earn</span>
        </a>
        <span className={divider} aria-hidden="true" />
        <span
          className={cn(
            cell,
            "font-semibold",
            lightOnly ? "text-neutral-800" : "text-neutral-800 dark:text-[#E2FF6D]"
          )}
          aria-current="page"
        >
          <span className="inline-flex items-center gap-2 flex-wrap justify-center">
            CRESCENDO
            <span
              className={cn(
                "text-[12px] leading-none px-2 py-0.5 border",
                "font-['Barlow_Condensed',_sans-serif] tracking-wider font-semibold",
                lightOnly
                  ? "text-[#5A5A58] border-[rgba(90,90,88,0.3)] bg-transparent"
                  : "text-[#5A5A58] border-[rgba(90,90,88,0.3)] bg-transparent dark:text-[#E2FF6D] dark:border-[rgba(226,255,109,0.35)]"
              )}
            >
              BETA
            </span>
          </span>
          <span className={cn("font-normal", role)}>— Status</span>
        </span>
      </div>
    </div>
  );
}
