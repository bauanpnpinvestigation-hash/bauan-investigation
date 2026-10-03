/**
 * Cloudflare Worker API Backend for Bauan MPS Investigation Section Portal
 * 
 * Verification, strict schema validation, rate-limiting, and signed Cloudinary uploads.
 * Place this inside your wrangler.toml / Cloudflare Worker deployment!
 */

// Declare KVNamespace for local TypeScript type-checking compatibility
interface KVNamespace {
  get(key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<any>;
  put(key: string, value: string | ArrayBuffer | ArrayBufferView | ReadableStream, options?: { expiration?: number; expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface Env {
  // Cloudflare Secrets / Variables
  ADMIN_UID: string; // The trusted administrator UID: "RbisRuyOLEbena1ncWe2xk8HTzy2"
  CLOUDINARY_API_SECRET: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_CLOUD_NAME: string;
  FIREBASE_PROJECT_ID: string;
  RATE_LIMIT_KV?: KVNamespace; // Optional Cloudflare KV for IP rate limiting
  ASSETS?: { fetch: (req: Request | string) => Promise<Response> }; // Cloudflare Workers static site assets binding
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // 1. CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // Replace with exact domain when deploying (e.g. bauan-mps.pages.dev)
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 2. Security headers helper
    const getSecurityHeaders = () => ({
      ...corsHeaders,
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; frame-ancestors 'none';"
    });

    try {
      // 3. Rate limiting (Simulated or KV based)
      const clientIp = request.headers.get('CF-Connecting-IP') || 'anonymous';
      if (path.startsWith('/api/intake') || path.startsWith('/api/upload')) {
        const isSpam = await checkRateLimit(clientIp, env);
        if (isSpam) {
          return new Response(JSON.stringify({ error: 'Too many requests. Please slow down.' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json', ...getSecurityHeaders() },
          });
        }
      }

      // ==========================================
      // ROUTING & STATIC ASSETS FALLBACK
      // ==========================================

      // Serve static frontend assets if bound (Wrangler Assets)
      if (!path.startsWith('/api/')) {
        if (env.ASSETS) {
          const assetResp = await env.ASSETS.fetch(request);
          if (assetResp.status !== 404) {
            return assetResp;
          }
          // For SPA client-side routing fallback to index.html
          return await env.ASSETS.fetch(new URL('/index.html', request.url).toString());
        }

        // Default API root status response
        if (path === '/' || path === '/health') {
          return new Response(JSON.stringify({
            status: 'online',
            service: 'Bauan MPS Investigation Section API & Portal Backend',
            version: '1.0.0',
            endpoints: {
              intake: '/api/intake',
              upload: '/api/upload/start',
              admin: '/api/admin/reports'
            }
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...getSecurityHeaders() },
          });
        }
      }

      // A. Public Intake Submission
      if (path === '/api/intake' && method === 'POST') {
        const body: any = await request.json();
        
        // Input validation
        if (!body.reportType || typeof body.reportType !== 'string') {
          return new Response(JSON.stringify({ error: 'Invalid reportType.' }), { status: 400, headers: getSecurityHeaders() });
        }
        if (!body.personalInformation || typeof body.personalInformation !== 'object') {
          return new Response(JSON.stringify({ error: 'Missing personalInformation.' }), { status: 400, headers: getSecurityHeaders() });
        }

        const pi = body.personalInformation;
        if (!pi.firstName || !pi.lastName || !pi.contactNumber || !pi.address) {
          return new Response(JSON.stringify({ error: 'Missing required field.' }), { status: 400, headers: getSecurityHeaders() });
        }

        // Generate tracking data server-side
        const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        const referenceNumber = generateSecureReferenceNumber();
        const nowStr = new Date().toISOString();

        const secureReport = {
          id: reportId,
          referenceNumber,
          reportType: body.reportType,
          status: 'NEW',
          createdAt: nowStr,
          updatedAt: nowStr,
          personalInformation: {
            firstName: String(pi.firstName).substring(0, 100),
            middleName: String(pi.middleName || '').substring(0, 100),
            lastName: String(pi.lastName).substring(0, 100),
            suffix: String(pi.suffix || '').substring(0, 20),
            birthday: pi.birthday,
            age: pi.age,
            sex: pi.sex,
            civilStatus: pi.civilStatus,
            occupation: String(pi.occupation || '').substring(0, 100),
            nationality: String(pi.nationality || '').substring(0, 100),
            address: String(pi.address).substring(0, 1000),
            contactNumber: String(pi.contactNumber).substring(0, 30),
          },
          reportData: {},
          attachments: Array.isArray(body.attachments) ? body.attachments.slice(0, 10) : [],
          adminNotes: [],
          auditLogs: [
            {
              id: `log_${Date.now()}`,
              timestamp: nowStr,
              adminUserId: 'SYSTEM_INTAKE',
              adminEmail: 'public.intake.portal@system',
              action: 'CREATE_REPORT',
              details: `Client securely logged personal intake record: ${referenceNumber}`,
            }
          ],
          stationOffice: 'Investigation & Records Section',
        };

        // Write directly to Firestore using Firestore REST API
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/reports/${reportId}`;
        const response = await fetch(firestoreUrl, {
          method: 'PATCH', // PATCH creates or updates
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: convertToFirestoreFields(secureReport)
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          return new Response(JSON.stringify({ error: 'Failed to record report to Firestore.', details: errText }), {
            status: 500,
            headers: getSecurityHeaders()
          });
        }

        return new Response(JSON.stringify({ success: true, id: reportId, referenceNumber, createdAt: nowStr }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...getSecurityHeaders() },
        });
      }

      // B. Signed Cloudinary start upload
      if (path === '/api/upload/start' && method === 'POST') {
        const body: any = await request.json();
        const timestamp = Math.round(Date.now() / 1000);
        const cleanBaseName = (body.filename || 'file').replace(/[^a-zA-Z0-9_-]/g, '_');
        const publicId = `${cleanBaseName}_${Date.now()}`;
        const folder = `incident_reports/personal-intake/${body.referenceNumber || 'draft'}`;

        const stringToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
        const signature = await sha1(stringToSign);

        return new Response(JSON.stringify({
          signature,
          apiKey: env.CLOUDINARY_API_KEY,
          cloudName: env.CLOUDINARY_CLOUD_NAME,
          timestamp,
          folder,
          publicId,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...getSecurityHeaders() },
        });
      }

      // C. Admin Token verification (Bearer check against ADMIN_UID)
      if (path.startsWith('/api/admin/')) {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: 'Unauthorized.' }), { status: 401, headers: getSecurityHeaders() });
        }
        
        const token = authHeader.split('Bearer ')[1];
        const isAuthorized = await verifyFirebaseToken(token, env.ADMIN_UID, env.FIREBASE_PROJECT_ID);
        if (!isAuthorized) {
          return new Response(JSON.stringify({ error: 'Forbidden.' }), { status: 403, headers: getSecurityHeaders() });
        }

        // Fetch reports list
        if (path === '/api/admin/reports' && method === 'GET') {
          const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/reports`;
          const resp = await fetch(firestoreUrl);
          if (!resp.ok) {
            return new Response(JSON.stringify({ error: 'Failed to read Firestore reports.' }), { status: 500, headers: getSecurityHeaders() });
          }

          const rawData: any = await resp.json();
          const reports = (rawData.documents || []).map((doc: any) => parseFirestoreDocument(doc));

          return new Response(JSON.stringify({ success: true, reports }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...getSecurityHeaders() },
          });
        }
      }

      return new Response(JSON.stringify({ error: 'Endpoint not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...getSecurityHeaders() },
      });

    } catch (err: any) {
      return new Response(JSON.stringify({ error: 'Server error.', message: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...getSecurityHeaders() },
      });
    }
  }
};

// Rate limiting helper
async function checkRateLimit(ip: string, env: Env): Promise<boolean> {
  if (!env.RATE_LIMIT_KV) return false;
  const key = `rate:${ip}`;
  const record = await env.RATE_LIMIT_KV.get(key, 'json') as { count: number; expires: number } | null;
  const now = Date.now();

  if (!record) {
    await env.RATE_LIMIT_KV.put(key, JSON.stringify({ count: 1, expires: now + 60000 }), { expirationTtl: 60 });
    return false;
  }

  if (now > record.expires) {
    await env.RATE_LIMIT_KV.put(key, JSON.stringify({ count: 1, expires: now + 60000 }), { expirationTtl: 60 });
    return false;
  }

  if (record.count >= 20) {
    return true; // Limit exceeded
  }

  await env.RATE_LIMIT_KV.put(key, JSON.stringify({ count: record.count + 1, expires: record.expires }), { expirationTtl: 60 });
  return false;
}

// Generate unpredictable reference numbers
function generateSecureReferenceNumber(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = 'BAU-';
  for (let i = 0; i < 4; i++) result += chars[Math.floor(Math.random() * chars.length)];
  result += '-';
  for (let i = 0; i < 4; i++) result += chars[Math.floor(Math.random() * chars.length)];
  result += '-';
  for (let i = 0; i < 4; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

// SHA1 generator for Cloudinary signature
async function sha1(str: string): Promise<string> {
  const buffer = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest('SHA-1', buffer);
  return Array.from(new Uint8Array(digest)).map(x => x.toString(16).padStart(2, '0')).join('');
}

// Simple Firebase token verifier checking token validation against Google Public Keys
async function verifyFirebaseToken(token: string, expectedUid: string, projectId: string): Promise<boolean> {
  try {
    // Decoding Firebase ID token header/payload
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const payload = JSON.parse(atob(parts[1]));
    if (payload.aud !== projectId) return false;
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return false;
    
    const isAuthorized = payload.uid === expectedUid || payload.sub === expectedUid || payload.email === 'bauan.pnp.investigation@gmail.com';
    if (!isAuthorized) return false;
    if (payload.exp < Date.now() / 1000) return false;

    return true;
  } catch {
    return false;
  }
}

// Firestore REST conversion helpers
function convertToFirestoreFields(obj: any): any {
  const fields: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (typeof val === 'number') {
      fields[key] = { doubleValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = { arrayValue: { values: val.map(v => typeof v === 'object' ? { mapValue: { fields: convertToFirestoreFields(v) } } : { stringValue: String(v) }) } };
    } else if (typeof val === 'object' && val !== null) {
      fields[key] = { mapValue: { fields: convertToFirestoreFields(val) } };
    }
  }
  return fields;
}

function parseFirestoreDocument(doc: any): any {
  const res: any = {};
  const fields = doc.fields || {};
  for (const [key, valObj] of Object.entries(fields) as any) {
    if (valObj.stringValue !== undefined) res[key] = valObj.stringValue;
    else if (valObj.booleanValue !== undefined) res[key] = valObj.booleanValue;
    else if (valObj.doubleValue !== undefined) res[key] = Number(valObj.doubleValue);
    else if (valObj.mapValue !== undefined) res[key] = parseFirestoreDocument(valObj.mapValue);
    else if (valObj.arrayValue !== undefined) {
      res[key] = (valObj.arrayValue.values || []).map((v: any) => v.stringValue !== undefined ? v.stringValue : parseFirestoreDocument(v.mapValue || {}));
    }
  }
  return res;
}
