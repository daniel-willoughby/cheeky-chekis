import { db } from './db';
import { REAL_CHEKIS } from './chekiArt';
import type {
  Cafe,
  Maid,
  Friend,
  Cheki,
  Binder,
  Profile,
  ShareEvent,
  ChekiType,
  ChekiStatus,
} from '../types';

const cafes: Cafe[] = [
  {
    id: 'cafe_lumi',
    name: 'Lumiere Maid Cafe',
    district: 'Hongdae, Seoul',
    manager: 'Manager Yuna',
    color: '#ff8fc7',
    emoji: '🎀',
    vibe: 'Bright and bubbly, big on 4-cut photo sets.',
    chekiPrice: 8000,
    rules: [
      'One cheki per song request.',
      'Homework chekis on Sundays only.',
      'Group 4-cut needs 3+ guests.',
    ],
    maidIds: ['maid_yuna', 'maid_hana', 'maid_sori'],
  },
  {
    id: 'cafe_neko',
    name: 'Neko Neko Cha',
    district: 'Gangnam, Seoul',
    manager: 'Manager Riri',
    color: '#9b6cff',
    emoji: '🐾',
    vibe: 'Cozy cat theme, known for special pin chekis.',
    chekiPrice: 9000,
    rules: [
      'Pins limited to 5 per maid per day.',
      'No flash photography.',
      'Twin chekis need both maids on shift.',
    ],
    maidIds: ['maid_riri', 'maid_mochi'],
  },
  {
    id: 'cafe_star',
    name: 'Starlight Terrace',
    district: 'Busan',
    manager: 'Manager Bora',
    color: '#5b8def',
    emoji: '⭐',
    vibe: 'Seaside cafe, live singing every weekend.',
    chekiPrice: 7500,
    rules: [
      'Weekend live sets at 7pm.',
      'Cheki trades allowed at the counter.',
      'Homework chekis mailed within a week.',
    ],
    maidIds: ['maid_bora', 'maid_nari'],
  },
];

const maids: Maid[] = [
  { id: 'maid_yuna', name: 'Yuna', cafeId: 'cafe_lumi', color: '#ff8fc7', emoji: '👑', hairColor: 'pink', specialty: 'Song requests', bio: 'Lumiere ace. Never misses a high note.' },
  { id: 'maid_hana', name: 'Hana', cafeId: 'cafe_lumi', color: '#9b6cff', emoji: '🌸', hairColor: 'lilac', specialty: '4-cut poses', bio: 'Queen of the 4-cut. Endless pose ideas.' },
  { id: 'maid_sori', name: 'Sori', cafeId: 'cafe_lumi', color: '#5b8def', emoji: '🫧', hairColor: 'blue', specialty: 'Latte art', bio: 'Draws your face in the foam.' },
  { id: 'maid_riri', name: 'Riri', cafeId: 'cafe_neko', color: '#9b6cff', emoji: '🐱', hairColor: 'purple', specialty: 'Special pins', bio: 'Neko Neko legend. Pins sell out fast.' },
  { id: 'maid_mochi', name: 'Mochi', cafeId: 'cafe_neko', color: '#ff8fc7', emoji: '🍡', hairColor: 'cream', specialty: 'Homework chekis', bio: 'Writes the sweetest homework notes.' },
  { id: 'maid_bora', name: 'Bora', cafeId: 'cafe_star', color: '#5b8def', emoji: '🌊', hairColor: 'aqua', specialty: 'Live singing', bio: 'Starlight headliner. Seaside voice.' },
  { id: 'maid_nari', name: 'Nari', cafeId: 'cafe_star', color: '#9b6cff', emoji: '🌟', hairColor: 'violet', specialty: 'Cheki trades', bio: 'Knows every collector by name.' },
];

const friends: Friend[] = [
  { id: 'fr_kai', name: 'Kai', emoji: '🦊', color: '#ff8fc7', bio: 'Pin hunter. Neko Neko regular.' },
  { id: 'fr_min', name: 'Min', emoji: '🐧', color: '#5b8def', bio: 'Starlight superfan. Trades weekly.' },
  { id: 'fr_jae', name: 'Jae', emoji: '🐰', color: '#9b6cff', bio: 'Loves 4-cuts and homework chekis.' },
];

const profile: Profile = {
  id: 'me',
  name: 'You',
  emoji: '🎮',
  bio: 'Cheki collector. Chasing every special pin.',
  favouriteMaidIds: ['maid_yuna', 'maid_riri', 'maid_bora'],
  points: 120,
  ownedDesigns: ['classic', 'sakura', 'midnight'],
};

let realIdx = 0;

function makeCheki(
  ownerId: string,
  maidIds: string[],
  type: ChekiType,
  opts: Partial<Cheki> = {},
): Cheki {
  return {
    id: `ck_${Math.random().toString(36).slice(2, 9)}`,
    ownerId,
    image: null,
    imageUrl: REAL_CHEKIS[realIdx++ % REAL_CHEKIS.length],
    maidIds,
    cafeId: maids.find((m) => m.id === maidIds[0])?.cafeId,
    date: opts.date ?? '2026-06-15',
    type,
    status: (opts.status ?? 'on-hand') as ChekiStatus,
    forSale: opts.forSale ?? false,
    sold: opts.sold ?? false,
    price: opts.price,
    binderIds: opts.binderIds ?? [],
    notes: opts.notes,
    createdAt: Date.now() - Math.floor(Math.random() * 1e7),
    ...opts,
  };
}

