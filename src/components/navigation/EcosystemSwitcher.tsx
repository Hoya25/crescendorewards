import { cn } from "@/lib/utils";

interface EcosystemSwitcherProps {
  surface?: "light" | "auto";
}

export function EcosystemSwitcher({ surface = "auto" }: EcosystemSwitcherProps) {
  const lightOnly = surface === "light";

  return (
    <div className="w-full flex items-center justify-center overflow-x-auto" aria-label="Ecosystem apps">
      <div className="inline-flex items-center text-[9px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.12em] font-medium">
        <a
          href="https://themall.nctr.live"
          className={cn(
            "px-2 md:px-3 py-1 transition-colors whitespace-nowrap",
            lightOnly
              ? "text-neutral-500 hover:text-neutral-700"
              : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          )}
        >
          THE MALL <span className="text-neutral-400 font-normal">— Discover</span>
        </a>
        <span
          className={cn(
            "h-3 w-px shrink-0",
            lightOnly ? "bg-neutral-300" : "bg-neutral-300 dark:bg-neutral-700"
          )}
          aria-hidden="true"
        />
        <a
          href="https://bountyhunter.nctr.live"
          className={cn(
            "px-2 md:px-3 py-1 transition-colors whitespace-nowrap",
            lightOnly
              ? "text-neutral-500 hover:text-neutral-700"
              : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          )}
        >
          BOUNTY HUNTER <span className="text-neutral-400 font-normal">— Earn</span>
        </a>
        <span
          className={cn(
            "h-3 w-px shrink-0",
            lightOnly ? "bg-neutral-300" : "bg-neutral-300 dark:bg-neutral-700"
          )}
          aria-hidden="true"
        />
        <span
          className={cn(
            "px-2 md:px-3 py-1 font-semibold whitespace-nowrap",
            lightOnly ? "text-neutral-800" : "text-neutral-800 dark:text-[#E2FF6D]"
          )}
          aria-current="page"
        >
          CRESCENDO <span className="text-neutral-500 font-normal">— Status</span>
        </span>
      </div>
    </div>
  );
}
