import Cookies from 'js-cookie';

const ACCESS_TOKEN = 'access_token';
const REFRESH_TOKEN = 'refresh_token';

export function getAccessToken() {
  return Cookies.get(ACCESS_TOKEN) || '';
}

export function setAccessToken(token: string) {
  Cookies.set(ACCESS_TOKEN, token, { path: '/', sameSite: 'lax' });
}

export function removeAccessToken() {
  Cookies.remove(ACCESS_TOKEN, { path: '/' });
}

export function getRefreshToken() {
  return Cookies.get(REFRESH_TOKEN) || '';
}

export function setRefreshToken(token: string) {
  Cookies.set(REFRESH_TOKEN, token, { path: '/', sameSite: 'lax' });
}

export function removeRefreshToken() {
  Cookies.remove(REFRESH_TOKEN, { path: '/' });
}

export function clearAuthTokens() {
  removeAccessToken();
  removeRefreshToken();
} 