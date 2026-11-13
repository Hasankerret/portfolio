import { projectUrl, publishableKey } from './config.js';

export const configured = Boolean(projectUrl && publishableKey);
const base = projectUrl.replace(/\/$/, '');
const bucket = 'portfolio-media';
let session;

async function request(path, {method = 'GET', body, headers = {}, anonymous = false} = {}) {
  if (!configured) throw new Error('Connect Supabase using the setup guide.');
  if (!anonymous && session && Date.now() >= session.expires_at * 1000 - 30000) {
    session = await request('/auth/v1/token?grant_type=refresh_token', {
      method:'POST', body:{refresh_token:session.refresh_token}, anonymous:true
    });
  }
  const token = anonymous ? null : session?.access_token;
  const response = await fetch(base + path, {
    method, cache:'no-store',
    headers:{apikey:publishableKey, ...(token ? {Authorization:'Bearer '+token} : {}),
      'Content-Type':'application/json', ...headers},
    body:body instanceof Blob ? body : body === undefined ? undefined : JSON.stringify(body)
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.msg || result?.message || result?.error_description || 'Request failed ('+response.status+').');
  return result;
}

export const api = {
  publicContent: () => request('/rest/v1/rpc/portfolio_published', {method:'POST', body:{}, anonymous:true}),
  async signIn(email, password) {
    session = await request('/auth/v1/token?grant_type=password', {method:'POST', body:{email,password}, anonymous:true});
    try {
      if (!await request('/rest/v1/rpc/portfolio_is_owner', {method:'POST', body:{}})) {
        throw new Error('This account does not have portfolio access.');
      }
      return await api.load();
    } catch (error) {
      await api.signOut();
      throw error;
    }
  },
  async signOut() {
    try { if (session) await request('/auth/v1/logout', {method:'POST'}); }
    finally { session = undefined; }
  },
  async load() {
    const [row] = await request('/rest/v1/portfolio?id=eq.true&select=site,projects,revision');
    if (!row) throw new Error('The portfolio has not been seeded or access has been revoked.');
    return row;
  },
  async save(row, changes) {
    const [saved] = await request('/rest/v1/portfolio?id=eq.true&revision=eq.'+row.revision, {
      method:'PATCH', headers:{Prefer:'return=representation'}, body:{...changes, revision:row.revision+1}
    });
    if (!saved) throw new Error('This tab is out of date or access was revoked. Sign in again to load the latest version.');
    return saved;
  },
  async upload(file, kind) {
    const extension = await checkFile(file, kind);
    const name = crypto.randomUUID()+'.'+extension;
    await request('/storage/v1/object/'+bucket+'/'+name, {
      method:'POST', body:file, headers:{'Content-Type':file.type,'cache-control':'no-store'}
    });
    return 'upload:'+name;
  },
  async media(reference, fallbackPrefix = '') {
    if (/^images\/[a-z0-9_.-]+$/i.test(reference)) return fallbackPrefix + reference;
    if (!/^upload:[a-f0-9-]{36}\.(png|jpg|webp|gif|pdf)$/.test(reference)) return '';
    const signed = await request('/storage/v1/object/sign/'+bucket+'/'+reference.slice(7), {
      method:'POST', body:{expiresIn:600}
    });
    return base+'/storage/v1'+signed.signedURL;
  }
};

export function webUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

export async function checkFile(file, kind) {
  const types = kind === 'pdf' ? {'application/pdf':'pdf'} : {
    'image/png':'png', 'image/jpeg':'jpg', 'image/webp':'webp', 'image/gif':'gif'
  };
  const extension = types[file.type];
  if (!Object.hasOwn(types,file.type) || !file.size || file.size > 10*1024*1024) {
    throw new Error('Choose '+(kind === 'pdf' ? 'a PDF' : 'a PNG, JPEG, WebP or GIF')+' up to 10 MB.');
  }
  const bytes = new Uint8Array(await file.slice(0,12).arrayBuffer());
  const ascii = new TextDecoder().decode(bytes);
  const valid = {
    pdf:ascii.startsWith('%PDF-'), png:[137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n),
    jpg:bytes[0]===255 && bytes[1]===216 && bytes[2]===255,
    webp:ascii.startsWith('RIFF') && ascii.slice(8)==='WEBP',
    gif:/^GIF8[79]a/.test(ascii)
  };
  if (!valid[extension]) throw new Error('The file contents do not match its type.');
  return extension;
}

