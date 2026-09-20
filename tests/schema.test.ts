import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('database schema contains the auth and asset integrity tables', () => {
  const schema = readFileSync(new URL('../database/schema.sql', import.meta.url), 'utf8');

  for (const table of [
    'users',
    'project_memberships',
    'assets',
    'asset_transactions',
    'refresh_tokens',
    'password_reset_tokens',
    'audit_logs',
  ]) {
    assert.match(schema, new RegExp(`CREATE TABLE ${table}`));
  }

  assert.match(schema, /token_hash char\(64\) NOT NULL UNIQUE/);
  assert.match(schema, /assets_checkout_state CHECK/);
});
