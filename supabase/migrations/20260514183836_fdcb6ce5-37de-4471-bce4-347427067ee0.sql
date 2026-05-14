-- v15 reconciliation: align status_tiers.earning_multiplier with Registry-canonical values
-- Per OPUS HANDOFF v15 §4.5
UPDATE status_tiers SET earning_multiplier = 1.1 WHERE tier_name = 'bronze';
UPDATE status_tiers SET earning_multiplier = 1.3 WHERE tier_name = 'silver';
-- gold, platinum, diamond unchanged (1.5 / 1.8 / 2.5)