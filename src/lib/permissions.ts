import type { Role } from '../types';

// One place for who may do what. RLS in 026 enforces the same rules
// server-side — these only decide what the UI shows. Sub-admins see the
// dashboard but can never delete anything and can only touch images.

export function isStaffRole(role: Role | string | null | undefined): boolean {
  return role === 'admin' || role === 'superadmin' || role === 'subadmin';
}

export function isSubadmin(role: Role | string | null | undefined): boolean {
  return role === 'subadmin';
}

/** Full control: catalog, orders, customers, settings, plans, drops. */
export function canManageStore(role: Role | string | null | undefined): boolean {
  return role === 'admin' || role === 'superadmin';
}

/** Product images only: upload + remove. Nothing else. */
export function canManageImages(role: Role | string | null | undefined): boolean {
  return isStaffRole(role);
}

/** Sub-admins cannot delete anything, anywhere. */
export function canDeleteAnything(role: Role | string | null | undefined): boolean {
  return role === 'admin' || role === 'superadmin';
}
