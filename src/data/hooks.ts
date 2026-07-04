import { useEffect, useState } from 'react';
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase, chekiPhotoUrl, imageUrl } from './supabase';
import { pushToast } from './toast';
import { useAuth } from './auth';
import { useDataVersion } from './store';
import { CHEKI_FALLBACK } from './chekiArt';
import { POINTS, STARTER_DESIGNS, designPrice, utcDay } from './designs';
import { MAX_HIGHLIGHTS } from '../types';
import type {
  Cheki,
  Binder,
  BinderDesign,
  Cafe,
  Maid,
  Profile,
  PublicProfile,
  Friendship,
  ChekiType,
  ChekiStatus,
} from '../types';

// ---------- row -> camelCase mappers ----------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function mapCheki(row: Row): Cheki {
  return {
    id: row.id,
    ownerId: row.owner_id,
    imageUrl: chekiPhotoUrl(row.image_path) ?? CHEKI_FALLBACK,
    maidIds: row.maid_ids ?? [],
    cafeId: row.cafe_id ?? undefined,
    date: row.date ?? undefined,
    type: row.type,
    status: row.status,
    forSale: row.for_sale,
    sold: row.sold,
    price: row.price ?? undefined,
    notes: row.notes ?? undefined,
    settlementOf: row.settlement_of ?? undefined,
    createdAt: Date.parse(row.created_at),
  };
}

function mapBinder(row: Row): Binder {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    design: row.design,
    createdAt: Date.parse(row.created_at),
  };
}

function mapMaid(row: Row): Maid {
  return {
    id: row.id,
    name: row.name,
    cafeId: row.cafe_id,
    color: row.color,
    emoji: row.emoji,
    imageUrl: imageUrl(row.image_path),
    hairColor: row.hair_color,
    specialty: row.specialty,
    bio: row.bio,
    graduated: row.graduated ?? false,
  };
}

function mapCafe(row: Row): Cafe {
  return {
    id: row.id,
    name: row.name,
    district: row.district,
    manager: row.manager,
    color: row.color,
    emoji: row.emoji,
    imageUrl: imageUrl(row.image_path),
    vibe: row.vibe,
    chekiPrice: row.cheki_price,
    typePrices: row.type_prices ?? {},
    rules: row.rules ?? [],
  };
}

function mapProfile(row: Row): Profile {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    emoji: row.emoji,
    avatarUrl: imageUrl(row.avatar_path),
    bio: row.bio,
    favouriteMaidIds: row.favourite_maid_ids ?? [],
    points: row.points,
    ownedDesigns: row.owned_designs ?? [],
    lastLoginAt: row.last_login_at ?? undefined,
    lastSeenFriendsAt: row.last_seen_friends_at ?? undefined,
  };
}

function mapPublicProfile(row: Row): PublicProfile {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    emoji: row.emoji,
    color: row.color,
    avatarUrl: imageUrl(row.avatar_path),
    bio: row.bio,
    favouriteMaidIds: row.favourite_maid_ids ?? [],
  };
}

function mapFriendship(row: Row): Friendship {
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status,
    createdAt: Date.parse(row.created_at),
  };
}

async function run<R extends { data: unknown; error: PostgrestError | null }>(
  p: PromiseLike<R>,
): Promise<NonNullable<R['data']>> {
  const { data, error } = await p;
  if (error) {
    pushToast(error.message);
    throw new Error(error.message);
  }
  return data as NonNullable<R['data']>;
}

// For UPDATEs: a row-level-security block returns success with 0 rows and no
// error, so a plain update fails silently. Chain .select() and confirm a row
// came back; otherwise surface a clear message.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function writeChecked(builder: any): Promise<Row[]> {
  const { data, error } = await builder.select();
  if (error) {
    pushToast(error.message);
    throw new Error(error.message);
  }
  if (!data || data.length === 0) {
    const msg = 'Save was blocked — run the latest SQL migration in Supabase.';
    pushToast(msg);
    throw new Error(msg);
  }
  return data;
}

