import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CrescendoLogo } from './CrescendoLogo';
import { NCTRLogo } from './NCTRLogo';
import { Twitter, MessageCircle, Mail, Database, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase, SUPABASE_URL } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface SyncStatus {
  lastSync: Date | null;
  status: 'success' | 'error' | 'unknown';
  created: number;
  updated: number;
}

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  useEffect(() => {
    const fetchLastSync = async () => {
      try {
        // Try to fetch sync status - this table may not exist yet
        const { data, error } = await supabase
          .from('cross_platform_activity_log')
          .select('created_at, action_data')
          .eq('action_type', 'profile_sync')
          .eq('platform', 'crescendo')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          // Table might not exist - fail silently
          setSyncStatus({ lastSync: null, status: 'unknown', created: 0, updated: 0 });
          return;
        }

        if (data) {
          const actionData = data.action_data as any;
          setSyncStatus({
            lastSync: new Date(data.created_at),
            status: actionData?.errors > 0 ? 'error' : 'success',
            created: actionData?.created || 0,
            updated: actionData?.updated || 0,
          });
        } else {
          setSyncStatus({ lastSync: null, status: 'unknown', created: 0, updated: 0 });
        }
      } catch (error) {
        // Silently handle errors - table may not exist
        setSyncStatus({ lastSync: null, status: 'unknown', created: 0, updated: 0 });
      }
    };

    fetchLastSync();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchLastSync, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Left: Logo and NCTR Alliance */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <CrescendoLogo className="h-8 w-auto" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Part of</span>
              <NCTRLogo size="sm" />
              <span>Alliance</span>
            </div>
          </div>

          {/* Center: Navigation Links */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link 
              to="/rewards" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Rewards
            </Link>
            <Link 
              to="/help" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Help & FAQ
            </Link>
            <Link 
              to="/terms" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link 
              to="/privacy" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <a 
              href="mailto:support@crescendo.nctr.live" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </nav>

          {/* Right: Social Icons */}
          <div className="flex justify-center md:justify-end gap-4">
            <a
              href="https://twitter.com/NCTRAlliance"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Twitter/X"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="https://discord.gg/lovable-dev"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Discord"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
            <a
              href="mailto:support@crescendo.nctr.live"
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>© {currentYear} Crescendo Opportunity & Rewards Marketplace. All rights reserved.</p>
          <p className="mt-1 text-xs">
            Beta version — Building the future of member-owned rewards.
          </p>
          
          {/* Debug: Connection & Sync Status Indicator */}
          <div className="mt-3 pt-3 border-t border-dashed border-muted-foreground/20">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {/* Database Connection */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-xs font-mono">
                <Database className="w-3 h-3" />
                <span className="text-muted-foreground">DB:</span>
                <span className={SUPABASE_URL.includes('rndivcsonsojgelzewkb') ? 'text-accent-foreground' : 'text-destructive'}>
                  {SUPABASE_URL.includes('rndivcsonsojgelzewkb') ? 'The Garden' : 'Lovable Cloud'}
                </span>
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" title="Connected" />
              </div>
              
              {/* Sync Status */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-xs font-mono">
                <RefreshCw className="w-3 h-3" />
                <span className="text-muted-foreground">Sync:</span>
                {syncStatus?.lastSync ? (
                  <>
                    {syncStatus.status === 'success' ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : syncStatus.status === 'error' ? (
                      <AlertCircle className="w-3 h-3 text-destructive" />
                    ) : null}
                    <span 
                      className="text-foreground" 
                      title={`Last sync: ${syncStatus.lastSync.toLocaleString()}\nCreated: ${syncStatus.created}, Updated: ${syncStatus.updated}`}
                    >
                      {formatDistanceToNow(syncStatus.lastSync, { addSuffix: true })}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Never</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
