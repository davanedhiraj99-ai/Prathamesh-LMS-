const DEVICE_ID_KEY = 'deviceId';

export function getDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = globalThis.crypto?.randomUUID?.() || `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

export function getDeviceName() {
  const platform = navigator.platform || 'Unknown platform';
  const vendor = navigator.vendor || 'Browser';
  return `${vendor} on ${platform}`;
}

export function getDeviceFingerprint() {
  return [
    navigator.userAgent || '',
    navigator.language || '',
    navigator.platform || '',
    Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    `${screen.width}x${screen.height}`,
  ].join('|');
}