// ---------- generic fetch-and-refetch hook ----------
// Refetches whenever the global data version bumps (after any mutation) or
// any of `deps` changes. No realtime subscriptions — simple and reliable
// for a small friend-group app.

function useQuery<T>(fetcher: () => Promise<T>, deps: unknown[]): T | undefined {
  const version = useDataVersion((s) => s.version);
  const [data, setData] = useState<T | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    fetcher().then((r) => {
      if (alive) setData(r);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...deps]);

  return data;
}

function bump() {
  useDataVersion.getState().bump();
}

// ---------- profile ----------

export const useProfile = (): Profile | undefined => {
  const { userId } = useAuth();
  return useQuery(async () => {
    if (!userId) return undefined;
    const row = await run(supabase.from('profiles').select('*').eq('id', userId).single());
    return mapProfile(row);
  }, [userId]);
};

export async function updateProfile(userId: string, patch: Partial<Profile>): Promise<void> {
  const dbPatch: Row = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.bio !== undefined) dbPatch.bio = patch.bio;
  if (patch.favouriteMaidIds !== undefined) dbPatch.favourite_maid_ids = patch.favouriteMaidIds;
  if (patch.points !== undefined) dbPatch.points = patch.points;
  if (patch.ownedDesigns !== undefined) dbPatch.owned_designs = patch.ownedDesigns;
  if (patch.lastLoginAt !== undefined) dbPatch.last_login_at = patch.lastLoginAt;
  if (patch.lastSeenFriendsAt !== undefined) dbPatch.last_seen_friends_at = patch.lastSeenFriendsAt;
  await writeChecked(supabase.from('profiles').update(dbPatch).eq('id', userId));
  bump();
}

export async function setProfileAvatar(userId: string, path: string): Promise<void> {
  await writeChecked(supabase.from('profiles').update({ avatar_path: path }).eq('id', userId));
  bump();
}

export async function awardPoints(userId: string, n: number): Promise<void> {
  const row = await run(supabase.from('profiles').select('points').eq('id', userId).single());
  await writeChecked(supabase.from('profiles').update({ points: row.points + n }).eq('id', userId));
  bump();
}

// Toggle a maid in your highlights, capped at MAX_HIGHLIGHTS.
export async function toggleHighlight(userId: string, maidId: string): Promise<void> {
  const row = await run(supabase.from('profiles').select('favourite_maid_ids').eq('id', userId).single());
  const current: string[] = row.favourite_maid_ids ?? [];
  const next = current.includes(maidId)
    ? current.filter((id) => id !== maidId)
    : current.length < MAX_HIGHLIGHTS
      ? [...current, maidId]
      : current;
  await writeChecked(supabase.from('profiles').update({ favourite_maid_ids: next }).eq('id', userId));
  bump();
}

// Award the daily login bonus once per UTC day. Also backfills owned designs.
export async function claimDailyBonus(userId: string): Promise<boolean> {
  const row = await run(supabase.from('profiles').select('*').eq('id', userId).single());
  const today = utcDay();
  const patch: Row = {};
  if (!row.owned_designs || row.owned_designs.length === 0) patch.owned_designs = STARTER_DESIGNS;
  let awarded = false;
  if (row.last_login_at !== today) {
    patch.points = (row.points ?? 0) + POINTS.dailyLogin;
    patch.last_login_at = today;
    awarded = true;
  }
  if (Object.keys(patch).length) {
    await writeChecked(supabase.from('profiles').update(patch).eq('id', userId));
    bump();
  }
  return awarded;
}

export async function buyDesign(userId: string, design: BinderDesign): Promise<boolean> {
  const row = await run(supabase.from('profiles').select('points, owned_designs').eq('id', userId).single());
  const owned: BinderDesign[] = row.owned_designs ?? [];
  if (owned.includes(design)) return false;
  const cost = designPrice(design);
  if (row.points < cost) return false;
  await writeChecked(
    supabase
      .from('profiles')
      .update({ points: row.points - cost, owned_designs: [...owned, design] })
      .eq('id', userId),
  );
  bump();
  return true;
}

