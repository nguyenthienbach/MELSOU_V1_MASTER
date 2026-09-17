import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const rawApp = await readFile(new URL('../demo/recovery_fb38/app.js', import.meta.url), 'utf8');
const app = rawApp.replace(/\r\n/g, '\n');
const auth = await readFile(new URL('../demo/recovery_fb38/auth-client.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../demo/recovery_fb38/index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../demo/recovery_fb38/styles.css', import.meta.url), 'utf8');

const startIdx = app.indexOf('// 📖 FB91: BLOG INTERACTIONS & COMMENTS SYSTEM CONTROLLER');
const endIdx = app.indexOf('// ============================================================\n// 💬 FB48: REALTIME CUSTOMER CHAT & SUPPORT INBOX SYSTEM');
const blogSlice = app.slice(startIdx, endIdx);

function createMockElement(id = '', tag = 'div') {
  const listeners = new Map();
  const el = {
    id,
    tagName: tag.toUpperCase(),
    style: {},
    classList: {
      _classes: new Set(),
      add(c) { el.classList._classes.add(c); },
      remove(c) { el.classList._classes.delete(c); },
      toggle(c, force) {
        if (force === undefined) {
          if (el.classList._classes.has(c)) { el.classList._classes.delete(c); return false; }
          el.classList._classes.add(c); return true;
        }
        if (force) { el.classList._classes.add(c); return true; }
        el.classList._classes.delete(c); return false;
      },
      contains(c) { return el.classList._classes.has(c); }
    },
    attributes: {},
    setAttribute(k, v) { el.attributes[k] = String(v); },
    getAttribute(k) { return el.attributes[k] ?? null; },
    removeAttribute(k) { delete el.attributes[k]; },
    children: [],
    parentElement: null,
    appendChild(child) {
      el.children.push(child);
      child.parentElement = el;
      return child;
    },
    querySelectorAll(sel) {
      const results = [];
      const match = (item) => {
        if (sel.startsWith('.')) {
          const className = sel.slice(1);
          if (item.classList.contains(className)) results.push(item);
        } else if (sel.includes('[data-action]')) {
          if (item.attributes['data-action'] !== undefined) results.push(item);
        }
        for (const c of item.children) match(c);
      };
      for (const c of el.children) match(c);
      return results;
    },
    querySelector(sel) {
      const all = el.querySelectorAll(sel);
      return all.length > 0 ? all[0] : null;
    },
    closest(sel) {
      let curr = el;
      while (curr) {
        if (sel.includes('button[data-action][data-comment-id]')) {
          if (curr.tagName === 'BUTTON' && curr.attributes['data-action'] !== undefined && curr.attributes['data-comment-id'] !== undefined) {
            return curr;
          }
        }
        if (sel.includes('button[data-action]')) {
          if (curr.tagName === 'BUTTON' && curr.attributes['data-action'] !== undefined) {
            return curr;
          }
        }
        curr = curr.parentElement;
      }
      return null;
    },
    addEventListener(evt, fn) {
      if (!listeners.has(evt)) listeners.set(evt, []);
      listeners.get(evt).push(fn);
    },
    removeEventListener(evt, fn) {
      if (listeners.has(evt)) {
        listeners.set(evt, listeners.get(evt).filter(cb => cb !== fn));
      }
    },
    dispatchEvent(evt) {
      const list = listeners.get(evt.type) || [];
      for (const cb of list) {
        cb(evt);
      }
    },
    _listeners: listeners,
    focus() { el.focused = true; },
    innerHTML: '',
    textContent: '',
    value: '',
    disabled: false
  };
  return el;
}

