import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        {/* Left: Ring badge + copyright */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full border-2 dark:border-accent-lime border-gray-800 flex items-center justify-center flex-shrink-0">
            <span className="text-gray-800 dark:text-accent-lime font-black text-[8px] tracking-tight">360</span>
          </div>
          <span>© 2026 NCTR Alliance · Crescendo</span>
        </div>

        {/* Center: Philosophy line */}
        <p className="text-[11px] text-center opacity-70 hidden sm:block">
          Built on a simple idea: the longer you commit, the more you receive. 360LOCK is how it starts.
        </p>

        {/* Right: Links */}
        <nav className="flex items-center gap-4">
          <Link to="/help" className="hover:text-foreground transition-colors">Help</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <a
            href="https://crescendo.nctr.live"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            crescendo.nctr.live
          </a>
        </nav>
      </div>
    </footer>
  );
}