// ---------- cafes & maids ----------

export const useCafes = (): Cafe[] | undefined =>
  useQuery(async () => (await run(supabase.from('cafes').select('*').order('name'))).map(mapCafe), []);

export const useCafe = (id?: string): Cafe | undefined =>
  useQuery(async () => {
    if (!id) return undefined;
    const row = await run(supabase.from('cafes').select('*').eq('id', id).maybeSingle());
    return row ? mapCafe(row) : undefined;
  }, [id]);

export const useMaids = (): Maid[] | undefined =>
  useQuery(async () => (await run(supabase.from('maids').select('*').order('name'))).map(mapMaid), []);

export const useMaid = (id?: string): Maid | undefined =>
  useQuery(async () => {
    if (!id) return undefined;
    const row = await run(supabase.from('maids').select('*').eq('id', id).maybeSingle());
    return row ? mapMaid(row) : undefined;
  }, [id]);

export const useMaidsByCafe = (cafeId?: string): Maid[] | undefined =>
  useQuery(async () => {
    if (!cafeId) return [];
    return (await run(supabase.from('maids').select('*').eq('cafe_id', cafeId).order('name'))).map(mapMaid);
  }, [cafeId]);

export async function updateCafe(cafeId: string, patch: Partial<Cafe>): Promise<void> {
  const dbPatch: Row = {};
  if (patch.district !== undefined) dbPatch.district = patch.district;
  if (patch.manager !== undefined) dbPatch.manager = patch.manager;
  if (patch.chekiPrice !== undefined) dbPatch.cheki_price = patch.chekiPrice;
  if (patch.typePrices !== undefined) dbPatch.type_prices = patch.typePrices;
  if (patch.vibe !== undefined) dbPatch.vibe = patch.vibe;
  if (patch.rules !== undefined) dbPatch.rules = patch.rules;
  await writeChecked(supabase.from('cafes').update(dbPatch).eq('id', cafeId));
  bump();
}

export async function setCafeImage(cafeId: string, path: string): Promise<void> {
  await writeChecked(supabase.from('cafes').update({ image_path: path }).eq('id', cafeId));
  bump();
}

const CAFE_PALETTE = ['#ff8fc7', '#9b6cff', '#5b8def', '#ffd35b'];

export async function createCafe(input: {
  name: string;
  district: string;
  manager: string;
  vibe: string;
  chekiPrice: number;
  emoji?: string;
}): Promise<string> {
  const color = CAFE_PALETTE[Math.floor(Math.random() * CAFE_PALETTE.length)];
  const row = await run(
    supabase
      .from('cafes')
      .insert({
        name: input.name,
        district: input.district,
        manager: input.manager,
        vibe: input.vibe,
        cheki_price: input.chekiPrice,
        emoji: input.emoji || '🎀',
        color,
        rules: [],
      })
      .select('id')
      .single(),
  );
  bump();
  return row.id;
}

export async function createMaid(input: {
  cafeId: string;
  name: string;
  bio: string;
  hairColor?: string;
  emoji?: string;
}): Promise<string> {
  const color = CAFE_PALETTE[Math.floor(Math.random() * CAFE_PALETTE.length)];
  const row = await run(
    supabase
      .from('maids')
      .insert({
        cafe_id: input.cafeId,
        name: input.name,
        specialty: '',
        bio: input.bio,
        hair_color: input.hairColor || 'pink',
        emoji: input.emoji || '🌸',
        color,
      })
      .select('id')
      .single(),
  );
  bump();
  return row.id;
}

export async function updateMaid(maidId: string, patch: Partial<Maid>): Promise<void> {
  const dbPatch: Row = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.specialty !== undefined) dbPatch.specialty = patch.specialty;
  if (patch.bio !== undefined) dbPatch.bio = patch.bio;
  if (patch.hairColor !== undefined) dbPatch.hair_color = patch.hairColor;
  if (patch.emoji !== undefined) dbPatch.emoji = patch.emoji;
  if (patch.graduated !== undefined) dbPatch.graduated = patch.graduated;
  await writeChecked(supabase.from('maids').update(dbPatch).eq('id', maidId));
  bump();
}

