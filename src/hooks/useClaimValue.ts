import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const DEFAULT_CLAIM_VALUE = 5; // $5 per claim default

export function useClaimValue() {
  const [claimValue, setClaimValue] = useState<number>(DEFAULT_CLAIM_VALUE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClaimValue = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('setting_value')
          .eq('setting_key', 'claim_value_usd')
          .single();

        if (error) {
          console.error('Error fetching claim value:', error);
          return;
        }

        if (data) {
          // Handle both string and number JSON values
          const value = typeof data.setting_value === 'string'
            ? parseFloat(data.setting_value.replace(/"/g, ''))
            : Number(data.setting_value);
          
          if (!isNaN(value) && value > 0) {
            setClaimValue(value);
          }
        }
      } catch (error) {
        console.error('Error fetching claim value:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClaimValue();
  }, []);

  // Calculate claims required for given floor amount
  const getClaimsRequired = (floorAmount: number): number => {
    if (floorAmount <= 0) return 0;
    return Math.ceil(floorAmount / claimValue);
  };

  // Calculate floor amount for given claims
  const getFloorForClaims = (claims: number): number => {
    return claims * claimValue;
  };

  return {
    claimValue,
    loading,
    getClaimsRequired,
    getFloorForClaims,
  };
}
