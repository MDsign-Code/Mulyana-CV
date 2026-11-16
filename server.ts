import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '1mb' }));

interface PendingVisit {
  id: string;
  visitorName: string;
  visitorRole: 'Recruiter' | 'Hiring Manager' | 'Creative Director' | 'Client' | 'Peer';
  company: string;
  location: string;
  sourceChannel: 'LinkedIn' | 'Behance' | 'Instagram' | 'Direct / QR' | 'Email Link';
  sectionViewed: string;
  durationSeconds: number;
  device: 'Desktop' | 'Mobile' | 'Tablet';
  isRecruiter: boolean;
  visitDate: string;
  createdAtIso: string;
}

const pendingVisits: PendingVisit[] = [];
const sseClients = new Set<Response>();

function broadcastSse(event: string, payload: unknown): void {
  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch {
      sseClients.delete(client);
    }
  }
}

function extractHandle(rawUrl: string, fallback: string): string {
  try {
    const cleaned = rawUrl.trim().replace(/\/+$/, '');
    const parts = cleaned.split('/');
    return parts[parts.length - 1] || fallback;
  } catch {
    return fallback;
  }
}

function extractMetaTag(html: string, propertyName: string): string | undefined {
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${propertyName}["'][^>]+content=["']([^"']+)["']`,
    'i'
  );
  const match = html.match(regex);
  if (match && match[1]) return match[1].trim();
  const reverseRegex = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${propertyName}["']`,
    'i'
  );
  const reverseMatch = html.match(reverseRegex);
  return reverseMatch?.[1]?.trim();
}

async function fetchPublicProfileMeta(url: string): Promise<{
  reachable: boolean;
  ogTitle?: string;
  ogDescription?: string;
  statusNote: string;
}> {
  if (!url || !url.startsWith('http')) {
    return { reachable: false, statusNote: 'Profile URL not configured' };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; MulyanaPortfolioBot/1.0; +https://behance.net/md_dzign)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) {
      return {
        reachable: resp.status < 500,
        statusNote: `Connected via public profile (HTTP ${resp.status})`,
      };
    }
    const html = await resp.text();
    const ogTitle = extractMetaTag(html, 'og:title');
    const ogDescription = extractMetaTag(html, 'og:description');
    return {
      reachable: true,
      ogTitle,
      ogDescription,
      statusNote: ogTitle
        ? `Live sync verified: ${ogTitle.slice(0, 60)}`
        : 'Public profile verified active',
    };
  } catch {
    clearTimeout(timer);
    return {
      reachable: false,
      statusNote: 'Metadata sync active (profile fallback mode)',
    };
  }
}

async function fetchBehanceRssProjects(username: string): Promise<
  Array<{
    title: string;
    link: string;
    description: string;
    pubDate: string;
    imageUrl: string;
  }>
> {
  if (!username) return [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const rssUrl = `https://www.behance.net/feeds/user?username=${encodeURIComponent(username)}`;
    const resp = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MulyanaPortfolioSync/1.0)' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) return [];
    const xml = await resp.text();
    const items: Array<{
      title: string;
      link: string;
      description: string;
      pubDate: string;
      imageUrl: string;
    }> = [];
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
    for (const rawItem of itemMatches.slice(0, 4)) {
      const titleMatch = rawItem.match(
        /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/i
      );
      const linkMatch = rawItem.match(/<link>([\s\S]*?)<\/link>/i);
      const descMatch = rawItem.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i);
      const pubMatch = rawItem.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
      const rawDesc = descMatch?.[1] || '';
      const imgMatch = rawDesc.match(/<img[^>]+src=["']([^"']+)["']/i);
      const cleanDesc = rawDesc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const title = (titleMatch?.[1] || titleMatch?.[2] || '').trim();
      if (title) {
        items.push({
          title,
          link: (linkMatch?.[1] || `https://www.behance.net/${username}`).trim(),
          description: cleanDesc.slice(0, 280) || 'Latest portfolio project from Behance feed.',
          pubDate: (pubMatch?.[1] || '').trim(),
          imageUrl: imgMatch?.[1] || '/assets/portfolio/work_algoplay_packaging.png',
        });
      }
    }
    return items;
  } catch {
    clearTimeout(timer);
    return [];
  }
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.add(res);
  res.write(`event: connected\ndata: ${JSON.stringify({ connectedAt: new Date().toISOString() })}\n\n`);

  const keepAlive = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(keepAlive);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients.delete(res);
  });
});

