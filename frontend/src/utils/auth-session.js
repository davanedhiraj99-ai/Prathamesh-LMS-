let accessToken = '';

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token || '';
}

export function getStoredUser() {
  const raw = localStorage.getItem('user');
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

export function setStoredUser(user) {
  if (!user) {
    localStorage.removeItem('user');
    return;
  }

  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuthSession() {
  accessToken = '';
  localStorage.removeItem('user');
}
