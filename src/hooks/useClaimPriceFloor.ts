import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const DEFAULT_PRICE_FLOOR = 4; // $4 per claim default

export function useClaimPriceFloor() {
  const [priceFloor, setPriceFloor] = useState<number>(DEFAULT_PRICE_FLOOR);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPriceFloor = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('setting_value')
          .eq('setting_key', 'claim_price_floor')
          .single();

        if (error) {
          console.error('Error fetching price floor:', error);
          return;
        }

        if (data) {
          // Handle both string and number JSON values
          const value = typeof data.setting_value === 'string'
            ? parseFloat(data.setting_value.replace(/"/g, ''))
            : Number(data.setting_value);
          
          if (!isNaN(value) && value > 0) {
            setPriceFloor(value);
          }
        }
      } catch (error) {
        console.error('Error fetching price floor:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPriceFloor();
  }, []);

  // Calculate minimum amount needed for given claims
  const getMinimumAmountForClaims = (claims: number): number => {
    return Math.ceil(claims * priceFloor);
  };

  // Calculate maximum claims for given amount
  const getMaxClaimsForAmount = (amount: number): number => {
    return Math.floor(amount / priceFloor);
  };

  // Validate if an amount is valid for the requested claims
  const isValidPurchase = (amount: number, claims: number): boolean => {
    return amount >= claims * priceFloor;
  };

  return {
    priceFloor,
    loading,
    getMinimumAmountForClaims,
    getMaxClaimsForAmount,
    isValidPurchase,
  };
}