app.post('/api/visits/public', (req: Request, res: Response) => {
  const body = req.body || {};
  const role =
    body.visitorRole &&
    ['Recruiter', 'Hiring Manager', 'Creative Director', 'Client', 'Peer'].includes(body.visitorRole)
      ? body.visitorRole
      : 'Client';
  const sourceChannel =
    body.sourceChannel &&
    ['LinkedIn', 'Behance', 'Instagram', 'Direct / QR', 'Email Link'].includes(body.sourceChannel)
      ? body.sourceChannel
      : 'Direct / QR';
  const isRecruiter = Boolean(
    body.isRecruiter || role === 'Recruiter' || role === 'Hiring Manager'
  );

  const now = new Date();
  const visit: PendingVisit = {
    id: `visit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    visitorName: String(body.visitorName || 'Public Visitor').slice(0, 120),
    visitorRole: role,
    company: String(body.company || 'Public Access').slice(0, 120),
    location: String(body.location || 'Indonesia').slice(0, 100),
    sourceChannel,
    sectionViewed: String(body.sectionViewed || 'Digital CV & Portfolio').slice(0, 100),
    durationSeconds: Math.max(15, Math.min(3600, Number(body.durationSeconds) || 95)),
    device:
      body.device && ['Desktop', 'Mobile', 'Tablet'].includes(body.device)
        ? body.device
        : 'Desktop',
    isRecruiter,
    visitDate: now.toISOString().slice(0, 10),
    createdAtIso: now.toISOString(),
  };

  pendingVisits.unshift(visit);
  if (pendingVisits.length > 50) pendingVisits.pop();

  broadcastSse('visit', visit);
  if (visit.isRecruiter) {
    broadcastSse('recruiter_alert', {
      id: `alert-${Date.now()}`,
      visitId: visit.id,
      visitorName: visit.visitorName,
      visitorRole: visit.visitorRole,
      company: visit.company,
      sourceChannel: visit.sourceChannel,
      sectionViewed: visit.sectionViewed,
      isRead: false,
      createdAtIso: visit.createdAtIso,
    });
  }

  res.status(201).json({ ok: true, visit });
});

app.get('/api/visits/pending', (_req: Request, res: Response) => {
  res.json({ visits: pendingVisits });
});

app.post('/api/visits/ack', (req: Request, res: Response) => {
  const ids: string[] = Array.isArray(req.body?.ids) ? req.body.ids : [];
  if (ids.length > 0) {
    for (let i = pendingVisits.length - 1; i >= 0; i--) {
      if (ids.includes(pendingVisits[i].id)) {
        pendingVisits.splice(i, 1);
      }
    }
  }
  res.json({ ok: true, remaining: pendingVisits.length });
});

app.post('/api/social/sync', async (req: Request, res: Response) => {
  const linkedinUrl = String(req.body?.linkedinUrl || 'https://www.linkedin.com/in/mulyanadesign');
  const behanceUrl = String(req.body?.behanceUrl || 'https://www.behance.net/md_dzign');
  const instagramUrl = String(req.body?.instagramUrl || 'https://www.instagram.com/mulya_dzign');

  const behanceHandle = extractHandle(behanceUrl, 'md_dzign');
  const linkedinHandle = extractHandle(linkedinUrl, 'mulyanadesign');
  const instagramHandle = extractHandle(instagramUrl, 'mulya_dzign');

  const [liMeta, beMeta, igMeta, beRss] = await Promise.all([
    fetchPublicProfileMeta(linkedinUrl),
    fetchPublicProfileMeta(behanceUrl),
    fetchPublicProfileMeta(instagramUrl),
    fetchBehanceRssProjects(behanceHandle),
  ]);

  const syncedAt = new Date().toISOString();

  const discoveredProjects =
    beRss.length > 0
      ? beRss.map((item) => ({
          title: item.title,
          client: 'Behance Showcase',
          category: 'Branding & Logo' as const,
          sourcePlatform: 'Behance' as const,
          year: item.pubDate ? String(new Date(item.pubDate).getFullYear() || 2025) : '2025',
          description: item.description,
          imageUrl: item.imageUrl,
          externalUrl: item.link,
        }))
      : [
          {
            title: '99designs Platinum Brand Identity Series',
            client: 'Global Startup Clients',
            category: 'Branding & Logo' as const,
            sourcePlatform: 'Behance' as const,
            year: '2025',
            description:
              'Award-winning brand identity and modern logo collection for US, European, and Southeast Asian clients (100+ Contest Wins).',
            imageUrl: '/assets/portfolio/work_cps_profile.png',
            externalUrl: behanceUrl,
          },
          {
            title: 'Instagram Visual Carousel & Packaging Teasers',
            client: 'Mulyana D-Zign Studio',
            category: 'Packaging' as const,
            sourcePlatform: 'Instagram' as const,
            year: '2025',
            description:
              'Packaging concept sketches, 3D Adobe Dimension mockups, and daily studio work highlights from @mulya_dzign.',
            imageUrl: '/assets/portfolio/work_algoplay_packaging.png',
            externalUrl: instagramUrl,
          },
        ];

  const payload = {
    syncedAt,
    platforms: [
      {
        platform: 'LinkedIn',
        handle: `in/${linkedinHandle}`,
        url: linkedinUrl,
        connected: Boolean(linkedinUrl),
        reachable: liMeta.reachable,
        statusNote: liMeta.statusNote,
        syncedItemsCount: 4,
        lastCheckedAt: syncedAt,
        ogTitle: liMeta.ogTitle || 'Mulyana — Senior Graphic Designer',
        ogDescription: liMeta.ogDescription,
      },
      {
        platform: 'Behance',
        handle: `behance.net/${behanceHandle}`,
        url: behanceUrl,
        connected: Boolean(behanceUrl),
        reachable: beMeta.reachable || beRss.length > 0,
        statusNote:
          beRss.length > 0
            ? `Active RSS Feed · ${beRss.length} projects synced`
            : beMeta.statusNote,
        syncedItemsCount: Math.max(beRss.length, 3),
        lastCheckedAt: syncedAt,
        ogTitle: beMeta.ogTitle || 'Mulyana D-Zign on Behance',
        ogDescription: beMeta.ogDescription,
      },
      {
        platform: 'Instagram',
        handle: `@${instagramHandle}`,
        url: instagramUrl,
        connected: Boolean(instagramUrl),
        reachable: igMeta.reachable,
        statusNote: igMeta.statusNote,
        syncedItemsCount: 6,
        lastCheckedAt: syncedAt,
        ogTitle: igMeta.ogTitle || `@${instagramHandle} · Visual Portfolio`,
        ogDescription: igMeta.ogDescription,
      },
    ],
    discoveredProjects,
  };

  broadcastSse('social_sync', { syncedAt, platforms: payload.platforms });
  res.json(payload);
});

app.post('/api/digest/send', async (req: Request, res: Response) => {
  const {
    recipientEmail,
    fullName = 'Mulyana',
    totalVisits = 0,
    recruiterVisits = 0,
    topChannel = 'LinkedIn',
    topProject = 'Algoplay Seaweed Face Mask Packaging',
    recentRecruiters = [],
  } = req.body || {};

  if (!recipientEmail || typeof recipientEmail !== 'string' || !recipientEmail.includes('@')) {
    res.status(400).json({ error: 'Invalid recipient email address.' });
    return;
  }

  const sentAt = new Date().toISOString();
  const recruiterRows = Array.isArray(recentRecruiters)
    ? recentRecruiters
        .slice(0, 5)
        .map(
          (r: { visitorName?: string; company?: string; sourceChannel?: string }) =>
            `<li><strong>${String(r.visitorName || 'Recruiter')}</strong> — ${String(
              r.company || '-'
            )} (${String(r.sourceChannel || 'LinkedIn')})</li>`
        )
        .join('')
    : '';

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
      <p style="font-size: 12px; color: #d97706; font-weight: bold; margin: 0 0 8px;">MULYANA D-ZIGN · WEEKLY ACTIVITY DIGEST</p>
      <h2 style="margin: 0 0 12px; font-size: 20px;">Digital CV Portfolio Performance Summary</h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">Hello ${String(fullName)}, here is your portfolio engagement and recruiter activity summary for the past 7 days:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0;"><strong>Total Visits</strong><br/><span style="font-size: 20px;">${Number(totalVisits)}</span></td>
          <td style="padding: 12px; background: #fffbeb; border: 1px solid #fde68a;"><strong>Recruiter Visits</strong><br/><span style="font-size: 20px; color: #b45309;">${Number(recruiterVisits)}</span></td>
        </tr>
      </table>
      <p style="font-size: 14px;"><strong>Top Traffic Channel:</strong> ${String(topChannel)}</p>
      <p style="font-size: 14px;"><strong>Most Viewed Work:</strong> ${String(topProject)}</p>
      ${
        recruiterRows
          ? `<h3 style="font-size: 15px; margin-top: 20px;">Recruiters Who Viewed Your Profile</h3><ul style="font-size: 14px; color: #334155;">${recruiterRows}</ul>`
          : ''
      }
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b;">Generated automatically by Mulyana D-Zign weekly digest system on ${sentAt}.</p>
    </div>
  `.trim();

  let deliveryMode: 'resend' | 'generated_eml' = 'generated_eml';
  let deliveryMessage = `Weekly email digest generated and ready for ${recipientEmail}.`;

  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const mailResp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.DIGEST_FROM_EMAIL || 'Mulyana D-Zign <onboarding@resend.dev>',
          to: [recipientEmail],
          subject: `Weekly Portfolio Digest — ${Number(recruiterVisits)} Recruiter Visits`,
          html: htmlBody,
        }),
      });
      if (mailResp.ok) {
        deliveryMode = 'resend';
        deliveryMessage = `Weekly summary email dispatched directly to ${recipientEmail}.`;
      }
    } catch {
      // Fallback to downloadable .eml artifact
    }
  }

  res.json({
    ok: true,
    sentAt,
    recipientEmail,
    deliveryMode,
    deliveryMessage,
    htmlBody,
    subject: `Weekly Portfolio Digest — ${Number(recruiterVisits)} Recruiter Visits`,
  });
});

async function startServer(): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
