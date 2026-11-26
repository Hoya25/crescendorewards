import { useLayoutEffect, useRef, useState } from 'react';
import { NCTRLogo } from '@/components/NCTRLogo';

interface InlineNctrMarkProps {
  surface: 'light' | 'dark';
}

/** Inline NCTR wordmark sized to 0.72em of the surrounding text, sitting on the baseline. */
export function InlineNctrMark({ surface }: InlineNctrMarkProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [height, setHeight] = useState(12);

  useLayoutEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;
    const fs = parseFloat(window.getComputedStyle(parent).fontSize);
    if (fs > 0) setHeight(Math.round(fs * 0.72));
  }, []);

  return (
    <span ref={ref} style={{ display: 'inline' }}>
      <NCTRLogo
        variant={surface === 'dark' ? 'wordmark-lime' : 'wordmark-black'}
        height={height}
        style={{ verticalAlign: 'baseline', marginLeft: 0, marginRight: 0, position: 'relative', top: '0.02em' }}
      />
    </span>
  );
}
