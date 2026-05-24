import { useLiveEngines, type EngineMirrorRow } from '@/hooks/useEngineRegistry';

interface EngineFilterChipsProps {
  selected: string | null;
  onSelect: (engineSlug: string | null) => void;
}

/**
 * Renders one chip per live Engine, plus an "All" chip when at least one
 * live engine exists. Renders NOTHING when no engines are live — this is
 * required: no filter UI until Engines actually launch.
 */
export function EngineFilterChips({ selected, onSelect }: EngineFilterChipsProps) {
  const { data: engines = [], isLoading } = useLiveEngines();

  if (isLoading) return null;
  if (engines.length === 0) return null;

  const chip = (active: boolean, color?: string | null): React.CSSProperties => ({
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '6px 12px',
    border: `1px solid ${active ? (color || '#131313') : '#5A5A58'}`,
    backgroundColor: active ? (color || '#131313') : 'transparent',
    color: active ? '#F5F4F0' : '#131313',
    borderRadius: 0,
    cursor: 'pointer',
    transition: 'all 150ms ease',
  });

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button
        type="button"
        style={chip(selected === null)}
        onClick={() => onSelect(null)}
      >
        All Engines
      </button>
      {engines.map((e: EngineMirrorRow) => (
        <button
          key={e.id}
          type="button"
          style={chip(selected === e.id, e.primary_color)}
          onClick={() => onSelect(e.id)}
        >
          {e.display_name}
        </button>
      ))}
    </div>
  );
}
