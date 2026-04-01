import { useNctrMarketPrice } from '@/utils/useNctrMarketPrice';

interface NctrMarketReferenceProps {
  nctrAmount: number;
}

export function NctrMarketReference({ nctrAmount }: NctrMarketReferenceProps) {
  const { price } = useNctrMarketPrice();

  if (!price || !nctrAmount || nctrAmount <= 0) return null;

  const totalUsd = price * nctrAmount;

  const fmtPrice = price < 0.01
    ? `$${price.toFixed(4)}`
    : price < 1
      ? `$${price.toFixed(3)}`
      : `$${price.toFixed(2)}`;

  const fmtTotal = totalUsd < 1
    ? `~$${totalUsd.toFixed(2)}`
    : `~$${Math.round(totalUsd).toLocaleString()}`;

  return (
    <p
      style={{
        fontFamily: 'var(--font-mono, "DM Mono", monospace)',
        fontSize: '11px',
        lineHeight: 1.4,
        color: '#5A5A58',
        margin: 0,
      }}
    >
      Secondary market: ~{fmtPrice} · {fmtTotal}
    </p>
  );
}
