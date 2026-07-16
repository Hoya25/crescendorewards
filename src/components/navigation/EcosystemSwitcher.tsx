export function EcosystemSwitcher() {
  return (
    <div className="w-full flex items-center justify-center" aria-label="Ecosystem apps">
      <div className="inline-flex items-center text-[9px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.12em] font-medium">
        <a
          href="https://themall.nctr.live"
          className="px-2 md:px-3 py-1 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
        >
          THE MALL <span className="text-neutral-400 dark:text-neutral-500 font-normal">— Discover</span>
        </a>
        <span className="h-3 w-px bg-neutral-300 dark:bg-neutral-700" aria-hidden="true" />
        <a
          href="https://bountyhunter.nctr.live"
          className="px-2 md:px-3 py-1 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
        >
          BOUNTY HUNTER <span className="text-neutral-400 dark:text-neutral-500 font-normal">— Earn</span>
        </a>
        <span className="h-3 w-px bg-neutral-300 dark:bg-neutral-700" aria-hidden="true" />
        <span
          className="px-2 md:px-3 py-1 text-neutral-800 dark:text-[#E2FF6D] font-semibold"
          aria-current="page"
        >
          CRESCENDO <span className="text-neutral-500 dark:text-neutral-400 font-normal">— Status</span>
        </span>
      </div>
    </div>
  );
}
