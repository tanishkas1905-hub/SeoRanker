# Firestore Security Specification (Phase 0)

## Data Invariants
1. Every user profile (`/users/{userId}`) and user-owned subcollection (`/users/{userId}/leads/{leadId}`, `/keywords/{keywordId}`, `/seoPackages/{seoId}`, `/checklist/{itemId}`, `/seoAudits/{auditId}`) is strictly isolated to `request.auth.uid == userId` with verified email (`request.auth.token.email_verified == true`).
2. Unauthenticated users and users with unverified email tokens receive `PERMISSION_DENIED` on all reads and writes.
3. No user can read, list, create, update, or delete another user's profile, leads (PII: email/phone), keywords, SEO packages, checklist items, or SEO audits.
4. All document IDs (`userId`, `leadId`, `keywordId`, `seoId`, `itemId`, `auditId`) must match `^[a-zA-Z0-9_\-]+$` and be `<= 128` characters.
5. `ownerId` / `uid` and `createdAt` are immutable after creation; `createdAt` and `updatedAt` must equal `request.time`.
6. Ghost / shadow fields outside the explicit allowlist (`keys().hasOnly(...)`) are rejected on create and update.

## Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. Unauthenticated read of `/users/userA`.
2. Unauthenticated write to `/users/userA/leads/ld1`.
3. Cross-user read of `/users/userB/leads/ld1` while signed in as `userA`.
4. Cross-user list query on `/users/userB/leads` while signed in as `userA`.
5. Unverified email token (`email_verified: false`) writing to `/users/userA`.
6. Identity spoofing: `userA` writing `/users/userA/leads/ld1` with `ownerId: "userB"`.
7. Shadow field injection: `userA` writing `/users/userA` with extra key `isAdmin: true`.
8. Oversized ID injection (`> 128` chars or invalid `/` characters) in `leadId`.
9. Client-forged timestamp (`createdAt` != `request.time`) on lead creation.
10. Immutable field mutation: updating `ownerId` or `createdAt` on `/users/userA/leads/ld1`.
11. Unbounded array injection: `lsiKeywords` array with `> 15` items or non-string first element in `seoPackages`.
12. Enum tampering: setting `lead.status` to `"Approved"` instead of allowed pipeline statuses.
