import Dexie, { type Table } from 'dexie';
import type {
  Cheki,
  Binder,
  Maid,
  Cafe,
  Friend,
  ShareEvent,
  Profile,
} from '../types';

export class CheekyDB extends Dexie {
  chekis!: Table<Cheki, string>;
  binders!: Table<Binder, string>;
  maids!: Table<Maid, string>;
  cafes!: Table<Cafe, string>;
  friends!: Table<Friend, string>;
  shares!: Table<ShareEvent, string>;
  profile!: Table<Profile, string>;

  constructor() {
    super('cheeky-chekis');
    this.version(1).stores({
      chekis: 'id, ownerId, maidId, cafeId, type, status, forSale',
      binders: 'id, ownerId, system',
      maids: 'id, cafeId',
      cafes: 'id',
      friends: 'id',
      shares: 'id, fromFriendId, seen, classified',
      profile: 'id',
    });

    // v2: Cheki Points shop. Backfill sold flag + owned designs.
    this.version(2)
      .stores({
        chekis: 'id, ownerId, maidId, cafeId, type, status, forSale, sold',
      })
      .upgrade(async (tx) => {
        await tx.table('chekis').toCollection().modify((c: { sold?: boolean }) => {
          if (c.sold === undefined) c.sold = false;
        });
        await tx.table('profile').toCollection().modify((p: { ownedDesigns?: string[] }) => {
          if (!p.ownedDesigns) p.ownedDesigns = ['classic', 'sakura', 'midnight'];
        });
      });

    // v3: multi-maid chekis + up to 3 highlighted maids. Drop stale indexes.
    this.version(3)
      .stores({
        chekis: 'id, ownerId, cafeId, type, status, forSale, sold, *maidIds',
        shares: 'id, fromFriendId, seen',
      })
      .upgrade(async (tx) => {
        await tx.table('chekis').toCollection().modify((c: { maidId?: string; maidIds?: string[] }) => {
          if (!c.maidIds) c.maidIds = c.maidId ? [c.maidId] : [];
          delete c.maidId;
        });
        await tx.table('profile').toCollection().modify((p: { favouriteMaidId?: string; favouriteMaidIds?: string[] }) => {
          if (!p.favouriteMaidIds) p.favouriteMaidIds = p.favouriteMaidId ? [p.favouriteMaidId] : [];
          delete p.favouriteMaidId;
        });
      });
  }
}

export const db = new CheekyDB();

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