export async function setMaidImage(maidId: string, path: string): Promise<void> {
  await writeChecked(supabase.from('maids').update({ image_path: path }).eq('id', maidId));
  bump();
}

export async function deleteMaid(maidId: string): Promise<void> {
  await run(supabase.from('maids').delete().eq('id', maidId));
  bump();
}

export async function deleteCafe(cafeId: string): Promise<void> {
  await run(supabase.from('cafes').delete().eq('id', cafeId));
  bump();
}

// ---------- chekis ----------

export const useChekisByOwner = (ownerId?: string): Cheki[] | undefined =>
  useQuery(async () => {
    if (!ownerId) return [];
    // settlements (settlement_of not null) are hidden from the main collection;
    // they're browsed via the parent cheki or the Cheki Settlements binder.
    const rows = await run(
      supabase
        .from('chekis')
        .select('*')
        .eq('owner_id', ownerId)
        .is('settlement_of', null)
        .order('created_at', { ascending: false }),
    );
    return rows.map(mapCheki);
  }, [ownerId]);

export const useMyChekis = (): Cheki[] | undefined => {
  const { userId } = useAuth();
  return useChekisByOwner(userId ?? undefined);
};

export const useForSaleChekis = (): Cheki[] | undefined =>
  useQuery(async () => {
    const rows = await run(
      supabase
        .from('chekis')
        .select('*')
        .eq('for_sale', true)
        .is('settlement_of', null)
        .order('created_at', { ascending: false }),
    );
    return rows.map(mapCheki);
  }, []);

// resolves seller names for an arbitrary set of owner ids (e.g. the Sales
// market, where sellers aren't necessarily your friends)
export const usePublicProfilesByIds = (ids: string[]): Map<string, PublicProfile> | undefined =>
  useQuery(async () => {
    if (ids.length === 0) return new Map();
    const rows = await run(supabase.from('profiles').select('*').in('id', ids));
    return new Map(rows.map((r: Row) => [r.id, mapPublicProfile(r)]));
  }, [ids.slice().sort().join(',')]);

export async function addCheki(
  userId: string,
  input: {
    imagePath: string | null;
    maidIds: string[];
    cafeId?: string;
    date?: string;
    type: ChekiType;
    status: ChekiStatus;
    forSale: boolean;
    price?: number;
    notes?: string;
    binderId?: string;
  },
): Promise<string> {
  const row = await run(
    supabase
      .from('chekis')
      .insert({
        owner_id: userId,
        image_path: input.imagePath,
        maid_ids: input.maidIds,
        cafe_id: input.cafeId ?? null,
        date: input.date ?? null,
        type: input.type,
        status: input.status,
        for_sale: input.forSale,
        sold: false,
        price: input.price ?? null,
        notes: input.notes ?? null,
      })
      .select('id')
      .single(),
  );
  if (input.binderId) {
    await run(supabase.from('binder_chekis').insert({ binder_id: input.binderId, cheki_id: row.id }));
  }
  await awardPoints(userId, POINTS.upload);
  bump();
  return row.id;
}

export async function updateCheki(
  chekiId: string,
  patch: { type?: ChekiType; maidIds?: string[]; date?: string },
): Promise<void> {
  const dbPatch: Row = {};
  if (patch.type !== undefined) dbPatch.type = patch.type;
  if (patch.maidIds !== undefined) dbPatch.maid_ids = patch.maidIds;
  if (patch.date !== undefined) dbPatch.date = patch.date;
  await writeChecked(supabase.from('chekis').update(dbPatch).eq('id', chekiId));
  bump();
}

// A cheki lives in at most one binder. Passing null takes it out of binders.
export const useChekiBinderId = (chekiId?: string): string | undefined =>
  useQuery(async () => {
    if (!chekiId) return undefined;
    const row = await run(supabase.from('binder_chekis').select('binder_id').eq('cheki_id', chekiId).maybeSingle());
    return row?.binder_id ?? undefined;
  }, [chekiId]);

