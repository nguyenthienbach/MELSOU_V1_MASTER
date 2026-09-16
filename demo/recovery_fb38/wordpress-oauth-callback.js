(function wordpressOauthCallback() {
  'use strict';
  const status = document.getElementById('wordpressOauthStatus');
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const providerError = params.get('error');
  window.history.replaceState({}, '', '/wordpress-oauth-callback');

  const fail = () => { if (status) status.textContent = 'Không thể hoàn tất kết nối WordPress. Vui lòng bắt đầu lại từ Melsou.'; };
  if (providerError || !code || !state) { fail(); return; }

  fetch('/api/wordpress/oauth/callback', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, state })
  }).then((response) => {
    if (!response.ok) throw new Error('WORDPRESS_OAUTH_CALLBACK_FAILED');
    if (status) status.textContent = 'WordPress đã được kết nối an toàn với Melsou.';
  }).catch(fail);
}());
