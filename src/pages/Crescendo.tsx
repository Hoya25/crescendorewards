import CrescendoHero from '@/components/CrescendoHero';
import TierProgressBar from '@/components/TierProgressBar';
import { useNavigate } from 'react-router-dom';

export default function Crescendo() {
  const navigate = useNavigate();

  return (
    <div>
      <CrescendoHero
        onViewRewards={() => navigate('/crescendo/rewards')}
        onLevelUp={() => navigate('/crescendo/level-up')}
      />
      <div>
        <TierProgressBar
          onLevelUp={() => navigate('/crescendo/level-up')}
          onViewPerks={() => navigate('/crescendo/perks')}
        />
      </div>
    </div>
  );
}
