import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function WingmanAuditPage() {
  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAudit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('wingman-crescendo-audit', {
        headers: { 'x-admin-key': adminKey },
        body: {},
      });
      if (fnError) throw fnError;
      setResult(JSON.stringify(data, null, 2));
    } catch (e: any) {
      const msg = e?.message || 'Request failed';
      setError(msg);
      if (e?.context?.body) {
        try {
          const body = typeof e.context.body === 'string' ? e.context.body : JSON.stringify(e.context.body, null, 2);
          setResult(body);
        } catch {
          // ignore
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const copyJson = () => {
    if (result) {
      navigator.clipboard.writeText(result);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-12"
      style={{ backgroundColor: '#323232', fontFamily: "'DM Sans', sans-serif" }}
    >
      <h1
        className="text-2xl md:text-3xl uppercase text-center"
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          color: '#E2FF6D',
          letterSpacing: '1px',
        }}
      >
        Wingman Memory Audit
      </h1>
      <p
        className="mt-1 text-sm text-center"
        style={{ fontFamily: "'DM Mono', monospace", color: '#5A5A58' }}
      >
        Bounty Hunter | auibudfactqhisvmiotw
      </p>

      <div className="mt-8 w-full max-w-xl space-y-4">
        <div>
          <label
            className="block text-xs mb-1"
            style={{ fontFamily: "'DM Mono', monospace", color: '#5A5A58' }}
          >
            Admin Key
          </label>
          <input
            type="password"
            placeholder="Enter GODVIEW_INGEST_KEY"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            className="w-full px-3 py-2 text-sm text-white border outline-none"
            style={{
              backgroundColor: '#1a1a1a',
              borderColor: '#5A5A58',
              borderRadius: 0,
              fontFamily: "'DM Mono', monospace",
            }}
          />
        </div>

        <button
          onClick={runAudit}
          disabled={!adminKey || loading}
          className="w-full py-2 text-sm font-bold uppercase tracking-wider disabled:opacity-40"
          style={{
            backgroundColor: '#E2FF6D',
            color: '#323232',
            borderRadius: 0,
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
          }}
        >
          {loading ? 'Running…' : 'Run Audit'}
        </button>
      </div>

      {loading && (
        <div className="mt-6 w-full max-w-3xl space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-6 animate-pulse"
              style={{ backgroundColor: '#3a3a3a', borderRadius: 0 }}
            />
          ))}
        </div>
      )}

      {error && (
        <div
          className="mt-6 w-full max-w-3xl px-4 py-3 text-sm"
          style={{
            backgroundColor: 'rgba(239,68,68,0.15)',
            border: '1px solid #ef4444',
            color: '#ef4444',
            borderRadius: 0,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 w-full max-w-3xl">
          <pre
            className="p-4 text-sm overflow-auto"
            style={{
              backgroundColor: '#1a1a1a',
              color: '#D9D9D9',
              fontFamily: "'DM Mono', monospace",
              whiteSpace: 'pre-wrap',
              maxHeight: '70vh',
              borderRadius: 0,
            }}
          >
            {result}
          </pre>
          <button
            onClick={copyJson}
            className="mt-3 px-6 py-2 text-sm font-bold uppercase tracking-wider"
            style={{
              backgroundColor: '#E2FF6D',
              color: '#323232',
              borderRadius: 0,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
            }}
          >
            Copy JSON
          </button>
        </div>
      )}
    </div>
  );
}