export async function setChekiBinder(chekiId: string, binderId: string | null): Promise<void> {
  await run(supabase.from('binder_chekis').delete().eq('cheki_id', chekiId));
  if (binderId) {
    await run(supabase.from('binder_chekis').upsert({ binder_id: binderId, cheki_id: chekiId }));
  }
  bump();
}

export async function deleteCheki(chekiId: string): Promise<void> {
  await run(supabase.from('chekis').delete().eq('id', chekiId));
  bump();
}

// ---------- cheki likes ----------

export interface ChekiLikes {
  counts: Map<string, number>;
  likedBy: Map<string, Set<string>>;
}

export const useChekiLikes = (chekiIds: string[]): ChekiLikes | undefined =>
  useQuery(async () => {
    if (chekiIds.length === 0) return { counts: new Map(), likedBy: new Map() };
    const rows = await run(supabase.from('cheki_likes').select('cheki_id, user_id').in('cheki_id', chekiIds));
    const counts = new Map<string, number>();
    const likedBy = new Map<string, Set<string>>();
    for (const r of rows as Row[]) {
      counts.set(r.cheki_id, (counts.get(r.cheki_id) ?? 0) + 1);
      if (!likedBy.has(r.cheki_id)) likedBy.set(r.cheki_id, new Set());
      likedBy.get(r.cheki_id)!.add(r.user_id);
    }
    return { counts, likedBy };
  }, [chekiIds.slice().sort().join(',')]);

export async function toggleChekiLike(chekiId: string, userId: string, liked: boolean): Promise<void> {
  if (liked) {
    await run(supabase.from('cheki_likes').delete().eq('cheki_id', chekiId).eq('user_id', userId));
  } else {
    await run(supabase.from('cheki_likes').insert({ cheki_id: chekiId, user_id: userId }));
  }
  bump();
}

export async function toggleForSale(cheki: Cheki, price?: number): Promise<void> {
  const nextForSale = !cheki.forSale;
  await writeChecked(
    supabase
      .from('chekis')
      .update({ for_sale: nextForSale, price: nextForSale ? (price ?? cheki.price ?? null) : cheki.price ?? null })
      .eq('id', cheki.id),
  );
  bump();
}

// Classify a for-sale cheki as sold. Awards points once, pulls it off the market.
export async function markSold(cheki: Cheki): Promise<void> {
  if (cheki.sold) return;
  await writeChecked(supabase.from('chekis').update({ sold: true, for_sale: false }).eq('id', cheki.id));
  await awardPoints(cheki.ownerId, POINTS.sold);
  bump();
}

// Sold to a friend: transfers the cheki into their collection via a
// SECURITY DEFINER function (RLS won't let a plain update change owner_id).
export async function markSoldToFriend(cheki: Cheki, friendId: string): Promise<void> {
  const { error } = await supabase.rpc('transfer_cheki_to_friend', {
    p_cheki_id: cheki.id,
    p_new_owner: friendId,
  });
  if (error) {
    pushToast(error.message);
    throw new Error(error.message);
  }
  await awardPoints(cheki.ownerId, POINTS.sold);
  bump();
}

export function formatKRW(n?: number): string {
  if (n == null) return '-';
  return '₩' + n.toLocaleString('en-US');
}

// ---------- binders ----------

export const useBindersByOwner = (ownerId?: string): Binder[] | undefined =>
  useQuery(async () => {
    if (!ownerId) return [];
    const rows = await run(
      supabase.from('binders').select('*').eq('owner_id', ownerId).order('created_at'),
    );
    return rows.map(mapBinder);
  }, [ownerId]);

export const useBinderChekiCounts = (ownerId?: string): Map<string, number> | undefined =>
  useQuery(async () => {
    if (!ownerId) return new Map();
    const rows = await run(
      supabase.from('binder_chekis').select('binder_id, binders!inner(owner_id)').eq('binders.owner_id', ownerId),
    );
    const counts = new Map<string, number>();
    for (const r of rows as Row[]) counts.set(r.binder_id, (counts.get(r.binder_id) ?? 0) + 1);
    return counts;
  }, [ownerId]);

