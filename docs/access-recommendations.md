# Access control — recommendations (not applied)

This file tracks proposed additions to `src/config/access.ts` that go beyond
what the code currently enforces. None of these are wired in — they were
inferred from `Sidebar.tsx` link-visibility rules, which hide navigation
entries per role but never blocked the underlying route. This is a distinct,
separate piece of work; do not add these to `access.ts` without a decision
per row.

| Route | Recommended roles | Rationale |
|---|---|---|
| `/procedures` | `SUPER_ADMIN, CLINIC_ADMIN` | Sidebar only shows this to `isStaffAdmin` — pricing/procedure configuration is financially sensitive. |
| `/doctors/schedule` | `SUPER_ADMIN, CLINIC_ADMIN` | Sidebar only shows this to `isStaffAdmin` — managing other staff's schedules is an admin action. |
| `/settings/plans` | `SUPER_ADMIN, CLINIC_ADMIN` | Sidebar only shows this to `isStaffAdmin` — billing/subscription settings. |
| `/my-schedule` | `DOCTOR` | Sidebar only shows this to `isDoctor` — the concept of "my schedule" only makes sense for a doctor. |
| `/doctors` (list) | `SUPER_ADMIN, CLINIC_ADMIN, RECEPTIONIST, ASSISTANT` (excludes `DOCTOR`, `PATIENT`) | Sidebar's "Doctors" section is shown via `canSeeDoctorsSection = isStaffAdmin \|\| isReceptionist \|\| isAssistant` — plain `DOCTOR` role is excluded. |
| `superadmin/(admin-panel)/*` | `SUPER_ADMIN` | Currently has zero role check, only domain isolation (`admin.` subdomain + separate cookie/login flow). Adding this requires first confirming the superadmin login response actually includes a `role`/`roles` field, and that `superadmin/(admin-panel)/layout.tsx` populates `useAuthStore` from it (it currently doesn't — see caveat below). |
| `/treatments`, `/treatments/[patientId]`, `/dashboard`, `/calendar`, `/settings/profile`, `/settings/change-password` | No restriction recommended | Sidebar shows these to all roles. |

## Caveat found while wiring the (empty) SUPERADMIN_ACCESS_RULES guard

`superadmin/(admin-panel)/layout.tsx` only checks `getStoredUser()` truthiness
on login; it never calls `useAuthStore.getState().setAuthData(...)` or
`hydrateFromStorage()`. The Zustand auth store's `user` is only populated at
module-load time from whatever was in `localStorage.authUser` then. This
means `useAuthStore.getState().user?.roles` inside the superadmin layout may
be stale or empty even after a successful superadmin login.

This has **no effect today** because `SUPERADMIN_ACCESS_RULES` is empty (see
Table A in the audit) — `isRouteAllowed` short-circuits to `true` regardless
of roles. But if the `SUPER_ADMIN`-only row above is ever added, this gap
needs to be closed first (populate the store on superadmin login, same as
the tenant login flow does), or the new rule will misfire.
