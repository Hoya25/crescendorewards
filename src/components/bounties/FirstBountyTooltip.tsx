import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FirstBountyTooltipProps {
  show: boolean;
}

export function FirstBountyTooltip({ show }: FirstBountyTooltipProps) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [show]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          onClick={() => setVisible(false)}
          className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full z-20 w-64 cursor-pointer"
        >
          <div className="rounded-lg px-3 py-2 text-xs font-medium text-black shadow-lg"
               style={{ backgroundColor: 'hsl(var(--accent-lime))' }}>
            🎯 This is your first bounty! Complete the task and choose 360LOCK to earn 3x the reward.
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2"
                 style={{ backgroundColor: 'hsl(var(--accent-lime))' }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
