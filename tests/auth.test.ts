import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createOpaqueToken,
  hashOpaqueToken,
  normalizeEmail,
  signAccessToken,
  validatePassword,
  verifyAccessToken,
} from '../server/auth.js';

test('normalizes login emails before lookup', () => {
  assert.equal(normalizeEmail('  ADMIN@AssetMate.VN '), 'admin@assetmate.vn');
});

test('rejects passwords shorter than 12 characters', () => {
  assert.equal(validatePassword('short'), 'Mật khẩu phải có ít nhất 12 ký tự.');
});

test('creates an opaque reset or refresh token whose hash is deterministic', () => {
  const token = createOpaqueToken();

  assert.match(token, /^[a-f0-9]{64}$/);
  assert.equal(hashOpaqueToken(token), hashOpaqueToken(token));
  assert.notEqual(hashOpaqueToken(token), token);
});

test('signs and verifies a short-lived access token with only identity claims', () => {
  const token = signAccessToken(
    { userId: 'USER-005', email: 'admin@assetmate.vn', role: 'ADMIN' },
    { JWT_ACCESS_SECRET: 'test-access-secret' }
  );

  assert.deepEqual(verifyAccessToken(token, { JWT_ACCESS_SECRET: 'test-access-secret' }), {
    userId: 'USER-005',
    email: 'admin@assetmate.vn',
    role: 'ADMIN',
  });
});
