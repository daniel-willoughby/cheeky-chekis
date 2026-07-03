export type ChekiType = 'pin' | 'normal' | '4-cut' | 'homework' | 'twin' | 'group' | 'grid';
export type ChekiStatus = 'on-hand' | 'on-the-way';

// Types that can feature more than one maid.
export const MULTI_MAID_TYPES: ChekiType[] = ['twin', 'group'];

export interface Cheki {
  id: string;
  ownerId: string;
  imageUrl?: string;      // public storage URL, or placeholder fallback
  maidIds: string[];      // one or more maids featured
  cafeId?: string;
  date?: string;          // ISO date the cheki was taken
  type: ChekiType;
  status: ChekiStatus;
  forSale: boolean;
  sold: boolean;          // classified as sold, awards points once
  price?: number;         // in KRW
  notes?: string;
  createdAt: number;
}

export type BinderDesign =
  | 'classic'
  | 'sakura'
  | 'midnight'
  | 'arcade'
  | 'candy';

export interface Binder {
  id: string;
  ownerId: string;
  name: string;
  design: BinderDesign;
  createdAt: number;
}

export interface Maid {
  id: string;
  name: string;
  cafeId: string;
  color: string;          // card accent
  emoji: string;          // stand-in pixel portrait
  hairColor: string;
  specialty: string;      // "the cafe's ace", card flavour
  bio: string;
}

export interface Cafe {
  id: string;
  name: string;
  district: string;       // area in Korea
  manager: string;
  color: string;
  emoji: string;
  vibe: string;           // how the cafe runs, short
  chekiPrice: number;     // base cheki price KRW
  rules: string[];        // how it runs, bullet points
}

// A friend's public profile — what you can see about someone you're
// connected with (or a search result before you've connected).
export interface PublicProfile {
  id: string;
  username: string;
  name: string;
  emoji: string;
  color: string;
  bio: string;
}

export type FriendshipStatus = 'pending' | 'accepted';

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: number;
}

export interface Profile {
  id: string;
  username: string;
  name: string;
  emoji: string;
  bio: string;
  favouriteMaidIds: string[]; // up to 3 highlighted maids
  points: number;             // Cheki Points balance
  ownedDesigns: BinderDesign[];
  lastLoginAt?: string;       // UTC date (YYYY-MM-DD) of last daily bonus
  lastSeenFriendsAt?: string; // ISO timestamp, drives the Friends tab badge
}

export const MAX_HIGHLIGHTS = 3;
