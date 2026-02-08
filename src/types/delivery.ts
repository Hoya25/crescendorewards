export type DeliveryMethod = 
  | 'instant_code'
  | 'email'
  | 'wallet_transfer'
  | 'shipping'
  | 'platform_delivery'
  | 'scheduling'
  | 'manual';

export type RequiredDataField = 
  | 'email'
  | 'phone'
  | 'shipping_address'
  | 'wallet_address'
  | 'twitter_handle'
  | 'instagram_handle'
  | 'tiktok_handle'
  | 'kick_username'
  | 'discord_username'
  | 'telegram_handle'
  | 'youtube_channel';

export interface UserDeliveryProfile {
  id: string;
  user_id: string;
  email?: string;
  phone?: string;
  shipping_name?: string;
  shipping_address_line1?: string;
  shipping_address_line2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: string;
  shipping_country?: string;
  wallet_address?: string;
  twitter_handle?: string;
  instagram_handle?: string;
  tiktok_handle?: string;
  kick_username?: string;
  discord_username?: string;
  telegram_handle?: string;
  youtube_channel?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DeliveryFieldConfig {
  field: RequiredDataField;
  label: string;
  placeholder: string;
  icon: string;
  validation?: RegExp;
  type?: 'text' | 'email' | 'tel';
}

export const DELIVERY_FIELD_CONFIGS: Record<RequiredDataField, DeliveryFieldConfig> = {
  email: { 
    field: 'email', 
    label: 'Email Address', 
    placeholder: 'you@example.com', 
    icon: 'Mail',
    type: 'email',
    validation: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  phone: { 
    field: 'phone', 
    label: 'Phone Number', 
    placeholder: '+1 (555) 123-4567', 
    icon: 'Phone',
    type: 'tel'
  },
  shipping_address: { 
    field: 'shipping_address', 
    label: 'Shipping Address', 
    placeholder: '', 
    icon: 'MapPin' 
  },
  wallet_address: { 
    field: 'wallet_address', 
    label: 'Base Wallet Address', 
    placeholder: '0x...', 
    icon: 'Wallet',
    validation: /^0x[a-fA-F0-9]{40}$/
  },
  twitter_handle: { 
    field: 'twitter_handle', 
    label: 'X (Twitter) Handle', 
    placeholder: '@username', 
    icon: 'Twitter',
    validation: /^@?[A-Za-z0-9_]{1,15}$/
  },
  instagram_handle: { 
    field: 'instagram_handle', 
    label: 'Instagram Handle', 
    placeholder: '@username', 
    icon: 'Instagram',
    validation: /^@?[A-Za-z0-9_.]{1,30}$/
  },
  tiktok_handle: { 
    field: 'tiktok_handle', 
    label: 'TikTok Handle', 
    placeholder: '@username', 
    icon: 'Video',
    validation: /^@?[A-Za-z0-9_.]{1,24}$/
  },
  kick_username: { 
    field: 'kick_username', 
    label: 'Kick Username', 
    placeholder: 'username', 
    icon: 'Zap',
    validation: /^[A-Za-z0-9_]{3,25}$/
  },
  discord_username: { 
    field: 'discord_username', 
    label: 'Discord Username', 
    placeholder: 'username', 
    icon: 'MessageCircle',
    validation: /^.{2,32}$/
  },
  telegram_handle: { 
    field: 'telegram_handle', 
    label: 'Telegram Handle', 
    placeholder: '@username', 
    icon: 'Send',
    validation: /^@?[A-Za-z0-9_]{5,32}$/
  },
  youtube_channel: { 
    field: 'youtube_channel', 
    label: 'YouTube Channel', 
    placeholder: '@channel', 
    icon: 'Youtube'
  },
};

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, { label: string; description: string }> = {
  instant_code: { 
    label: 'Instant Code', 
    description: 'Code shown immediately after claim' 
  },
  email: { 
    label: 'Email Delivery', 
    description: 'Details sent via email' 
  },
  wallet_transfer: { 
    label: 'Wallet Transfer', 
    description: 'Sent to crypto wallet' 
  },
  shipping: { 
    label: 'Physical Shipping', 
    description: 'Mailed to address' 
  },
  platform_delivery: { 
    label: 'Platform Delivery', 
    description: 'Sent to social/gaming account' 
  },
  scheduling: { 
    label: 'Scheduling', 
    description: 'User books a time slot' 
  },
  manual: { 
    label: 'Manual Fulfillment', 
    description: 'Admin fulfills manually' 
  },
};

export const DELIVERY_METHOD_REQUIRED_FIELDS: Record<DeliveryMethod, RequiredDataField[]> = {
  instant_code: ['email'],
  email: ['email'],
  wallet_transfer: ['email', 'wallet_address'],
  shipping: ['email', 'phone', 'shipping_address'],
  platform_delivery: ['email'],
  scheduling: ['email', 'phone'],
  manual: ['email'],
};
