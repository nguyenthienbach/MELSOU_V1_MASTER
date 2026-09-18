import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const app = await readFile(new URL('../demo/recovery_fb38/app.js', import.meta.url), 'utf8');
const start = app.indexOf("var activeBlogCategory = 'all';");
const end = app.indexOf('// 📖 FB91: BLOG INTERACTIONS & COMMENTS SYSTEM CONTROLLER');
assert.ok(start >= 0 && end > start, 'Blog storefront controller must remain extractable');
const blogController = app.slice(start, end);

const post = (slug, modifiedAt = '2026-09-18T00:00:00Z') => ({
  slug,
  modifiedAt,
  title: 'Bài viết ' + slug,
  excerpt: '<p>Mô tả</p>',
  content: '<p>Nội dung</p>',
  featuredImage: 'https://cdn.example.test/' + slug + '.jpg',
  publishedAt: '2026-09-18T00:00:00Z',
  category: { id: 1, name: 'Nhật ký Melsou', slug: 'nhat-ky-melsou' }
});

function createContext(payloadText = null) {
  const list = {
    innerHTML: '<article data-ssr="true">SSR cards</article>',
    scrollWidth: 100,
    clientWidth: 100,
    scrollLeft: 0,
    querySelector: () => null,
    scrollTo() {},
    scrollBy() {}
  };
  const elements = {
    publicBlogList: list,
    blogLoadMoreWrap: { style: {}, innerHTML: '' },
    blogCarouselPrevBtn: { style: {}, disabled: false },
    blogCarouselNextBtn: { style: {}, disabled: false }
  };
  if (payloadText !== null) elements.melsouSsrBlogPosts = { textContent: payloadText };
  const context = {
    console,
    URL,
    setTimeout: (callback) => callback(),
    currentAppLanguage: 'vi',
    DOMParser: class {
      parseFromString(value) {
        return { body: { textContent: String(value || '').replace(/<[^>]*>/g, '') } };
      }
    },
    document: {
      getElementById(id) { return elements[id] || null; }
    },
    window: {
      innerWidth: 1366,
      location: { origin: 'https://melsou.com', assign() {} },
      addEventListener() {}
    }
  };
  context.window.window = context.window;
  vm.createContext(context);
  vm.runInContext(blogController, context);
  return { context, list };
}

test('homepage hydration is idempotent and does not duplicate or replace matching SSR cards', async () => {
  const posts = [post('mot'), post('hai')];
  const payload = JSON.stringify({ posts, pagination: { page: 1, total: 2, totalPages: 1 } });
  const { context, list } = createContext(payload);
  assert.equal(context.hydrateSsrBlogPosts(), true);
  assert.equal(context.hydrateSsrBlogPosts(), true);
  assert.equal(context.currentLoadedBlogPosts.length, 2);
  let apiCalls = 0;
  context.window.codexGetPublishedPosts = async () => {
    apiCalls += 1;
    return { posts, pagination: { page: 1, total: 2, totalPages: 1 } };
  };
  await context.renderPublicBlog('all', 1);
  assert.equal(apiCalls, 1);
  assert.equal(list.innerHTML, '<article data-ssr="true">SSR cards</article>');
  assert.equal(context.currentLoadedBlogPosts.length, 2);
});

test('a stale Blog list response cannot overwrite the newest request', async () => {
  const { context } = createContext();
  const pending = [];
  context.window.codexGetPublishedPosts = () => new Promise((resolve) => pending.push(resolve));
  const olderRequest = context.renderPublicBlog('all', 1);
  const newerRequest = context.renderPublicBlog('2', 1);
  pending[1]({ posts: [post('newest-response')], pagination: { page: 1, total: 1, totalPages: 1 } });
  await newerRequest;
  pending[0]({ posts: [post('stale-response')], pagination: { page: 1, total: 1, totalPages: 1 } });
  await olderRequest;
  assert.equal(context.currentLoadedBlogPosts[0].slug, 'newest-response');
});
