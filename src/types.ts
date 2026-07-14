export type ChekiType = 'regular' | 'pin' | '4-cut' | 'homework' | 'twin' | 'group' | 'grid';
export type ChekiStatus = 'on-hand' | 'on-the-way';

// Types that can feature more than one maid.
export const MULTI_MAID_TYPES: ChekiType[] = ['twin', 'group', 'homework', '4-cut'];

export interface Cheki {
  id: string;
  ownerId: string;
  imageUrl?: string;      // public storage URL, or placeholder fallback
  maidIds: string[];      // one or more maids featured
  cafeId?: string;        // primary cafe (for pricing/labels)
  cafeIds: string[];      // all cafes involved (multi-cafe twin/group/4-cut)
  gridCount?: number;     // for grid chekis: how many chekis the grid contains
  date?: string;          // ISO date the cheki was taken
  type: ChekiType;
  status: ChekiStatus;
  forSale: boolean;
  sold: boolean;          // classified as sold, awards points once
  price?: number;         // in KRW
  notes?: string;
  settlementOf?: string;  // parent cheki id, if this is a settlement photo
  receivedFrom?: string;  // friend's profile id, if received via sold-to-friend transfer
  transferPendingTo?: string; // friend's profile id, if a sold-to-friend transfer is awaiting their accept
  createdAt: number;
}

export type BinderDesign =
  | 'classic'
  | 'pastel-pink'
  | 'pastel-blue'
  | 'lilac'
  | 'butterfly'
  | 'cheki-secret'
  | 'cloud'
  | 'cross'
  | 'gingham'
  | 'lemonade'
  | 'crush'
  | 'matcha-bunny'
  | 'skull';

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
  imageUrl?: string;      // uploaded portrait photo
  hairColor: string;
  specialty: string;      // "the cafe's ace", card flavour
  bio: string;
  graduated: boolean;     // greyed out, kept for classifying past chekis
}

export interface Cafe {
  id: string;
  name: string;
  district: string;       // area in Korea
  manager: string;
  color: string;
  emoji: string;
  imageUrl?: string;      // uploaded cafe photo
  vibe: string;           // how the cafe runs, short
  chekiPrice: number;     // base cheki price KRW
  typePrices: Partial<Record<ChekiType, number>>; // price per cheki type
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
  avatarUrl?: string;
  bio: string;
  favouriteMaidIds: string[];
  isAdmin: boolean;
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
  avatarUrl?: string;
  bio: string;
  favouriteMaidIds: string[]; // up to 3 highlighted maids
  points: number;             // Cheki Points balance
  ownedDesigns: BinderDesign[];
  isAdmin: boolean;           // can add/edit/delete cafes & maids
  lastLoginAt?: string;       // UTC date (YYYY-MM-DD) of last daily bonus
  lastSeenFriendsAt?: string; // ISO timestamp, drives the Friends tab badge
}

export const MAX_HIGHLIGHTS = 3;
