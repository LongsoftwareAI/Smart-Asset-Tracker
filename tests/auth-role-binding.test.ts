import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('Header receives the logged-in account name and does not expose a role switcher', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const header = readFileSync(new URL('../src/components/Header.tsx', import.meta.url), 'utf8');

  assert.match(app, /currentRole=\{user\.role\}/);
  assert.match(app, /accountName=\{user\.name\}/);
  assert.match(header, /id="btn-logout-mobile"/);
  assert.match(header, /mobile-role-select[\s\S]*disabled/);
});
