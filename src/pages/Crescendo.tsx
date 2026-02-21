import CrescendoHero from '@/components/CrescendoHero';
import TierProgressBar from '@/components/TierProgressBar';
import { useNavigate } from 'react-router-dom';
import { useNCTR } from '@/context/NCTRContext';

export default function Crescendo() {
  const navigate = useNavigate();
  const { balance, lockedBalance } = useNCTR();

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
    </div>
  );
}
