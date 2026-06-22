// POST /api/upload?day=<m-d>&filename=<name>
// Body: raw image bytes. Stores to Vercel Blob under photos/<day>/<id>.<ext>.
// Guardrails: valid trip day · image content-type · <= 15 MB · PAST DAYS ONLY.
import { put } from '@vercel/blob';
import { isValidDay, isPastDay } from './_day.js';

export const config = { api: { bodyParser: false } };

const MAX_BYTES = 15 * 1024 * 1024;

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (c) => {
      total += c.length;
      if (total > MAX_BYTES) {
        reject(Object.assign(new Error('too large'), { code: 'TOO_LARGE' }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    res.status(503).json({ error: 'Photo storage is not configured yet. Connect a Vercel Blob store to this project.' });
    return;
  }

  const day = req.query.day;
  const filename = req.query.filename || '';
  if (!isValidDay(day)) {
    res.status(400).json({ error: 'Invalid or missing day.' });
    return;
  }
  if (!isPastDay(day)) {
    res.status(403).json({ error: 'Photos can only be added for days that have already happened.' });
    return;
  }

  const contentType = req.headers['content-type'] || 'application/octet-stream';
  if (!/^image\//.test(contentType)) {
    res.status(415).json({ error: 'Only image files are allowed.' });
    return;
  }

  let body;
  try {
    body = await readBody(req);
  } catch (e) {
    if (e.code === 'TOO_LARGE') {
      res.status(413).json({ error: 'Image is too large (max 15 MB).' });
      return;
    }
    res.status(400).json({ error: 'Could not read upload.' });
    return;
  }
  if (!body || body.length === 0) {
    res.status(400).json({ error: 'Empty upload.' });
    return;
  }

  const extRaw = filename.includes('.') ? filename.split('.').pop() : '';
  const ext = (extRaw || contentType.split('/')[1] || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const pathname = `photos/${day}/${id}.${ext}`;

  try {
    const blob = await put(pathname, body, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
    });
    res.status(200).json({ url: blob.url, pathname: blob.pathname, day });
  } catch (e) {
    res.status(500).json({ error: 'Upload failed.', detail: String(e && e.message || e) });
  }
}
