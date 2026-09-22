import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import * as MESSAGES from '../shared/messages';

test('message catalog exposes stable authentication messages', () => {
  assert.equal(MESSAGES.WRONG_PASSWORD, 'Email hoặc mật khẩu không đúng.');
  assert.equal(MESSAGES.PASSWORD_TOO_SHORT, 'Mật khẩu phải có ít nhất 12 ký tự.');
});

test('message catalog preserves dynamic asset messages', () => {
  assert.equal(MESSAGES.ASSET_NOT_FOUND('DRILL-021'), 'Không tìm thấy thông tin tài sản DRILL-021');
});
