# Cheeky Chekis — change log

A running record of major changes to the app. Newest first.

**Legend:** 🗄️ = needed a `supabase/setup.sql` re-run · 🐛 = bug fix · ✨ = new feature · 💄 = look & copy · 📝 = docs/process

---

## 2026-07-14

- ✨🗄️ **In-app activity log (dev)** — user actions (uploads, sales, transfers, binders, shop, admin edits, requests, logins) are recorded to an `activity_log` table. Admin-only: readable in Settings → ACTIVITY LOG, or straight from Supabase. Logging is fire-and-forget and can never break the app. *(adds `activity_log` table + admin-read RLS)*
- 📝 Added this `CHANGELOG.md`; every major change gets an entry from here on.
- ✨🗄️ **Grid cheki count** — grid uploads take a "chekis in grid" number; the profile shows a total **N CHEKIS** that counts each grid as its size. *(adds `chekis.grid_count`)*
- ✨ **Delete & rename binders** — EDIT NAME / DELETE BINDER on your own binders. Deleting keeps the chekis; the system "Cheki Settlements" binder is protected.
- ✨🗄️ **Request a cafe or maid** — non-admins can submit a cafe/maid from the bottom of the Cafes page; admins see a REQUESTS panel at the top and APPROVE (creates it) or DISMISS. *(adds `content_requests` table + RLS)*
- ✨ **Edit a cheki's photo** — CHANGE PHOTO in the cheki edit view (crop + re-upload).
- 💄 Highlighted graduated maids no longer show grey (grey only in the cafe listing).
- 💄 Removed the 🎓 hat emoji from the graduated button.
- 💄 Friend search/requests use the wand icon instead of the game-controller emoji.

## 2026-07-10

- 🗄️ **All SQL consolidated into one idempotent `supabase/setup.sql`** — replaces `schema.sql` and all 16 `migration-*.sql` files (deleted; history in git). Safe to re-run any time; going forward every DB change goes in this one file.
- 🐛 Admin usernames now match case-insensitively (`Holakittybel` was being skipped).
- 💄 Dictionary: removed the "Regular" entry; 4-cut is now "4 pictures of one or more maids in a frame."
- ✨🗄️ **Multi-cafe chekis** — twin/group/4-cut can pull maids from several cafes via a **+ CAFE** picker; the cheki is tagged with every cafe involved. *(adds `chekis.cafe_ids`)*

## 2026-07-09

- ✨🗄️ **Admin permissions** — only admins can add/edit/delete cafes and maids; admins get a pink **Admin** badge. *(adds `profiles.is_admin` + admin-gated RLS)*
- ✨ Maid search on the Cafes page (searches across all cafes).
- ✨ Edit a cheki's on-hand / on-the-way status.
- ✨ Sort your chekis by date (Newest / Oldest).
- 💄 Removed the "app development assisted by Claude Code" line from the disclaimer.

## 2026-07-08

- 🐛 Cancelling a trade request now shows a "REQUEST CANCELLED" confirmation and closes the sheet (it used to do nothing visible).

## 2026-07-07

- ✨ **Password reset by email** — "Forgot password?" sends a reset link; the link opens a set-new-password screen. *(needs working SMTP to deliver)*
- 🐛 **Fixed signup being broken** — the profile insert referenced a `color` column that doesn't exist on the live table, so every new account failed ("Database error saving new user", then accounts with no profile). Profile inserts now only set `id/username/name`.
- 🐛 Accounts self-heal: `ensureProfile` creates a missing profile + starter binders on login, and profile reads no longer throw when the row is absent.

## 2026-07-05

- ✨ **Switched auth from magic link to email + password** (magic-link emails were not delivering). Signups are instant with "Confirm email" off.
- ✨ **Economy rebalanced** — daily login +2, upload +5, sell +10 Cheki Mons.
- ✨ Editable username in Settings, with a uniqueness check.
- ✨ Splash screen on load (wand logo, bouncing, ~2s).
- 💄 Wand logo is now the favicon / PWA icon; cafes without a photo show the mystery icon.
- 💄 Two-step sell flow; DONE buttons dropped in favour of SAVE only.

---

### Earlier

Before this log started: the Supabase rewrite (from local Dexie), friends & sharing, binders + shop, cheki settlements, "Second Life" received chekis, sold-to-friend transfer with accept/decline, and the pixel-art design system. See `git log` for detail.
