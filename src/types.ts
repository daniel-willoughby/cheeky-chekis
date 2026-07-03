export type ChekiType = 'pin' | 'normal' | '4-cut' | 'homework' | 'twin' | 'group' | 'grid';
export type ChekiStatus = 'on-hand' | 'on-the-way';

// Types that can feature more than one maid.
export const MULTI_MAID_TYPES: ChekiType[] = ['twin', 'group'];

export interface Cheki {
  id: string;
  ownerId: string;        // 'me' or a friend id
  image: Blob | null;     // stored image data
  imageUrl?: string;      // fallback seed art (data URI / path)
  maidIds: string[];      // one or more maids featured
  cafeId?: string;
  date?: string;          // ISO date the cheki was taken
  type: ChekiType;
  status: ChekiStatus;
  forSale: boolean;
  sold: boolean;          // classified as sold, awards points once
  price?: number;         // in KRW
  binderIds: string[];
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
  chekiIds: string[];
  system?: 'sales';       // the shared for-sale binder
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
  maidIds: string[];
}

export interface Friend {
  id: string;
  name: string;
  emoji: string;
  color: string;
  bio?: string;
}

// A notification that a friend uploaded new chekis. Read-only, not filed into
// your own binders.
export interface ShareEvent {
  id: string;
  fromFriendId: string;
  chekiIds: string[];     // the friend's own chekis
  message?: string;
  createdAt: number;
  seen: boolean;
}

export interface Profile {
  id: 'me';
  name: string;
  emoji: string;
  bio: string;
  favouriteMaidIds: string[]; // up to 3 highlighted maids
  points: number;             // Cheki Points balance
  ownedDesigns: BinderDesign[];
  lastLoginAt?: string;       // UTC date (YYYY-MM-DD) of last daily bonus
}

export const MAX_HIGHLIGHTS = 3;
