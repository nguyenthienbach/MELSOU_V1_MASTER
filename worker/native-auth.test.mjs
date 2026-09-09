import assert from 'node:assert/strict';
import test from 'node:test';
import { PASSWORD_ITERATIONS, assertPassword, derivePassword, normalizeOptionalEmail, normalizeUsername, randomSecret, verifyPassword } from './native-auth.mjs';

test('native usernames are normalized and strictly bounded', () => {
  assert.equal(normalizeUsername('  Melsou.User_01 '), 'melsou.user_01');
  assert.throws(() => normalizeUsername('ab'), { message: 'INVALID_USERNAME' });
  assert.throws(() => normalizeUsername('bad name'), { message: 'INVALID_USERNAME' });
});

test('password credentials use unique salts and constant-shape verification', async () => {
  assert.equal(PASSWORD_ITERATIONS, 100000);
  assert.equal(assertPassword('correct-horse-9'), 'correct-horse-9');
  assert.throws(() => assertPassword('short1'), { message: 'INVALID_PASSWORD' });
  const first = await derivePassword('correct-horse-9', randomSecret(16), 1000);
  const second = await derivePassword('correct-horse-9', randomSecret(16), 1000);
  assert.notEqual(first.saltHex, second.saltHex); assert.notEqual(first.hashHex, second.hashHex);
  assert.equal(await verifyPassword('correct-horse-9', { password_hash: first.hashHex, password_salt: first.saltHex, password_iterations: 1000 }), true);
  assert.equal(await verifyPassword('wrong-password-9', { password_hash: first.hashHex, password_salt: first.saltHex, password_iterations: 1000 }), false);
});

test('optional linked email is normalized but not required for registration', () => {
  assert.equal(normalizeOptionalEmail(' User@Example.COM '), 'user@example.com');
  assert.throws(() => normalizeOptionalEmail('not-an-email'), { message: 'INVALID_EMAIL' });
});
