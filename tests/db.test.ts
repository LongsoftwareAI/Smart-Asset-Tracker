import assert from 'node:assert/strict';
import test from 'node:test';
import { getDatabaseUrl } from '../server/db.js';

test('uses DATABASE_URL as the sole database connection setting', () => {
  assert.equal(
    getDatabaseUrl({ DATABASE_URL: 'postgresql://assetmate:secret@localhost:5432/assetmate' }),
    'postgresql://assetmate:secret@localhost:5432/assetmate'
  );
});

test('fails fast when DATABASE_URL is missing', () => {
  assert.throws(() => getDatabaseUrl({}), /DATABASE_URL/);
});
