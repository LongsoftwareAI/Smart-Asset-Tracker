import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createOpaqueToken,
  hashOpaqueToken,
  normalizeEmail,
  validatePassword,
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
