import { motion } from 'framer-motion';

const ACCENT = '#E2FF6D';
const MID_GREY = '#5A5A58';

export function StepContribute() {
  return (
    <div className="text-center space-y-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-5xl"
      >
        🎁
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-white"
      >
        You can list rewards too
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-sm max-w-sm mx-auto"
        style={{ color: '#ccc' }}
      >
        There are two ways to participate in NCTR Alliance:
      </motion.p>

      <div className="space-y-2 text-left">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl px-4 py-3"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <p className="text-sm font-semibold text-white mb-1">Collect</p>
          <p className="text-xs" style={{ color: MID_GREY }}>
            Earn NCTR through actions, and lock what you earn to climb status tiers and unlock rewards.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl px-4 py-3"
          style={{
            background: `${ACCENT}12`,
            border: `1px solid ${ACCENT}33`,
          }}
        >
          <p className="text-sm font-semibold text-white mb-1">Contribute</p>
          <p className="text-xs" style={{ color: MID_GREY }}>
            List your own rewards for other members to claim. Earn NCTR each time someone claims your reward.
          </p>
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-xs max-w-sm mx-auto"
        style={{ color: MID_GREY }}
      >
        Find "List a Reward" in the sidebar whenever you have something to offer.
      </motion.p>
    </div>
  );
}

export default StepContribute;
