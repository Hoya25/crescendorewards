import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const DISMISSED_KEY = 'crescendo_beta_banner_dismissed';

export function LandingBetaBanner() {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    setIsDismissed(localStorage.getItem(DISMISSED_KEY) === 'true');
  }, []);

  if (isDismissed) return null;

  return (
    <div
      style={{
        backgroundColor: '#EEEEEC',
        borderLeft: '3px solid #323232',
        padding: '10px 16px',
        position: 'relative',
      }}
    >
      <div className="container mx-auto flex items-center gap-3">
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            color: '#323232',
            margin: 0,
          }}
        >
          <strong>Crescendo Beta</strong> — Help us improve. Share feedback anytime. Your feedback shapes the future.
        </p>
        <button
          onClick={() => {
            localStorage.setItem(DISMISSED_KEY, 'true');
            setIsDismissed(true);
          }}
          aria-label="Dismiss"
          className="ml-auto flex-shrink-0 no-min-touch"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#323232',
            padding: '4px',
          }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
