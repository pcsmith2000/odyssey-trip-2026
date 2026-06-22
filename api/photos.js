// GET /api/photos?day=<m-d>
// Lists photos stored for a given trip day, oldest first.
import { list } from '@vercel/blob';
import { isValidDay } from './_day.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const day = req.query.day;
  if (!isValidDay(day)) {
    res.status(400).json({ error: 'Invalid or missing day.' });
    return;
  }
  // No store configured yet → behave as "no photos" rather than erroring,
  // so the gallery degrades gracefully before Blob is wired up.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    res.status(200).json({ day, photos: [], unconfigured: true });
    return;
  }

  try {
    const { blobs } = await list({ prefix: `photos/${day}/` });
    const photos = blobs
      .map((b) => ({ url: b.url, pathname: b.pathname, size: b.size, uploadedAt: b.uploadedAt }))
      .sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));
    res.status(200).json({ day, photos });
  } catch (e) {
    res.status(500).json({ error: 'Could not list photos.', detail: String(e && e.message || e) });
  }
}
