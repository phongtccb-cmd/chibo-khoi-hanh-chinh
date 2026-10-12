const MAX_BODY_BYTES = 64000;
const CANDIDATE = 'Phạm Cao Cường - Nhân viên Phòng Công tác xã hội';
const MEETING = 'Lấy ý kiến xét kết nạp Đảng - Phạm Cao Cường';
const FIELD_LIMITS = {
  political: 3000,
  ethics: 3000,
  competence: 3000,
  relations: 3000,
  limitations: 3000,
};

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return json({ message: 'Phương thức không được hỗ trợ.' }, 405);
  }
  let identity;
  try {
    identity = await getAccessIdentity(request, env);
  } catch (error) {
    console.error('Unable to verify Cloudflare Access identity:', error);
    return json({ message: 'Không thể xác minh đăng nhập lúc này. Vui lòng thử lại sau.' }, 503);
  }
  if (!identity) {
    return json({ message: 'Phiên Cloudflare Access không hợp lệ hoặc đã hết hạn. Đăng nhập lại để gửi ý kiến.' }, 401);
  }
  if (!env.OPINIONS_DB) {
    return json({ message: 'Cơ sở dữ liệu lấy ý kiến chưa được cấu hình.' }, 503);
  }

  const contentType = request.headers.get('content-type') || '';
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (!contentType.toLowerCase().includes('application/json') || contentLength > MAX_BODY_BYTES) {
    return json({ message: 'Yêu cầu không hợp lệ hoặc vượt quá dung lượng cho phép.' }, 400);
  }

  let body;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return json({ message: 'Nội dung gửi lên vượt quá dung lượng cho phép.' }, 413);
    }
    body = JSON.parse(raw);
  } catch {
    return json({ message: 'Dữ liệu gửi lên không đúng định dạng.' }, 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ message: 'Dữ liệu gửi lên không đúng định dạng.' }, 400);
  }

  const fields = {};
  for (const [name, maxLength] of Object.entries(FIELD_LIMITS)) {
    const value = typeof body[name] === 'string' ? body[name].trim() : '';
    if ((!value && name !== 'limitations') || value.length > maxLength) {
      return json({ message: `Vui lòng kiểm tra trường "${name}" (không được để trống và tối đa ${maxLength} ký tự).` }, 400);
    }
    fields[name] = value;
  }
  if (!['approve', 'reject'].includes(body.vote)) {
    return json({ message: 'Vui lòng chọn phương án biểu quyết.' }, 400);
  }

  try {
    await env.OPINIONS_DB.prepare(`
      INSERT INTO party_opinions (
        candidate, candidate_key, meeting, meeting_key, respondent_email,
        political, ethics, competence, relations, limitations, other, vote
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      CANDIDATE,
      normalizedKey(CANDIDATE),
      MEETING,
      normalizedKey(MEETING),
      identity.email,
      fields.political,
      fields.ethics,
      fields.competence,
      fields.relations,
      fields.limitations,
      '',
      body.vote
    ).run();
  } catch (error) {
    if (error && /UNIQUE constraint failed/i.test(error.message || '')) {
      return json({ message: 'Tài khoản của bạn đã gửi phiếu cho đợt lấy ý kiến Phạm Cao Cường.' }, 409);
    }
    console.error('Unable to save party consultation response:', error);
    return json({ message: 'Không lưu được ý kiến. Vui lòng thử lại sau hoặc liên hệ quản trị viên.' }, 500);
  }

  return json({ ok: true }, 201);
}

async function getAccessIdentity(request, env) {
  const issuer = String(env.CF_ACCESS_TEAM_DOMAIN || '').replace(/\/+$/, '');
  const audience = String(env.CF_ACCESS_AUD || '');
  const assertion = request.headers.get('cf-access-jwt-assertion');
  if (!issuer || !audience || !assertion) return null;

  const parts = assertion.split('.');
  if (parts.length !== 3) return null;

  let header;
  let claims;
  try {
    header = JSON.parse(decodeBase64Url(parts[0]));
    claims = JSON.parse(decodeBase64Url(parts[1]));
  } catch {
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  if (header.alg !== 'RS256' || !header.kid || claims.iss !== issuer ||
      !Array.isArray(claims.aud) || !claims.aud.includes(audience) ||
      !claims.email || typeof claims.email !== 'string' ||
      !Number.isFinite(claims.exp) || claims.exp <= now ||
      (claims.nbf && claims.nbf > now)) {
    return null;
  }

  const response = await fetch(`${issuer}/cdn-cgi/access/certs`, {
    headers: { 'Accept': 'application/json' },
    cf: { cacheTtl: 300, cacheEverything: true },
  });
  if (!response.ok) throw new Error(`Cloudflare Access JWKS returned ${response.status}.`);
  const keySet = await response.json();
  const jwk = Array.isArray(keySet.keys) ? keySet.keys.find(key => key.kid === header.kid) : null;
  if (!jwk) return null;
  const publicKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const signedContent = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const signature = decodeBase64UrlBytes(parts[2]);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, signature, signedContent);
  return valid ? { email: claims.email.trim().toLowerCase() } : null;
}

function normalizedKey(value) {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
}

function decodeBase64Url(value) {
  return new TextDecoder().decode(decodeBase64UrlBytes(value));
}

function decodeBase64UrlBytes(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
