import { ContractError } from './backend-contracts.mjs';

export const PASSWORD_ITERATIONS = 100000;
const encoder = new TextEncoder();

export function normalizeUsername(value) {
  const username = String(value || '').normalize('NFKC').trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) throw new ContractError('INVALID_USERNAME');
  return username;
}

export function assertPassword(value) {
  if (typeof value !== 'string' || value.length < 12 || value.length > 128 || encoder.encode(value).byteLength > 256 || !/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    throw new ContractError('INVALID_PASSWORD');
  }
  return value;
}

export function normalizeOptionalEmail(value) {
  const email = String(value || '').normalize('NFKC').trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ContractError('INVALID_EMAIL');
  return email;
}

export function randomSecret(bytes = 32) {
  const value = new Uint8Array(bytes); crypto.getRandomValues(value);
  return [...value].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function derivePassword(password, saltHex = randomSecret(16), iterations = PASSWORD_ITERATIONS) {
  assertPassword(password);
  if (!/^[0-9a-f]{32}$/i.test(saltHex) || !Number.isSafeInteger(iterations) || iterations < 1000) throw new ContractError('INVALID_PASSWORD_KDF');
  const salt = Uint8Array.from(saltHex.match(/../g), (value) => Number.parseInt(value, 16));
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, material, 256);
  const hashHex = [...new Uint8Array(bits)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return { hashHex, saltHex: saltHex.toLowerCase(), iterations };
}

export async function verifyPassword(password, credential) {
  try {
    const candidate = await derivePassword(password, credential.password_salt, Number(credential.password_iterations));
    const expected = String(credential.password_hash || '');
    if (expected.length !== candidate.hashHex.length) return false;
    let difference = 0;
    for (let index = 0; index < expected.length; index += 1) difference |= expected.charCodeAt(index) ^ candidate.hashHex.charCodeAt(index);
    return difference === 0;
  } catch { return false; }
}
