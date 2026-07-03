import { useLiveQuery } from 'dexie-react-hooks';
import { db, uid } from './db';
import type { Cheki, Binder, BinderDesign, Cafe, Profile, ChekiType, ChekiStatus } from '../types';
import { MAX_HIGHLIGHTS } from '../types';
import { POINTS, STARTER_DESIGNS, designPrice, utcDay } from './designs';

// Central points crediting so every reward runs the same path.
export async function awardPoints(n: number): Promise<void> {
  const p = await db.profile.get('me');
  if (p) await db.profile.update('me', { points: p.points + n });
}

export const useProfile = () => useLiveQuery(() => db.profile.get('me'), []);
export const useCafes = () => useLiveQuery(() => db.cafes.toArray(), []);
export const useCafe = (id?: string) =>
  useLiveQuery(() => (id ? db.cafes.get(id) : undefined), [id]);
export const useMaids = () => useLiveQuery(() => db.maids.toArray(), []);
export const useMaid = (id?: string) =>
  useLiveQuery(() => (id ? db.maids.get(id) : undefined), [id]);
export const useMaidsByCafe = (cafeId?: string) =>
  useLiveQuery(
    () => (cafeId ? db.maids.where('cafeId').equals(cafeId).toArray() : []),
    [cafeId],
  );
export const useFriends = () => useLiveQuery(() => db.friends.toArray(), []);
export const useFriend = (id?: string) =>
  useLiveQuery(() => (id ? db.friends.get(id) : undefined), [id]);
export const useChekisByOwner = (ownerId?: string) =>
  useLiveQuery(
    () => (ownerId ? db.chekis.where('ownerId').equals(ownerId).toArray() : []),
    [ownerId],
  );
export const useBindersByOwner = (ownerId?: string) =>
  useLiveQuery(
    () => (ownerId ? db.binders.where('ownerId').equals(ownerId).toArray() : []),
    [ownerId],
  );

export const useMyChekis = () =>
  useLiveQuery(() => db.chekis.where('ownerId').equals('me').toArray(), []);
export const useMyBinders = () =>
  useLiveQuery(() => db.binders.where('ownerId').equals('me').toArray(), []);
export const useSalesBinder = () =>
  useLiveQuery(() => db.binders.where('system').equals('sales').first(), []);
export const useChekisByIds = (ids: string[]) =>
  useLiveQuery(() => db.chekis.bulkGet(ids).then((r) => r.filter(Boolean) as Cheki[]), [ids.join(',')]);
export const useForSaleChekis = () =>
  useLiveQuery(
    async () => (await db.chekis.toArray()).filter((c) => c.forSale),
    [],
  );

export const useShares = () =>
  useLiveQuery(async () => (await db.shares.toArray()).sort((a, b) => b.createdAt - a.createdAt), []);
export const usePendingShares = () =>
  useLiveQuery(async () => (await db.shares.toArray()).filter((s) => !s.seen), []);

// mutations

export async function addCheki(input: {
  image: Blob | null;
  maidIds: string[];
  cafeId?: string;
  date?: string;
  type: ChekiType;
  status: ChekiStatus;
  forSale: boolean;
  price?: number;
  notes?: string;
}): Promise<string> {
  const id = uid('ck');
  const binderIds: string[] = [];
  if (input.forSale) {
    const sales = await db.binders.where('system').equals('sales').first();
    if (sales) {
      binderIds.push(sales.id);
      await db.binders.update(sales.id, { chekiIds: [...sales.chekiIds, id] });
    }
  }
  await db.chekis.add({
    id,
    ownerId: 'me',
    image: input.image,
    maidIds: input.maidIds,
    cafeId: input.cafeId,
    date: input.date,
    type: input.type,
    status: input.status,
    forSale: input.forSale,
    sold: false,
    price: input.price,
    binderIds,
    notes: input.notes,
    createdAt: Date.now(),
  });
  await awardPoints(POINTS.upload);
  return id;
}

