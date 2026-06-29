import { useNavigate } from 'react-router-dom';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';

const FONT_DISPLAY = '"Barlow Condensed", sans-serif';
const FONT_SANS = '"DM Sans", sans-serif';
const FONT_MONO = '"DM Mono", monospace';

function NctrWordmark({ height = 30 }: { height?: number }) {
  const width = Math.round(height * (805 / 227));
  return (
    
      
      
      
      
    
  );
}

export default function MembershipArrival() {
  const navigate = useNavigate();
  const { tier, nextTier, progressToNextTier, total360Locked } = useUnifiedUser();

  const tierName = tier?.display_name || 'Bronze';
  const nextTierName = nextTier?.display_name;
  const isMax = !nextTier;
  const progress = Math.min(100, Math.max(0, Math.round(progressToNextTier || 0)));
  const nextThreshold = (nextTier as any)?.min_nctr_360_locked;
  const remaining = nextThreshold ? Math.max(0, Math.round(nextThreshold - (total360Locked || 0))) : 0;

  return (
    


      


        


        


          


          

CRESCENDO MEMBERSHIP



          


            EVERYTHING
YOU DO BUILDS.
          



          


            AND IT'S BUILT YOU TO {tierName}.
          



          


            Standing you own — and it grows the more you do.
          



          


            


              {isMax ? `${tierName.toUpperCase()} · HIGHEST STANDING` : `${(nextTierName || '').toUpperCase()} · ${remaining.toLocaleString()} NCTR TO GO`}
              {!isMax && {progress}%}
            


            


              


            


          



          


            EARN→COMMIT→UNLOCK
          



          navigate('/dashboard')} style={{ marginTop: 26, background: 'var(--nctr-charcoal)', color: 'var(--nctr-paper)', fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 17, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '15px 0', textAlign: 'center', border: 'none', cursor: 'pointer', borderRadius: 0, width: '100%' }}>
            ENTER CRESCENDO →
          

          


            

LIVE. EARN. RISE.


            

A rising tide, owned by everyone in it.


          


        


      


    


  );
}