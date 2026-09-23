import { describe, expect, it } from 'vitest';
import {
  isLikelyShareCode,
  isStaffEmail,
  isSubAdminRole,
  normalizeStaffUsername,
  staffEmailForUsername,
  usernameFromStaffEmail,
  validateStaffPassword,
  validateStaffUsername,
} from '../src/lib/staff';

describe('staff accounts', () => {
  it('maps usernames to synthetic emails and back', () => {
    expect(staffEmailForUsername('Rojina.P')).toBe('rojina.p@staff.dropx.internal');
    expect(usernameFromStaffEmail('rojina.p@staff.dropx.internal')).toBe('rojina.p');
    expect(usernameFromStaffEmail('someone@gmail.com')).toBeNull();
    expect(isStaffEmail('a@staff.dropx.internal')).toBe(true);
    expect(isStaffEmail('a@gmail.com')).toBe(false);
  });

  it('normalizes usernames', () => {
    expect(normalizeStaffUsername('  Photo-Team_01 ')).toBe('photo-team_01');
  });

  it('validates usernames', () => {
    expect(validateStaffUsername('ab')).not.toBeNull();
    expect(validateStaffUsername('a'.repeat(25))).not.toBeNull();
    expect(validateStaffUsername('bad name!')).not.toBeNull();
    expect(validateStaffUsername('.lead')).not.toBeNull();
    expect(validateStaffUsername('photo-team_01')).toBeNull();
  });

  it('validates passwords', () => {
    expect(validateStaffPassword('short')).not.toBeNull();
    expect(validateStaffPassword('correct horse 8')).toBeNull();
  });

  it('detects the subadmin role', () => {
    expect(isSubAdminRole('subadmin')).toBe(true);
    expect(isSubAdminRole('admin')).toBe(false);
    expect(isSubAdminRole(null)).toBe(false);
  });

  it('recognizes one-time login code shapes', () => {
    expect(isLikelyShareCode('dx1_abcdefghijklmnopqrstuvwx123456')).toBe(true);
    expect(isLikelyShareCode('  dx1_abcdefghijklmnopqrstuvwx123456  ')).toBe(true);
    expect(isLikelyShareCode('hunter2')).toBe(false);
    expect(isLikelyShareCode('dx1_short')).toBe(false);
    expect(isLikelyShareCode('')).toBe(false);
  });
});

describe('staff permissions', () => {
  it('lets staff manage images but never delete anything else', async () => {
    const perms = await import('../src/lib/permissions');
    expect(perms.canManageImages('subadmin')).toBe(true);
    expect(perms.canManageImages('admin')).toBe(true);
    expect(perms.canManageImages('customer')).toBe(false);
    expect(perms.canManageStore('subadmin')).toBe(false);
    expect(perms.canManageStore('admin')).toBe(true);
    expect(perms.canDeleteAnything('subadmin')).toBe(false);
    expect(perms.canDeleteAnything('superadmin')).toBe(true);
    expect(perms.isSubadmin('subadmin')).toBe(true);
  });
});
