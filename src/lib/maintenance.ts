import { APP_CONFIG } from '../config';

/** Central switch for maintenance mode (see src/config.ts). */
export function isMaintenanceMode(): boolean {
  return (APP_CONFIG as { maintenanceMode?: boolean }).maintenanceMode === true;
}

const KEY = 'dropx-maintenance-bypass';
let memoryBypass = false;

/** Has this browser chosen Continue Anyway in the current session? */
export function hasMaintenanceBypass(): boolean {
  try {
    if (sessionStorage.getItem(KEY)) return true;
  } catch {
    /* storage unavailable — fall through to memory */
  }
  return memoryBypass;
}

/** Remember the visitor's choice for the rest of the session. */
export function setMaintenanceBypass(): void {
  memoryBypass = true;
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    /* ignore */
  }
}

/** Forget the choice (used to return to maintenance mode). */
export function clearMaintenanceBypass(): void {
  memoryBypass = false;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