export async function seedIfEmpty(): Promise<void> {
  const count = await db.cafes.count();
  if (count > 0) return;

  const salesBinder: Binder = {
    id: 'binder_sales',
    ownerId: 'system',
    name: 'For Sale Market',
    design: 'arcade',
    chekiIds: [],
    system: 'sales',
    createdAt: Date.now(),
  };
  const myBinders: Binder[] = [
    { id: 'binder_faves', ownerId: 'me', name: 'Yuna Shrine', design: 'sakura', chekiIds: [], createdAt: Date.now() },
    { id: 'binder_pins', ownerId: 'me', name: 'Pin Collection', design: 'midnight', chekiIds: [], createdAt: Date.now() },
  ];

  // friends get their own binders (viewable, not editable by you)
  const friendBinders: Binder[] = [
    { id: 'binder_kai_pins', ownerId: 'fr_kai', name: "Kai's Pins", design: 'candy', chekiIds: [], createdAt: Date.now() },
    { id: 'binder_min_star', ownerId: 'fr_min', name: 'Starlight Set', design: 'classic', chekiIds: [], createdAt: Date.now() },
    { id: 'binder_jae_cuts', ownerId: 'fr_jae', name: '4-cut Wall', design: 'sakura', chekiIds: [], createdAt: Date.now() },
  ];

  // my chekis (includes a twin cheki with two maids)
  const myChekis: Cheki[] = [
    makeCheki('me', ['maid_yuna'], 'pin', { binderIds: ['binder_faves', 'binder_pins'] }),
    makeCheki('me', ['maid_yuna'], '4-cut', { binderIds: ['binder_faves'] }),
    makeCheki('me', ['maid_riri', 'maid_mochi'], 'twin', { binderIds: ['binder_pins'] }),
    makeCheki('me', ['maid_riri'], 'pin', { binderIds: ['binder_pins'], status: 'on-the-way' }),
    makeCheki('me', ['maid_bora'], 'normal', {}),
    makeCheki('me', ['maid_mochi'], 'homework', { forSale: true, price: 12000, binderIds: ['binder_sales'] }),
    makeCheki('me', ['maid_hana'], '4-cut', { forSale: true, price: 9000, binderIds: ['binder_sales'] }),
  ];

  // friends' chekis, filed into their own binders (+ some for sale)
  const friendChekis: Cheki[] = [
    makeCheki('fr_kai', ['maid_riri'], 'pin', { forSale: true, price: 15000, binderIds: ['binder_sales', 'binder_kai_pins'] }),
    makeCheki('fr_kai', ['maid_mochi'], 'pin', { binderIds: ['binder_kai_pins'] }),
    makeCheki('fr_kai', ['maid_riri', 'maid_mochi'], 'twin', { binderIds: ['binder_kai_pins'] }),
    makeCheki('fr_min', ['maid_bora'], '4-cut', { binderIds: ['binder_min_star'] }),
    makeCheki('fr_min', ['maid_nari'], 'normal', { forSale: true, price: 6000, binderIds: ['binder_sales', 'binder_min_star'] }),
    makeCheki('fr_min', ['maid_bora', 'maid_nari'], 'group', { binderIds: ['binder_min_star'] }),
    makeCheki('fr_jae', ['maid_yuna'], 'normal', { binderIds: ['binder_jae_cuts'] }),
    makeCheki('fr_jae', ['maid_sori'], 'homework', { binderIds: ['binder_jae_cuts'] }),
    makeCheki('fr_jae', ['maid_hana'], '4-cut', { binderIds: ['binder_jae_cuts'] }),
  ];

  // the two chekis a friend just uploaded (the notification points at these)
  const freshChekis: Cheki[] = [
    makeCheki('fr_min', ['maid_bora'], 'pin', { date: '2026-06-30', binderIds: ['binder_min_star'] }),
    makeCheki('fr_min', ['maid_bora', 'maid_nari'], 'twin', { date: '2026-06-30', binderIds: ['binder_min_star'] }),
  ];

  const allChekis = [...myChekis, ...friendChekis, ...freshChekis];

  // wire binder membership from each cheki's binderIds
  const allBinders = [salesBinder, ...myBinders, ...friendBinders];
  for (const b of allBinders) {
    b.chekiIds = allChekis.filter((c) => c.binderIds.includes(b.id)).map((c) => c.id);
  }

  const share: ShareEvent = {
    id: 'share_1',
    fromFriendId: 'fr_min',
    chekiIds: freshChekis.map((c) => c.id),
    message: 'Just uploaded my Starlight live set haul!',
    createdAt: Date.now() - 3600_000,
    seen: false,
  };

  await db.transaction('rw', [db.cafes, db.maids, db.friends, db.profile, db.binders, db.chekis, db.shares], async () => {
    await db.cafes.bulkAdd(cafes);
    await db.maids.bulkAdd(maids);
    await db.friends.bulkAdd(friends);
    await db.profile.add(profile);
    await db.binders.bulkAdd(allBinders);
    await db.chekis.bulkAdd(allChekis);
    await db.shares.add(share);
  });
}