export const useMyBinders = (): Binder[] | undefined => {
  const { userId } = useAuth();
  return useBindersByOwner(userId ?? undefined);
};

export const useBinder = (id?: string): Binder | undefined =>
  useQuery(async () => {
    if (!id) return undefined;
    const row = await run(supabase.from('binders').select('*').eq('id', id).maybeSingle());
    return row ? mapBinder(row) : undefined;
  }, [id]);

export const useBinderChekis = (binderId?: string): Cheki[] | undefined =>
  useQuery(async () => {
    if (!binderId) return [];
    const rows = await run(
      supabase.from('binder_chekis').select('chekis(*)').eq('binder_id', binderId),
    );
    return rows.map((r: Row) => mapCheki(r.chekis)).filter((c: Cheki) => c.id);
  }, [binderId]);

export async function createBinder(userId: string, name: string, design: BinderDesign): Promise<string> {
  const row = await run(
    supabase.from('binders').insert({ owner_id: userId, name, design }).select('id').single(),
  );
  bump();
  return row.id;
}

export async function setBinderDesign(binderId: string, design: BinderDesign): Promise<void> {
  await writeChecked(supabase.from('binders').update({ design }).eq('id', binderId));
  bump();
}

export async function addChekiToBinder(chekiId: string, binderId: string): Promise<void> {
  await run(supabase.from('binder_chekis').upsert({ binder_id: binderId, cheki_id: chekiId }));
  bump();
}

// ---------- settlements ----------
// A settlement is an extra photo attached to a cheki. It's stored as its own
// cheki row (settlement_of -> parent), inherits the parent's classifications,
// and is pinned to a dedicated "Cheki Settlements" binder.

export const SETTLEMENTS_BINDER_NAME = 'Cheki Settlements';

// Find (or lazily create) the user's dedicated settlements binder.
async function ensureSettlementsBinder(userId: string): Promise<string> {
  const existing = await run(
    supabase
      .from('binders')
      .select('id')
      .eq('owner_id', userId)
      .eq('name', SETTLEMENTS_BINDER_NAME)
      .maybeSingle(),
  );
  if (existing?.id) return existing.id;
  const row = await run(
    supabase
      .from('binders')
      .insert({ owner_id: userId, name: SETTLEMENTS_BINDER_NAME, design: 'classic' })
      .select('id')
      .single(),
  );
  return row.id;
}

// Settlement photos attached to a given parent cheki.
export const useSettlementsOf = (chekiId?: string): Cheki[] | undefined =>
  useQuery(async () => {
    if (!chekiId) return [];
    const rows = await run(
      supabase.from('chekis').select('*').eq('settlement_of', chekiId).order('created_at', { ascending: true }),
    );
    return rows.map(mapCheki);
  }, [chekiId]);

// Create a settlement: inherits the parent's maids/cafe/date/type, lands in
// the settlements binder. No upload points — it's an attachment, not a new cheki.
export async function createSettlement(userId: string, parent: Cheki, imagePath: string): Promise<string> {
  const binderId = await ensureSettlementsBinder(userId);
  const row = await run(
    supabase
      .from('chekis')
      .insert({
        owner_id: userId,
        image_path: imagePath,
        maid_ids: parent.maidIds,
        cafe_id: parent.cafeId ?? null,
        date: parent.date ?? null,
        type: parent.type,
        status: 'on-hand',
        for_sale: false,
        sold: false,
        settlement_of: parent.id,
      })
      .select('id')
      .single(),
  );
  await run(supabase.from('binder_chekis').insert({ binder_id: binderId, cheki_id: row.id }));
  bump();
  return row.id;
}

// ---------- friends ----------

export const useFriends = (): PublicProfile[] | undefined => {
  const { userId } = useAuth();
  return useQuery(async () => {
    if (!userId) return [];
    const rows = await run(
      supabase
        .from('friendships')
        .select('requester_id, addressee_id, requester:requester_id(*), addressee:addressee_id(*)')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
    );
    return rows.map((r: Row) => mapPublicProfile(r.requester_id === userId ? r.addressee : r.requester));
  }, [userId]);
};