function parseHtmlToDom(htmlString) {
  const root = {
    tag: '#root',
    attributes: {},
    children: [],
    textContent: '',
    parent: null
  };
  let current = root;
  const tagRegex = /<!--[\s\S]*?-->|<(\/)?([a-z0-9-]+)((?:\s+[^=>\s]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/)?>|([^<]+)/gi;
  let match;
  while ((match = tagRegex.exec(htmlString)) !== null) {
    const [, isClosing, tagName, attrString, isSelfClosing, textContent] = match;
    if (textContent) {
      if (current) current.textContent += textContent;
    } else if (tagName) {
      if (isClosing) {
        if (current && current.parent && current.tag === tagName.toLowerCase()) {
          current = current.parent;
        }
      } else {
        const attrs = {};
        if (attrString) {
          const attrRegex = /([^\s=>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
          let aMatch;
          while ((aMatch = attrRegex.exec(attrString)) !== null) {
            const attrName = aMatch[1].toLowerCase();
            const attrVal = aMatch[2] ?? aMatch[3] ?? aMatch[4] ?? '';
            attrs[attrName] = attrVal;
          }
        }
        const node = {
          tag: tagName.toLowerCase(),
          attributes: attrs,
          children: [],
          textContent: '',
          parent: current
        };
        current.children.push(node);
        const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
        if (!isSelfClosing && !voidTags.has(tagName.toLowerCase())) {
          current = node;
        }
      }
    }
  }
  return root;
}

function createTestHarness() {
  const domElements = new Map();
  const getOrCreate = (id, tag = 'div') => {
    if (!domElements.has(id)) {
      domElements.set(id, createMockElement(id, tag));
    }
    return domElements.get(id);
  };

  const dom = {
    elements: domElements,
    addEventListener() {},
    removeEventListener() {},
    getElementById(id) { return getOrCreate(id); },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    createElement(tag) { return createMockElement('', tag); }
  };

  const sandbox = {
    document: dom,
    window: {
      innerWidth: 1024,
      confirm: () => true,
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {},
      location: { pathname: '/blog/test-slug', hostname: 'localhost' }
    },
    currentUser: { loggedIn: true, role: 'OWNER', name: 'Owner User' },
    escapeHtml: (s) => String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;'),
    formatBlogTimeAgo: () => '1 giờ trước',
    resetBlogSearchState: () => {},
    Event: class MockEvent { constructor(type) { this.type = type; } },
    CustomEvent: class MockCustomEvent { constructor(type) { this.type = type; } },
    showToast: () => {},
    console: { log() {}, warn() {}, error() {} },
    setTimeout,
    clearTimeout,
    URLSearchParams,
    Set,
    Map,
    Date
  };
  sandbox.window.document = dom;
  sandbox.globalThis = sandbox;

  vm.runInNewContext(blogSlice, sandbox);
  const { window } = sandbox;
  const { ownerBlogModerationState, blogInteractionsState } = window;
  return { sandbox, dom, getOrCreate, window, ownerBlogModerationState, blogInteractionsState };
}

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
  assert.match(auth, /codexListOwnerBlogComments/);
  assert.match(auth, /codexModerateBlogComment/);
  assert.match(auth, /new URLSearchParams\(\)/);
  assert.match(auth, /params\.set\('post_slug', postSlug\)/);
  assert.match(auth, /api\(`\/owner\/blog\/comments\?\$\{params\.toString\(\)\}`\)/);
  assert.doesNotMatch(auth, /codexUpdateBlogComment[^\n]+user_id/);
  assert.doesNotMatch(auth, /codexListOwnerBlogComments[^\n]+(?:user_id|role)/);
  assert.doesNotMatch(app, /user_id:\s*currentUser/);
});

test('OWNER moderation markup contains zero inline on* event handlers', () => {
  const { sandbox } = createTestHarness();
  const validUuid = '11111111-1111-4111-8111-111111111111';

  for (const status of ['visible', 'hidden', 'deleted']) {
    const rowHtml = sandbox.renderOwnerCommentRow({
      id: validUuid,
      author_name: 'Author Name',
      content: 'Comment Content',
      status
    });

    assert.doesNotMatch(rowHtml, /\bon[a-z]+\s*=/i, `Markup for status ${status} must not contain inline event handlers`);
    if (status !== 'deleted') {
      assert.match(rowHtml, /data-action="/);
      assert.match(rowHtml, /data-comment-id="/);
    }
  }
});

test('executable behavioral: Concurrent double-click triggers lock without duplicate dispatch and releases lock on completion', async () => {
  const { window, getOrCreate, ownerBlogModerationState } = createTestHarness();
  const validUuid = '12345678-1234-4234-8234-123456789abc';

  let resolveModerationCall;
  let moderationCallCount = 0;
  window.codexModerateBlogComment = async (id, status) => {
    moderationCallCount++;
    return new Promise((resolve) => {
      resolveModerationCall = resolve;
    });
  };

  ownerBlogModerationState.comments = [
    { id: validUuid, status: 'visible', content: 'Double click target' }
  ];

  const listEl = getOrCreate('ownerBlogCommentsList');
  window.setupOwnerBlogCommentsDelegation();

  // Create DOM row and child button in mock DOM
  const row = getOrCreate(`ownerCommentRow-${validUuid}`);
  const btn = createMockElement(`ownerModHideBtn-${validUuid}`, 'button');
  btn.classList.add('owner-mod-btn');
  btn.classList.add('hide-btn');
  btn.setAttribute('data-action', 'hidden');
  btn.setAttribute('data-comment-id', validUuid);
  row.appendChild(btn);

  assert.equal(btn.disabled, false);
  assert.equal(btn.getAttribute('aria-busy'), null);
  assert.equal(row.getAttribute('aria-busy'), null);

  // 1. Dispatch first valid click (starts pending request)
  listEl.dispatchEvent({ type: 'click', target: btn });

  // Yield to allow executeOwnerCommentModeration to set lock and call API
  await new Promise((r) => setTimeout(r, 10));

  // Verify production code set lock on row and button automatically without test setting them
  assert.equal(moderationCallCount, 1, 'First click must call API');
  assert.equal(btn.disabled, true, 'Production code must disable button');
  assert.equal(btn.getAttribute('aria-busy'), 'true', 'Production code must mark button aria-busy');
  assert.equal(row.getAttribute('aria-busy'), 'true', 'Production code must mark row aria-busy');

  // 2. Dispatch second click on the same comment while request is still pending
  // NOTE: Test does NOT set disabled or aria-busy manually; production code already did it
  listEl.dispatchEvent({ type: 'click', target: btn });
  await new Promise((r) => setTimeout(r, 10));

  // Verify second click was rejected and API was NOT called again
  assert.equal(moderationCallCount, 1, 'Concurrent second click must NOT call API again');

  // 3. Resolve the pending API call
  resolveModerationCall({ ok: true });
  await new Promise((r) => setTimeout(r, 15));

  // Verify lock is released and attributes restored
  assert.equal(btn.disabled, false, 'Button disabled must be released');
  assert.equal(btn.getAttribute('aria-busy'), null, 'Button aria-busy must be removed');
  assert.equal(row.getAttribute('aria-busy'), null, 'Row aria-busy must be removed');
});

test('executable behavioral: Listener idempotency prevents duplicate click registrations on repeated setup', async () => {
  const { window, getOrCreate, ownerBlogModerationState } = createTestHarness();
  const validUuid = '12345678-1234-4234-8234-123456789abc';

  let apiCallCount = 0;
  window.codexModerateBlogComment = async () => {
    apiCallCount++;
    return { ok: true };
  };

  ownerBlogModerationState.comments = [
    { id: validUuid, status: 'visible', content: 'Idempotency test' }
  ];

  const listEl = getOrCreate('ownerBlogCommentsList');

  // Call setupOwnerBlogCommentsDelegation multiple times on the same container
  window.setupOwnerBlogCommentsDelegation();
  window.setupOwnerBlogCommentsDelegation();
  window.setupOwnerBlogCommentsDelegation();

  // Verify only 1 click listener was registered on the container
  const clickListeners = listEl._listeners.get('click') || [];
  assert.equal(clickListeners.length, 1, 'Only exactly 1 click listener must be attached');

  // Verify 1 click dispatch creates exactly 1 moderation call (not 2 or 3)
  const row = getOrCreate(`ownerCommentRow-${validUuid}`);
  const btn = createMockElement(`ownerModHideBtn-${validUuid}`, 'button');
  btn.classList.add('owner-mod-btn');
  btn.setAttribute('data-action', 'hidden');
  btn.setAttribute('data-comment-id', validUuid);
  row.appendChild(btn);

  listEl.dispatchEvent({ type: 'click', target: btn });
  await new Promise((r) => setTimeout(r, 10));

  assert.equal(apiCallCount, 1, 'A single click must create exactly one moderation call despite repeated setup');
});

test('executable behavioral: Canonical action allowlist rejects aliases and unrecognized actions', async () => {
  const { window, getOrCreate, ownerBlogModerationState } = createTestHarness();
  const validUuid = '12345678-1234-4234-8234-123456789abc';

  let apiCalls = [];
  window.codexModerateBlogComment = async (id, status) => {
    apiCalls.push({ id, status });
    return { ok: true };
  };

  ownerBlogModerationState.comments = [
    { id: validUuid, status: 'visible', content: 'Action allowlist test' }
  ];

  const listEl = getOrCreate('ownerBlogCommentsList');
  window.setupOwnerBlogCommentsDelegation();

  // Aliases (hide, show, delete) and other actions must all be rejected
  const rejectedActions = ['hide', 'show', 'delete', 'admin', 'approve', 'reject', 'purge', ''];

  for (const action of rejectedActions) {
    const btn = createMockElement(`btn-${action || 'empty'}`, 'button');
    btn.setAttribute('data-action', action);
    btn.setAttribute('data-comment-id', validUuid);

    listEl.dispatchEvent({ type: 'click', target: btn });
    await new Promise((r) => setTimeout(r, 5));

    assert.equal(apiCalls.length, 0, `Action "${action}" must be rejected and not dispatch`);
    assert.equal(ownerBlogModerationState.comments[0].status, 'visible');
  }

  // Also test invalid UUIDs:
  const invalidIdBtn = createMockElement('btn-invalid-uuid', 'button');
  invalidIdBtn.setAttribute('data-action', 'hidden');
  invalidIdBtn.setAttribute('data-comment-id', 'non-uuid-string');
  listEl.dispatchEvent({ type: 'click', target: invalidIdBtn });
  await new Promise((r) => setTimeout(r, 5));
  assert.equal(apiCalls.length, 0, 'Malformed UUID must not dispatch');

  // Verify canonical actions DO dispatch:
  const allowedActions = ['hidden', 'visible', 'deleted'];
  for (const action of allowedActions) {
    const btn = createMockElement(`btn-${action}`, 'button');
    btn.setAttribute('data-action', action);
    btn.setAttribute('data-comment-id', validUuid);

    listEl.dispatchEvent({ type: 'click', target: btn });
    await new Promise((r) => setTimeout(r, 10));

    assert.equal(apiCalls.length > 0, true, `Canonical action "${action}" must dispatch`);
    assert.equal(apiCalls[apiCalls.length - 1].status, action);
  }
});

test('executable behavioral: Malicious-author DOM parsing confirms no script, no on* attributes, and safe text content', () => {
  const { sandbox, getOrCreate } = createTestHarness();
  const validUuid = '11111111-2222-4333-8444-555555555555';
  const evilAuthor = `Evil " onerror="alert('XSS')" onclick="alert(1)" <script>alert(2)</script> <img src=x onerror=alert(3)> ' onmouseover='alert(4)' javascript:alert(5)`;

  sandbox.blogInteractionsState.comments = [
    {
      id: validUuid,
      author_name: evilAuthor,
      content: 'Hello World',
      created_at: new Date().toISOString(),
      like_count: 0,
      reply_count: 0,
      can_edit: false
    }
  ];

  const rowHtml = sandbox.renderOwnerCommentRow({
    id: validUuid,
    author_name: evilAuthor,
    content: 'Hello World',
    status: 'visible'
  });

  // Parse markup into DOM node tree
  const parsedDom = parseHtmlToDom(rowHtml);

  // Collect all nodes
  const allNodes = [];
  const collect = (node) => {
    allNodes.push(node);
    for (const child of node.children) collect(child);
  };
  collect(parsedDom);

  // 1. Confirm no <script> or unexpected tags (e.g. <img>, <iframe>) were injected into DOM
  const tagNames = allNodes.map((n) => n.tag);
  assert.equal(tagNames.includes('script'), false, 'DOM tree must not contain <script>');
  assert.equal(tagNames.includes('img'), false, 'DOM tree must not contain <img>');
  assert.equal(tagNames.includes('iframe'), false, 'DOM tree must not contain <iframe>');
  const allowedTags = new Set(['#root', 'div', 'span', 'button']);
  for (const tag of tagNames) {
    assert.equal(allowedTags.has(tag), true, `Unexpected tag in DOM tree: <${tag}>`);
  }

  // 2. Confirm no attribute starts with 'on' on any node in the DOM tree
  for (const node of allNodes) {
    for (const attrName of Object.keys(node.attributes)) {
      assert.equal(attrName.startsWith('on'), false, `DOM node <${node.tag}> must not have on* attribute: ${attrName}`);
    }
  }

  // 3. Confirm no attribute contains executable javascript: URL
  for (const node of allNodes) {
    for (const [attrName, attrVal] of Object.entries(node.attributes)) {
      assert.doesNotMatch(attrVal, /^\s*javascript:/i, `Attribute ${attrName} must not contain javascript: URL`);
    }
  }

  // 4. Confirm author name appears strictly as escaped safe text inside .owner-comment-author
  const authorNode = allNodes.find((n) => n.attributes['class'] === 'owner-comment-author');
  assert.notEqual(authorNode, undefined, 'Author span must exist in DOM tree');
  assert.equal(authorNode.children.length, 0, 'Author node must have 0 child elements');
  assert.match(authorNode.textContent, /Evil/);
  assert.match(authorNode.textContent, /&lt;script&gt;/);
  assert.match(authorNode.textContent, /&quot;/);

  // 5. If item.id itself is attempted injection, it is rejected by isValidBlogUuid
  const rejectedHtml = sandbox.renderOwnerCommentRow({
    id: evilAuthor,
    author_name: 'Test',
    content: 'Payload in ID',
    status: 'visible'
  });
  assert.equal(rejectedHtml, '', 'Non-UUID comment row must return empty string');

  const input = getOrCreate(`blogReplyInput-${validUuid}`, 'textarea');
  const box = getOrCreate(`blogInlineReplyBox-${validUuid}`, 'div');
  sandbox.toggleInlineReplyBox(validUuid);

  assert.equal(input.placeholder, `Phản hồi cho ${evilAuthor}...`);
  assert.equal(box.classList.contains('open'), true);
});

test('executable behavioral: Active status filter transitions: visible -> hidden, hidden -> visible, visible/hidden -> deleted', async () => {
  const { window, ownerBlogModerationState, getOrCreate } = createTestHarness();

  window.codexModerateBlogComment = async () => ({ ok: true });

  const id1 = '11111111-1111-4111-8111-111111111111';
  const id2 = '22222222-2222-4222-8222-222222222222';
  const id3 = '33333333-3333-4333-8333-333333333333';
  const id4 = '44444444-4444-4444-8444-444444444444';
  const id5 = '55555555-5555-4555-8555-555555555555';

  // visible -> hidden
  ownerBlogModerationState.selectedStatus = 'visible';
  ownerBlogModerationState.comments = [
    { id: id1, status: 'visible', content: 'C1' },
    { id: id2, status: 'visible', content: 'C2' }
  ];
  await window.executeOwnerCommentModeration(id1, 'hidden');
  assert.equal(ownerBlogModerationState.comments.length, 1);
  assert.equal(ownerBlogModerationState.comments[0].id, id2);

  // hidden -> visible
  ownerBlogModerationState.selectedStatus = 'hidden';
  ownerBlogModerationState.comments = [
    { id: id3, status: 'hidden', content: 'C3' },
    { id: id4, status: 'hidden', content: 'C4' }
  ];
  await window.executeOwnerCommentModeration(id3, 'visible');
  assert.equal(ownerBlogModerationState.comments.length, 1);
  assert.equal(ownerBlogModerationState.comments[0].id, id4);

  // visible -> deleted
  ownerBlogModerationState.selectedStatus = 'visible';
  ownerBlogModerationState.comments = [
    { id: id5, status: 'visible', content: 'C5' }
  ];
  await window.executeOwnerCommentModeration(id5, 'deleted');
  assert.equal(ownerBlogModerationState.comments.length, 0);

  const emptyEl = getOrCreate('ownerBlogCommentsEmpty');
  const listWrap = getOrCreate('ownerBlogCommentsListWrap');
  const pagEl = getOrCreate('ownerBlogCommentsPagination');
  assert.equal(emptyEl.style.display, 'block');
  assert.equal(listWrap.style.display, 'none');
  assert.equal(pagEl.style.display, 'none');
});

test('executable behavioral: Filter = all updates row in-place without removing it', async () => {
  const { window, ownerBlogModerationState } = createTestHarness();

  window.codexModerateBlogComment = async () => ({ ok: true });
  const id1 = 'aaaaaaaa-1111-4111-8111-111111111111';

  ownerBlogModerationState.selectedStatus = 'all';
  ownerBlogModerationState.comments = [
    { id: id1, status: 'visible', content: 'Original Content' }
  ];

  await window.executeOwnerCommentModeration(id1, 'hidden');
  assert.equal(ownerBlogModerationState.comments.length, 1);
  assert.equal(ownerBlogModerationState.comments[0].status, 'hidden');

  await window.executeOwnerCommentModeration(id1, 'deleted');
  assert.equal(ownerBlogModerationState.comments.length, 1);
  assert.equal(ownerBlogModerationState.comments[0].status, 'deleted');
  assert.equal(ownerBlogModerationState.comments[0].content, '[Đã xóa]');
});

test('executable behavioral: Root vs Reply summary reconciliation', async () => {
  const { window, ownerBlogModerationState, blogInteractionsState } = createTestHarness();

  let summaryFetchedCount = 0;
  window.codexGetBlogInteractions = async () => {
    summaryFetchedCount++;
    return {
      liked: false,
      like_count: 5,
      comment_count: 10,
      share_count: 2,
      view_count: 100,
      comments_open: true
    };
  };
  window.codexModerateBlogComment = async () => ({ ok: true });
  blogInteractionsState.activeSlug = 'test-post';

  const rootId = 'bbbbbbbb-1111-4111-8111-111111111111';
  const replyId = 'cccccccc-1111-4111-8111-111111111111';

  ownerBlogModerationState.comments = [
    { id: rootId, post_slug: 'test-post', is_reply: false, status: 'visible' }
  ];
  await window.executeOwnerCommentModeration(rootId, 'hidden');
  assert.equal(summaryFetchedCount, 1, 'Root comment moderation must trigger summary reconciliation');
  assert.equal(blogInteractionsState.commentCount, 10);

  summaryFetchedCount = 0;
  ownerBlogModerationState.comments = [
    { id: replyId, post_slug: 'test-post', is_reply: true, parent_comment_id: rootId, status: 'visible' }
  ];
  await window.executeOwnerCommentModeration(replyId, 'hidden');
  assert.equal(summaryFetchedCount, 0, 'Reply moderation must NOT trigger summary fetch');
  assert.equal(blogInteractionsState.commentCount, 10, 'Reply moderation must NOT alter root commentCount');
});

test('executable behavioral: Integration hook missing produces structured UI error without network fallback', async () => {
  const { window, getOrCreate } = createTestHarness();

  delete window.codexListOwnerBlogComments;

  const errorEl = getOrCreate('ownerBlogCommentsError');
  const errorText = getOrCreate('ownerBlogCommentsErrorText');

  await window.loadOwnerBlogComments({ reset: true });

  assert.equal(errorEl.style.display, 'block');
  assert.match(errorText.textContent, /Thiếu hook window\.codexListOwnerBlogComments/);
});

test('executable behavioral: Stale response dropped when rapid filter changes occur', async () => {
  const { window, ownerBlogModerationState } = createTestHarness();

  let resolveFirstCall;
  const firstPromise = new Promise((resolve) => { resolveFirstCall = resolve; });

  window.codexListOwnerBlogComments = async ({ status }) => {
    if (status === 'visible') {
      return firstPromise;
    }
    return { comments: [{ id: '11111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa', status: 'hidden' }], next_cursor: null };
  };

  ownerBlogModerationState.selectedStatus = 'visible';
  const p1 = window.loadOwnerBlogComments({ reset: true });

  ownerBlogModerationState.selectedStatus = 'hidden';
  const p2 = window.loadOwnerBlogComments({ reset: true });

  await p2;
  assert.equal(ownerBlogModerationState.comments.length, 1);
  assert.equal(ownerBlogModerationState.comments[0].id, '11111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

  resolveFirstCall({ comments: [{ id: '22222222-bbbb-4bbb-8bbb-bbbbbbbbbbbb', status: 'visible' }], next_cursor: null });
  await p1;

  assert.equal(ownerBlogModerationState.comments.length, 1);
  assert.equal(ownerBlogModerationState.comments[0].id, '11111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
});

test('executable behavioral: Mobile touch target >= 44x44px and ARIA attributes present', () => {
  assert.match(css, /\.owner-mod-btn[\s\S]*?min-height:\s*44px;/);
  assert.match(css, /\.owner-mod-btn[\s\S]*?min-width:\s*44px;/);

  assert.match(html, /id="ownerBlogCommentsLoading"[^>]*role="status"/);
  assert.match(html, /id="ownerBlogCommentsLoading"[^>]*aria-live="polite"/);
  assert.match(html, /id="ownerBlogCommentsError"[^>]*role="alert"/);
  assert.match(html, /id="ownerBlogCommentsError"[^>]*aria-live="assertive"/);
});

test('executable behavioral: Public comment and reply handlers validate UUIDs and support delegation', async () => {
  const { window, getOrCreate, blogInteractionsState } = createTestHarness();
  const validUuid = '99999999-9999-4999-8999-999999999999';

  blogInteractionsState.comments = [
    {
      id: validUuid,
      author_name: 'Regular Customer',
      content: 'Hello World',
      liked: false,
      like_count: 0,
      reply_count: 0,
      can_edit: true
    }
  ];

  // 1. Invalid UUID on handlers should silently return without effect
  const invalidId = 'not-a-valid-uuid';
  await window.handleBlogCommentLikeClick(invalidId);
  assert.equal(blogInteractionsState.comments[0].liked, false, 'Invalid UUID must not trigger comment like');

  await window.deleteBlogComment(invalidId, false);
  assert.equal(blogInteractionsState.comments.length, 1, 'Invalid UUID must not trigger comment delete');

  // 2. Public comment list delegation: reply button click
  const listEl = getOrCreate('blogCommentsList');
  window.setupBlogCommentsDelegation();

  const replyBtn = createMockElement('blogReplyBtn', 'button');
  replyBtn.setAttribute('data-action', 'reply');
  replyBtn.setAttribute('data-comment-id', validUuid);

  const replyBox = getOrCreate(`blogInlineReplyBox-${validUuid}`, 'div');
  const replyInput = getOrCreate(`blogReplyInput-${validUuid}`, 'textarea');

  listEl.dispatchEvent({ type: 'click', target: replyBtn });
  assert.equal(replyBox.classList.contains('open'), true, 'Delegated click on reply button must open reply box');
  assert.equal(replyInput.placeholder, 'Phản hồi cho Regular Customer...');
});
