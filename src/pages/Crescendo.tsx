import CrescendoHero from '@/components/CrescendoHero';
import TierProgressBar from '@/components/TierProgressBar';
import { useNavigate } from 'react-router-dom';
import { useNCTR } from '@/context/NCTRContext';

export default function Crescendo() {
  const navigate = useNavigate();
  const { balance, lockedBalance, setBalance } = useNCTR();

  return (
    <div>
      <CrescendoHero
        currentBalance={balance}
        onViewRewards={() => navigate('/crescendo/rewards')}
        onLevelUp={() => navigate('/crescendo/level-up')}
      />
      <div>
        <TierProgressBar
          balance={balance}
          lockedBalance={lockedBalance}
          onLevelUp={() => navigate('/crescendo/level-up')}
          onViewPerks={() => navigate('/crescendo/perks')}
        />
      </div>
      <button
        onClick={() => setBalance(7500)}
        style={{ display: 'block', margin: '2rem auto', padding: '12px 32px', background: 'var(--color-accent)', color: '#323232', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '13px', letterSpacing: '0.07em', textTransform: 'uppercase' as const, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Test: Set Balance to 7,500 NCTR
      </button>
    </div>
  );
}
