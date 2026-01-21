export interface ClaimGift {
  id: string;
  sender_id?: string;
  recipient_id?: string;
  recipient_email?: string;
  claims_amount: number;
  message?: string;
  gift_code: string;
  status: 'pending' | 'claimed' | 'expired' | 'cancelled';
  purchased_package_id?: string;
  is_purchased: boolean;
  is_admin_gift: boolean;
  admin_notes?: string;
  expires_at: string;
  claimed_at?: string;
  created_at: string;
  sender?: {
    id: string;
    display_name: string;
    avatar_url?: string;
    email?: string;
  };
  recipient?: {
    id: string;
    display_name: string;
    email?: string;
    avatar_url?: string;
  };
}

export interface AdminGiftOptions {
  recipientId?: string;
  recipientEmail?: string;
  claimsAmount: number;
  message?: string;
  adminNotes?: string;
  instantCredit: boolean;
}

export interface GiftStats {
  total_gifts: number;
  total_claims_gifted: number;
  pending_gifts: number;
  claimed_gifts: number;
  expired_gifts: number;
  admin_gifts: number;
  user_gifts: number;
  admin_claims_gifted: number;
  user_claims_gifted: number;
}

export interface GiftFilters {
  status?: 'pending' | 'claimed' | 'expired' | 'cancelled' | 'all';
  type?: 'admin' | 'user' | 'all';
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
