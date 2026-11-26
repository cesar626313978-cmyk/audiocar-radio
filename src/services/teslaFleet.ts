import { TeslaSession } from '../types';

const TESLA_SESSION_KEY = 'audiocar_tesla_session';
const FLEET_API_BASE = 'https://fleet-api.prd.eu.vn.cloud.tesla.com';

export function getTeslaSession(): TeslaSession | null {
  try {
    const raw = localStorage.getItem(TESLA_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    const accessToken = parsed.access_token || parsed.accessToken;
    const vehicleId =
      parsed.vehicle_id ||
      parsed.vehicleId ||
      parsed.id ||
      parsed.vin ||
      parsed.vehicle?.id ||
      parsed.vehicle?.vehicle_id;

    if (typeof accessToken !== 'string' || !accessToken.trim() || !vehicleId) {
      return null;
    }

    return {
      ...parsed,
      access_token: accessToken.trim(),
      refresh_token: parsed.refresh_token || parsed.refreshToken,
      vehicle_id: String(vehicleId),
      expires_at: parsed.expires_at || parsed.expiresAt,
    };
  } catch (e) {
    console.warn('Error reading audiocar_tesla_session:', e);
    return null;
  }
}

export function saveTeslaSession(session: TeslaSession): void {
  try {
    const existingRaw = localStorage.getItem(TESLA_SESSION_KEY);
    let existing: Record<string, unknown> = {};
    if (existingRaw) {
      const parsed = JSON.parse(existingRaw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        existing = parsed;
      }
    }
    const merged = {
      ...existing,
      ...session,
    };
    localStorage.setItem(TESLA_SESSION_KEY, JSON.stringify(merged));
  } catch (e) {
    console.warn('Error saving audiocar_tesla_session:', e);
  }
}

function isTokenExpiringSoon(session: TeslaSession): boolean {
  if (!session.expires_at) return false;
  // Handle both seconds and milliseconds epoch timestamps
  const expiresAtMs =
    session.expires_at < 1e12 ? session.expires_at * 1000 : session.expires_at;
  // Refresh if expiring within the next 2 minutes
  return Date.now() >= expiresAtMs - 120_000;
}

export async function refreshTeslaTokenIfNeeded(
  force = false
): Promise<TeslaSession | null> {
  const session = getTeslaSession();
  if (!session) return null;

  if (!force && !isTokenExpiringSoon(session)) {
    return session;
  }

  if (!session.refresh_token) {
    return session;
  }

  try {
    const res = await fetch('/api/tesla-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: session.refresh_token,
      }),
    });

    if (!res.ok) {
      console.warn('Failed to refresh Tesla token via /api/tesla-token:', res.status);
      return session;
    }

    const data = await res.json();
    if (data.access_token) {
      const expiresInSec = data.expires_in || 28800;
      const updatedSession: TeslaSession = {
        ...session,
        access_token: data.access_token,
        refresh_token: data.refresh_token || session.refresh_token,
        expires_in: expiresInSec,
        expires_at: Date.now() + expiresInSec * 1000,
      };
      saveTeslaSession(updatedSession);
      return updatedSession;
    }
  } catch (e) {
    console.warn('Silent token refresh error:', e);
  }

  return session;
}

async function teslaFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response | null> {
  let session = await refreshTeslaTokenIfNeeded(false);
  if (!session) return null;

  const doRequest = async (token: string) => {
    return fetch(`${FLEET_API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  };

  try {
    let response = await doRequest(session.access_token);
    if (response.status === 401 && session.refresh_token) {
      const refreshed = await refreshTeslaTokenIfNeeded(true);
      if (refreshed && refreshed.access_token !== session.access_token) {
        response = await doRequest(refreshed.access_token);
      }
    }
    return response;
  } catch (e) {
    console.warn(`Tesla Fleet API request error (${path}):`, e);
    return null;
  }
}

export type TeslaMediaCommand =
  | 'media_volume_up'
  | 'media_volume_down'
  | 'media_toggle_playback';

export async function sendTeslaMediaCommand(
  command: TeslaMediaCommand
): Promise<boolean> {
  const session = getTeslaSession();
  if (!session) return false;

  const res = await teslaFetch(
    `/api/1/vehicles/${session.vehicle_id}/command/${command}`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    }
  );

  return Boolean(res && res.ok);
}

export async function sendMultipleVolumeCommands(
  command: 'media_volume_up' | 'media_volume_down',
  times: number
): Promise<void> {
  for (let i = 0; i < times; i++) {
    await sendTeslaMediaCommand(command);
    if (i < times - 1) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
}

export interface TeslaDriveState {
  shift_state: 'P' | 'D' | 'R' | 'N' | null;
  speed?: number | null;
}

export async function getTeslaDriveState(): Promise<TeslaDriveState | null> {
  const session = getTeslaSession();
  if (!session) return null;

  const res = await teslaFetch(
    `/api/1/vehicles/${session.vehicle_id}/vehicle_data?endpoints=drive_state`,
    {
      method: 'GET',
    }
  );

  if (!res || !res.ok) return null;

  try {
    const json = await res.json();
    const driveState = json?.response?.drive_state;
    if (!driveState) return null;
    return {
      shift_state: driveState.shift_state ?? null,
      speed: driveState.speed ?? null,
    };
  } catch (e) {
    console.warn('Error parsing Tesla drive_state:', e);
    return null;
  }
}
