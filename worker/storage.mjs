function objectUrl(env, key) {
  const bucket = encodeURIComponent(env.SUPABASE_STORAGE_BUCKET || 'melsou-assets');
  const path = String(key).split('/').map(encodeURIComponent).join('/');
  return `${env.SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
}

function headers(env, extra = {}) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    ...extra
  };
}

export function createSupabaseStorage(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_STORAGE_NOT_CONFIGURED');
  return {
    async put(key, value, options = {}) {
      const metadata = options.httpMetadata || {};
      const response = await fetch(objectUrl(env, key), {
        method: 'POST',
        headers: headers(env, {
          'Content-Type': metadata.contentType || 'application/octet-stream',
          'Cache-Control': metadata.cacheControl || 'private, no-store',
          'x-upsert': 'true'
        }),
        body: value
      });
      if (!response.ok) throw new Error(`SUPABASE_STORAGE_PUT_FAILED:${response.status}`);
      return { key };
    },
    async get(key) {
      const response = await fetch(objectUrl(env, key), { headers: headers(env) });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`SUPABASE_STORAGE_GET_FAILED:${response.status}`);
      return response;
    },
    async delete(key) {
      const response = await fetch(objectUrl(env, key), { method: 'DELETE', headers: headers(env) });
      if (!response.ok && response.status !== 404) throw new Error(`SUPABASE_STORAGE_DELETE_FAILED:${response.status}`);
    }
  };
}

export function withPrivateStorage(env) {
  if (env.MELSOU_ASSETS) return env;
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return env;
  return Object.assign(Object.create(env), { MELSOU_ASSETS: createSupabaseStorage(env) });
}
