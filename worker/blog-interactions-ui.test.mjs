import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../demo/recovery_fb38/app.js', import.meta.url), 'utf8');
const auth = await readFile(new URL('../demo/recovery_fb38/auth-client.js', import.meta.url), 'utf8');

test('interaction UI locks duplicate writes and ignores stale summary responses', () => {
  assert.match(app, /pendingPostLike/);
  assert.match(app, /pendingCommentLikes\.has\(commentId\)/);
  assert.match(app, /pendingCommentLikes\.has\(replyId\)/);
  assert.match(app, /pendingShares\.has\(pendingKey\)/);
  assert.match(app, /summaryRequestId !== summaryRequestId/);
  assert.match(app, /likeBtn\.disabled = true/);
});

test('interaction bar has visible loading and error states without production mock fallback', () => {
  assert.match(app, /Đang tải tương tác/);
  assert.match(app, /Không thể tải tương tác/);
  assert.match(app, /isLocalDevHost/);
  assert.doesNotMatch(app, /console\.error\([^)]*(?:password|token|session)/i);
});

test('frontend integration exposes ownership mutations without client identity', () => {
  assert.match(auth, /codexUpdateBlogComment/);
  assert.match(auth, /codexDeleteBlogComment/);
  assert.match(auth, /codexModerateBlogComment/);
  assert.doesNotMatch(auth, /codexUpdateBlogComment[^\n]+user_id/);
  assert.doesNotMatch(app, /user_id:\s*currentUser/);
});