export async function toggleForSale(cheki: Cheki, price?: number): Promise<void> {
  const sales = await db.binders.where('system').equals('sales').first();
  const nextForSale = !cheki.forSale;
  let binderIds = cheki.binderIds;
  if (sales) {
    if (nextForSale) {
      binderIds = Array.from(new Set([...binderIds, sales.id]));
      await db.binders.update(sales.id, {
        chekiIds: Array.from(new Set([...sales.chekiIds, cheki.id])),
      });
    } else {
      binderIds = binderIds.filter((b) => b !== sales.id);
      await db.binders.update(sales.id, {
        chekiIds: sales.chekiIds.filter((c) => c !== cheki.id),
      });
    }
  }
  await db.chekis.update(cheki.id, {
    forSale: nextForSale,
    price: nextForSale ? (price ?? cheki.price) : cheki.price,
    binderIds,
  });
}

// Classify a for-sale cheki as sold. Awards points once, pulls it off the market.
export async function markSold(cheki: Cheki): Promise<void> {
  if (cheki.sold) return;
  const sales = await db.binders.where('system').equals('sales').first();
  if (sales) {
    await db.binders.update(sales.id, {
      chekiIds: sales.chekiIds.filter((c) => c !== cheki.id),
    });
  }
  await db.chekis.update(cheki.id, {
    sold: true,
    forSale: false,
    binderIds: cheki.binderIds.filter((b) => b !== sales?.id),
  });
  await awardPoints(POINTS.sold);
}

export async function setBinderDesign(binderId: string, design: BinderDesign): Promise<void> {
  await db.binders.update(binderId, { design });
}

// Spend points to unlock a binder design. Returns false if unaffordable/owned.
export async function buyDesign(design: BinderDesign): Promise<boolean> {
  const p = await db.profile.get('me');
  if (!p) return false;
  const owned = p.ownedDesigns ?? [];
  if (owned.includes(design)) return false;
  const cost = designPrice(design);
  if (p.points < cost) return false;
  await db.profile.update('me', {
    points: p.points - cost,
    ownedDesigns: [...owned, design],
  });
  return true;
}

// Award the daily login bonus once per UTC day. Also backfills owned designs.
export async function claimDailyBonus(): Promise<boolean> {
  const p = await db.profile.get('me');
  if (!p) return false;
  const today = utcDay();
  const patch: Partial<typeof p> = {};
  if (!p.ownedDesigns) patch.ownedDesigns = STARTER_DESIGNS;
  let awarded = false;
  if (p.lastLoginAt !== today) {
    patch.points = (p.points ?? 0) + POINTS.dailyLogin;
    patch.lastLoginAt = today;
    awarded = true;
  }
  if (Object.keys(patch).length) await db.profile.update('me', patch);
  return awarded;
}

export async function addChekiToBinder(chekiId: string, binderId: string): Promise<void> {
  const [cheki, binder] = await Promise.all([db.chekis.get(chekiId), db.binders.get(binderId)]);
  if (!cheki || !binder) return;
  await db.chekis.update(chekiId, {
    binderIds: Array.from(new Set([...cheki.binderIds, binderId])),
  });
  await db.binders.update(binderId, {
    chekiIds: Array.from(new Set([...binder.chekiIds, chekiId])),
  });
}

export async function createBinder(name: string, design: Binder['design']): Promise<string> {
  const id = uid('binder');
  await db.binders.add({
    id,
    ownerId: 'me',
    name,
    design,
    chekiIds: [],
    createdAt: Date.now(),
  });
  return id;
}

export async function markSharesSeen(): Promise<void> {
  const unseen = await db.shares.filter((s) => !s.seen).toArray();
  await Promise.all(unseen.map((s) => db.shares.update(s.id, { seen: true })));
}

// Profile edits
export async function updateProfile(patch: Partial<Profile>): Promise<void> {
  await db.profile.update('me', patch);
}

// Toggle a maid in your highlights, capped at MAX_HIGHLIGHTS.
export async function toggleHighlight(maidId: string): Promise<void> {
  const p = await db.profile.get('me');
  if (!p) return;
  const current = p.favouriteMaidIds ?? [];
  if (current.includes(maidId)) {
    await db.profile.update('me', { favouriteMaidIds: current.filter((id) => id !== maidId) });
  } else if (current.length < MAX_HIGHLIGHTS) {
    await db.profile.update('me', { favouriteMaidIds: [...current, maidId] });
  }
}

export async function updateCafe(cafeId: string, patch: Partial<Cafe>): Promise<void> {
  await db.cafes.update(cafeId, patch);
}

export function formatKRW(n?: number): string {
  if (n == null) return '-';
  return '₩' + n.toLocaleString('en-US');
}