export const useFriend = (id?: string): PublicProfile | undefined =>
  useQuery(async () => {
    if (!id) return undefined;
    const row = await run(supabase.from('profiles').select('*').eq('id', id).maybeSingle());
    return row ? mapPublicProfile(row) : undefined;
  }, [id]);

// incoming pending requests, with the requester's public profile attached
export const useIncomingRequests = (): (Friendship & { from: PublicProfile })[] | undefined => {
  const { userId } = useAuth();
  return useQuery(async () => {
    if (!userId) return [];
    const rows = await run(
      supabase
        .from('friendships')
        .select('*, requester:requester_id(*)')
        .eq('addressee_id', userId)
        .eq('status', 'pending'),
    );
    return rows.map((r: Row) => ({ ...mapFriendship(r), from: mapPublicProfile(r.requester) }));
  }, [userId]);
};

export const useOutgoingRequestIds = (): Set<string> | undefined => {
  const { userId } = useAuth();
  return useQuery(async () => {
    if (!userId) return new Set<string>();
    const rows = await run(
      supabase.from('friendships').select('addressee_id, requester_id').or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
    );
    return new Set(rows.map((r: Row) => (r.requester_id === userId ? r.addressee_id : r.requester_id)));
  }, [userId]);
};

export async function searchProfiles(query: string, excludeUserId: string): Promise<PublicProfile[]> {
  if (!query.trim()) return [];
  const rows = await run(
    supabase.from('profiles').select('*').ilike('username', `%${query.trim()}%`).neq('id', excludeUserId).limit(10),
  );
  return rows.map(mapPublicProfile);
}

export async function sendFriendRequest(userId: string, targetId: string): Promise<void> {
  await run(supabase.from('friendships').insert({ requester_id: userId, addressee_id: targetId }));
  bump();
}

export async function acceptFriendRequest(friendshipId: string): Promise<void> {
  await writeChecked(supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId));
  bump();
}

export async function removeFriendship(friendshipId: string): Promise<void> {
  await run(supabase.from('friendships').delete().eq('id', friendshipId));
  bump();
}

// friends' recent chekis, grouped by friend — powers the Friends tab feed
export interface FriendActivity {
  friend: PublicProfile;
  chekis: Cheki[];
  latestAt: number;
}

export const useFriendActivity = (): FriendActivity[] | undefined => {
  const friends = useFriends();
  return useQuery(async () => {
    if (!friends || friends.length === 0) return [];
    const ids = friends.map((f) => f.id);
    const rows = await run(
      supabase.from('chekis').select('*').in('owner_id', ids).order('created_at', { ascending: false }),
    );
    const chekis = rows.map(mapCheki);
    const byOwner = new Map<string, Cheki[]>();
    for (const c of chekis) {
      if (!byOwner.has(c.ownerId)) byOwner.set(c.ownerId, []);
      byOwner.get(c.ownerId)!.push(c);
    }
    return friends
      .filter((f) => byOwner.has(f.id))
      .map((f) => {
        const fChekis = byOwner.get(f.id)!;
        return { friend: f, chekis: fChekis, latestAt: Math.max(...fChekis.map((c) => c.createdAt)) };
      })
      .sort((a, b) => b.latestAt - a.latestAt);
  }, [friends?.map((f) => f.id).join(',')]);
};

export const usePendingFriendActivityCount = (): number => {
  const profile = useProfile();
  const activity = useFriendActivity();
  if (!activity) return 0;
  const since = profile?.lastSeenFriendsAt ? Date.parse(profile.lastSeenFriendsAt) : 0;
  return activity.filter((a) => a.latestAt > since).length;
};

export async function markFriendsSeen(userId: string): Promise<void> {
  await writeChecked(supabase.from('profiles').update({ last_seen_friends_at: new Date().toISOString() }).eq('id', userId));
  bump();
}
