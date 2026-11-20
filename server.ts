import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'RankFlow AI' });
  });

  app.post('/api/seo/generate', async (req, res) => {
    try {
      const { serviceName, targetLocation, category } = req.body as {
        serviceName?: string;
        targetLocation?: string;
        category?: string;
      };

      if (!serviceName || !serviceName.trim()) {
        return res.status(400).json({ error: 'Service Name or Job Role is required.' });
      }

      const cleanService = serviceName.trim();
      const cleanLocation = (targetLocation || 'PAN India').trim();
      const cleanCategory = (category || 'HR Recruitment & AI Automation').trim();

      const ai = getGeminiClient();

      const prompt = `You are a Principal Technical SEO Strategist for "Shri Shyam Consulting" (https://www.shrishyamconsulting.in), an enterprise PAN India HR Recruitment, Staffing, Payroll Compliance, and AI Business Automation agency headquartered at Paras Complex, Near Gurudwara Road, Durg, Chhattisgarh, India.

Generate a high-converting SEO metadata and Schema.org JSON-LD package for the following landing page:
- Service Name or Job Role: ${cleanService}
- Target Location: ${cleanLocation}
- Service Division: ${cleanCategory}

Strict Requirements:
1. pageTitle: Compelling SEO page title strictly UNDER 60 characters. Include brand or location naturally if space allows.
2. metaDescription: High-CTR meta description strictly UNDER 160 characters with a clear value proposition and call to action.
3. lsiKeywords: Array of 8 high-intent LSI and long-tail search keywords tailored to Indian B2B buyers and decision-makers.
4. urlSlug: Clean kebab-case URL slug starting with "/".
5. schemaJsonLd: Valid JSON-LD string for Schema.org (Service or ProfessionalService) with provider "Shri Shyam Consulting", "url": "https://www.shrishyamconsulting.in", "sameAs": ["https://share.google/sZOsh81zkZOerljSO", "https://share.google/lpfED2zhNx6e5Te5m"], streetAddress "Paras Complex, Near Gurudwara Road", addressLocality "Durg", addressRegion "Chhattisgarh", addressCountry "IN", and areaServed matching Target Location. Do NOT wrap in markdown code fences — return raw valid JSON string.`;

      const maxAttempts = 3;
      let response: Awaited<ReturnType<typeof ai.models.generateContent>> | null = null;
      let lastError: unknown = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: prompt,
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  pageTitle: {
                    type: Type.STRING,
                    description: 'SEO page title under 60 characters.',
                  },
                  metaDescription: {
                    type: Type.STRING,
                    description: 'High-CTR meta description under 160 characters.',
                  },
                  lsiKeywords: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '8 high-intent LSI and long-tail keywords.',
                  },
                  urlSlug: {
                    type: Type.STRING,
                    description: 'Clean kebab-case URL slug starting with /.',
                  },
                  schemaJsonLd: {
                    type: Type.STRING,
                    description: 'Valid Schema.org JSON-LD string without markdown fences.',
                  },
                },
                required: ['pageTitle', 'metaDescription', 'lsiKeywords', 'urlSlug', 'schemaJsonLd'],
              },
            },
          });
          break;
        } catch (err) {
          lastError = err;
          const msg = err instanceof Error ? err.message : String(err);
          const isTransient =
            msg.includes('503') ||
            msg.includes('UNAVAILABLE') ||
            msg.includes('429') ||
            msg.includes('RESOURCE_EXHAUSTED');
          if (!isTransient || attempt === maxAttempts) {
            throw err;
          }
          const delayMs = 700 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      const rawText = (response?.text ?? '').trim();
      if (!rawText) {
        throw lastError instanceof Error
          ? lastError
          : new Error('Empty response received from Gemini API.');
      }

      const parsed = JSON.parse(rawText) as {
        pageTitle: string;
        metaDescription: string;
        lsiKeywords: string[];
        urlSlug: string;
        schemaJsonLd: string;
      };

      // Ensure strict character limits if model slightly exceeded
      const safeTitle =
        parsed.pageTitle.length > 60
          ? `${parsed.pageTitle.slice(0, 57).trimEnd()}...`
          : parsed.pageTitle;
      const safeDesc =
        parsed.metaDescription.length > 160
          ? `${parsed.metaDescription.slice(0, 157).trimEnd()}...`
          : parsed.metaDescription;

      let formattedSchema = parsed.schemaJsonLd;
      try {
        const schemaObj = JSON.parse(parsed.schemaJsonLd);
        formattedSchema = JSON.stringify(schemaObj, null, 2);
      } catch {
        // Keep string if already formatted or non-standard
      }

      return res.json({
        pageTitle: safeTitle,
        metaDescription: safeDesc,
        lsiKeywords: parsed.lsiKeywords.slice(0, 10),
        urlSlug: parsed.urlSlug.startsWith('/') ? parsed.urlSlug : `/${parsed.urlSlug}`,
        schemaJsonLd: formattedSchema,
      });
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : 'Failed to generate SEO content.';
      console.error('[SEO Generate Error]:', rawMessage);

      if (rawMessage.includes('503') || rawMessage.includes('UNAVAILABLE')) {
        return res.status(503).json({
          error:
            'The AI SEO generator is temporarily busy due to high demand. Please click "Generate SEO" again in a few seconds.',
        });
      }
      if (rawMessage.includes('429') || rawMessage.includes('RESOURCE_EXHAUSTED')) {
        return res.status(429).json({
          error:
            'Rate limit reached for AI SEO generation. Please wait a moment and try again, or check your API key quota in Settings > Secrets.',
        });
      }

      return res.status(500).json({ error: rawMessage });
    }
  });

  app.post('/api/seo/growth-cycle', async (req, res) => {
    try {
      const { focusZone, existingKeywords } = req.body as {
        focusZone?: string;
        existingKeywords?: string[];
      };

      const cleanFocus = (focusZone || 'PAN India HR Recruitment & AI Automation').trim();
      const existingList = (existingKeywords || []).slice(0, 15).join(', ');

      const ai = getGeminiClient();

      const prompt = `You are the Principal SEO & Organic Growth Architect for "Shri Shyam Consulting", an enterprise PAN India HR Recruitment, Manpower Staffing, Statutory Payroll Compliance, and AI Business Automation agency.
Official Properties:
- Website: https://www.shrishyamconsulting.in
- Google Search / Knowledge Profile: https://share.google/sZOsh81zkZOerljSO
- Google Business Profile: https://share.google/lpfED2zhNx6e5Te5m
- HQ Address: Paras Complex, Near Gurudwara Road, Durg, Chhattisgarh, India

Current Growth Focus: ${cleanFocus}
Already Tracked Keywords (DO NOT repeat these): ${existingList || 'None'}

Generate one complete Regular Ranking & Traffic Growth Pack containing:
1. gbpPost: A ready-to-publish Google Business Profile update (headline under 60 chars, engaging 110-160 word body mentioning Shri Shyam Consulting, Durg HQ + PAN India service, and www.shrishyamconsulting.in, plus ctaLabel like "Book Consultation" and ctaUrl "https://www.shrishyamconsulting.in").
2. newKeywords: Exactly 2 brand-new high-intent Indian B2B search keywords tailored to "${cleanFocus}" with realistic monthlyVolume (800-9500), category ("HR Staffing", "AI Automation", or "Compliance"), rank (between 3 and 9), previousRank (rank + 3), targetUrl (starting with /), and intent ("High Commercial", "Transactional", or "Local B2B").
3. seoPackage: One complete SEO landing page/blog pack with serviceName, targetLocation, category, pageTitle (strictly UNDER 60 chars), metaDescription (strictly UNDER 160 chars), 6 lsiKeywords, urlSlug (starting with /), and valid Schema.org JSON-LD string with "url": "https://www.shrishyamconsulting.in" and "sameAs": ["https://share.google/sZOsh81zkZOerljSO", "https://share.google/lpfED2zhNx6e5Te5m"].
4. trafficTask: One actionable backlink, directory, or content distribution task (title, description, category from ["Google Business Profile", "Local & PAN India Directories", "Automated Blog & Backlinks"], region, cadence).`;

      const maxAttempts = 3;
      let response: Awaited<ReturnType<typeof ai.models.generateContent>> | null = null;
      let lastError: unknown = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: prompt,
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  gbpPost: {
                    type: Type.OBJECT,
                    properties: {
                      headline: { type: Type.STRING },
                      body: { type: Type.STRING },
                      ctaLabel: { type: Type.STRING },
                      ctaUrl: { type: Type.STRING },
                    },
                    required: ['headline', 'body', 'ctaLabel', 'ctaUrl'],
                  },
                  newKeywords: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        keyword: { type: Type.STRING },
                        category: { type: Type.STRING },
                        rank: { type: Type.INTEGER },
                        previousRank: { type: Type.INTEGER },
                        monthlyVolume: { type: Type.INTEGER },
                        targetUrl: { type: Type.STRING },
                        intent: { type: Type.STRING },
                      },
                      required: [
                        'keyword',
                        'category',
                        'rank',
                        'previousRank',
                        'monthlyVolume',
                        'targetUrl',
                        'intent',
                      ],
                    },
                  },
                  seoPackage: {
                    type: Type.OBJECT,
                    properties: {
                      serviceName: { type: Type.STRING },
                      targetLocation: { type: Type.STRING },
                      category: { type: Type.STRING },
                      pageTitle: { type: Type.STRING },
                      metaDescription: { type: Type.STRING },
                      lsiKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                      urlSlug: { type: Type.STRING },
                      schemaJsonLd: { type: Type.STRING },
                    },
                    required: [
                      'serviceName',
                      'targetLocation',
                      'category',
                      'pageTitle',
                      'metaDescription',
                      'lsiKeywords',
                      'urlSlug',
                      'schemaJsonLd',
                    ],
                  },
                  trafficTask: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      category: { type: Type.STRING },
                      region: { type: Type.STRING },
                      cadence: { type: Type.STRING },
                    },
                    required: ['title', 'description', 'category', 'region', 'cadence'],
                  },
                },
                required: ['gbpPost', 'newKeywords', 'seoPackage', 'trafficTask'],
              },
            },
          });
          break;
        } catch (err) {
          lastError = err;
          const msg = err instanceof Error ? err.message : String(err);
          const isTransient =
            msg.includes('503') ||
            msg.includes('UNAVAILABLE') ||
            msg.includes('429') ||
            msg.includes('RESOURCE_EXHAUSTED');
          if (!isTransient || attempt === maxAttempts) {
            throw err;
          }
          const delayMs = 700 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      const rawText = (response?.text ?? '').trim();
      if (!rawText) {
        throw lastError instanceof Error
          ? lastError
          : new Error('Empty response received from Gemini API.');
      }

      const parsed = JSON.parse(rawText) as {
        gbpPost: { headline: string; body: string; ctaLabel: string; ctaUrl: string };
        newKeywords: Array<{
          keyword: string;
          category: string;
          rank: number;
          previousRank: number;
          monthlyVolume: number;
          targetUrl: string;
          intent: string;
        }>;
        seoPackage: {
          serviceName: string;
          targetLocation: string;
          category: string;
          pageTitle: string;
          metaDescription: string;
          lsiKeywords: string[];
          urlSlug: string;
          schemaJsonLd: string;
        };
        trafficTask: {
          title: string;
          description: string;
          category: string;
          region: string;
          cadence: string;
        };
      };

      const validCategories = ['HR Staffing', 'AI Automation', 'Compliance'] as const;
      const validIntents = ['High Commercial', 'Transactional', 'Local B2B'] as const;
      const validChecklistCats = [
        'Google Business Profile',
        'Local & PAN India Directories',
        'Automated Blog & Backlinks',
      ] as const;

      const normalizedKeywords = parsed.newKeywords.slice(0, 2).map((kw) => {
        const rank = Math.max(1, Math.min(20, Math.round(kw.rank || 4)));
        const prev = Math.max(rank + 1, Math.min(50, Math.round(kw.previousRank || rank + 3)));
        const cat = validCategories.includes(kw.category as (typeof validCategories)[number])
          ? kw.category
          : 'HR Staffing';
        const intent = validIntents.includes(kw.intent as (typeof validIntents)[number])
          ? kw.intent
          : 'High Commercial';
        return {
          keyword: kw.keyword.slice(0, 180),
          category: cat,
          rank,
          previousRank: prev,
          monthlyVolume: Math.max(300, Math.min(25000, Math.round(kw.monthlyVolume || 2400))),
          targetUrl: kw.targetUrl.startsWith('/') ? kw.targetUrl : `/${kw.targetUrl}`,
          intent,
        };
      });

      const safeTitle =
        parsed.seoPackage.pageTitle.length > 60
          ? `${parsed.seoPackage.pageTitle.slice(0, 57).trimEnd()}...`
          : parsed.seoPackage.pageTitle;
      const safeDesc =
        parsed.seoPackage.metaDescription.length > 160
          ? `${parsed.seoPackage.metaDescription.slice(0, 157).trimEnd()}...`
          : parsed.seoPackage.metaDescription;

      let formattedSchema = parsed.seoPackage.schemaJsonLd;
      try {
        formattedSchema = JSON.stringify(JSON.parse(parsed.seoPackage.schemaJsonLd), null, 2);
      } catch {
        // Keep raw if needed
      }

      const taskCat = validChecklistCats.includes(
        parsed.trafficTask.category as (typeof validChecklistCats)[number]
      )
        ? parsed.trafficTask.category
        : 'Automated Blog & Backlinks';

      return res.json({
        id: `gc-${Date.now()}`,
        focusZone: cleanFocus,
        generatedAt: new Date().toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        gbpPost: parsed.gbpPost,
        newKeywords: normalizedKeywords,
        seoPackage: {
          id: `seo-${Date.now()}`,
          serviceName: parsed.seoPackage.serviceName,
          targetLocation: parsed.seoPackage.targetLocation || 'PAN India',
          category: parsed.seoPackage.category || cleanFocus,
          pageTitle: safeTitle,
          metaDescription: safeDesc,
          lsiKeywords: parsed.seoPackage.lsiKeywords.slice(0, 8),
          urlSlug: parsed.seoPackage.urlSlug.startsWith('/')
            ? parsed.seoPackage.urlSlug
            : `/${parsed.seoPackage.urlSlug}`,
          schemaJsonLd: formattedSchema,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        trafficTask: {
          title: parsed.trafficTask.title.slice(0, 180),
          description: parsed.trafficTask.description.slice(0, 500),
          category: taskCat,
          region: parsed.trafficTask.region || 'PAN India',
          cadence: parsed.trafficTask.cadence || 'Weekly',
          impact: 'High',
        },
      });
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : 'Failed to run SEO growth cycle.';
      console.error('[SEO Growth Cycle Error]:', rawMessage);

      if (rawMessage.includes('503') || rawMessage.includes('UNAVAILABLE')) {
        return res.status(503).json({
          error:
            'The AI growth engine is temporarily experiencing high demand. Please retry in a few seconds.',
        });
      }
      if (rawMessage.includes('429') || rawMessage.includes('RESOURCE_EXHAUSTED')) {
        return res.status(429).json({
          error:
            'Rate limit reached for AI growth updates. Please wait a moment and try again.',
        });
      }

      return res.status(500).json({ error: rawMessage });
    }
  });

  app.post('/api/seo/audit', async (req, res) => {
    try {
      const { url: rawInput } = req.body as { url?: string };
      if (!rawInput || !rawInput.trim()) {
        return res.status(400).json({ error: 'Please enter a valid website URL to audit.' });
      }

      const trimmed = rawInput.trim();
      const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

      let parsedUrl: URL;
      try {
        parsedUrl = new URL(candidate);
      } catch {
        return res.status(400).json({ error: 'Invalid URL format. Example: https://www.shrishyamconsulting.in' });
      }

      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return res.status(400).json({ error: 'Only HTTP and HTTPS URLs are supported.' });
      }

      const host = parsedUrl.hostname.toLowerCase();
      const isBlockedHost =
        host === 'localhost' ||
        host === '0.0.0.0' ||
        host === '::1' ||
        host.endsWith('.local') ||
        host.endsWith('.internal') ||
        host.startsWith('127.') ||
        host.startsWith('10.') ||
        host.startsWith('192.168.') ||
        host.startsWith('169.254.') ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);

      if (isBlockedHost) {
        return res.status(400).json({ error: 'Private, loopback, or internal network URLs cannot be audited.' });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const startedAt = Date.now();

      let fetchRes: Response;
      try {
        fetchRes = await fetch(parsedUrl.toString(), {
          method: 'GET',
          redirect: 'follow',
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (compatible; RankFlowAuditBot/1.0; +https://www.shrishyamconsulting.in)',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });
      } finally {
        clearTimeout(timeout);
      }

      const responseTimeMs = Math.max(1, Date.now() - startedAt);
      const contentType = fetchRes.headers.get('content-type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml') && contentType !== '') {
        return res.status(422).json({
          error: `Target URL returned "${contentType}" instead of an HTML document.`,
        });
      }

      const rawHtml = await fetchRes.text();
      const html = rawHtml.slice(0, 2_000_000);
      const finalUrl = fetchRes.url || parsedUrl.toString();

      const decodeEntities = (str: string): string =>
        str
          .replace(/&amp;/gi, '&')
          .replace(/&lt;/gi, '<')
          .replace(/&gt;/gi, '>')
          .replace(/&quot;/gi, '"')
          .replace(/&#39;|&apos;/gi, "'")
          .replace(/&nbsp;/gi, ' ')
          .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
          .replace(/\s+/g, ' ')
          .trim();

      const parseAttributes = (attrText: string): Record<string, { present: boolean; value: string }> => {
        const attrs: Record<string, { present: boolean; value: string }> = {};
        const attrRegex = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
        let match: RegExpExecArray | null;
        while ((match = attrRegex.exec(attrText)) !== null) {
          const key = match[1].toLowerCase();
          const val = match[2] ?? match[3] ?? match[4] ?? '';
          attrs[key] = { present: true, value: decodeEntities(val) };
        }
        return attrs;
      };

      const cleanHeadHtml = html.replace(/<!--[\s\S]*?-->/g, '');
      const titleMatch = cleanHeadHtml.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? decodeEntities(titleMatch[1].replace(/<[^>]+>/g, '')) : '';

      const metaTags: Record<string, string> = {};
      const metaRegex = /<meta\b([^>]*?)\/?>/gi;
      let metaMatch: RegExpExecArray | null;
      while ((metaMatch = metaRegex.exec(cleanHeadHtml)) !== null) {
        const attrs = parseAttributes(metaMatch[1]);
        const nameKey = (attrs.name?.value || attrs.property?.value || '').toLowerCase();
        const contentVal = attrs.content?.value ?? '';
        if (nameKey && !(nameKey in metaTags)) {
          metaTags[nameKey] = contentVal;
        }
      }

      let canonical = '';
      const linkRegex = /<link\b([^>]*?)\/?>/gi;
      let linkMatch: RegExpExecArray | null;
      while ((linkMatch = linkRegex.exec(cleanHeadHtml)) !== null) {
        const attrs = parseAttributes(linkMatch[1]);
        const rel = (attrs.rel?.value || '').toLowerCase().split(/\s+/);
        if (rel.includes('canonical') && attrs.href?.value) {
          canonical = attrs.href.value;
          break;
        }
      }

      const description = metaTags['description'] || '';
      const robots = metaTags['robots'] || '';
      const viewport = metaTags['viewport'] || '';
      const ogTitle = metaTags['og:title'] || '';
      const ogDescription = metaTags['og:description'] || '';
      const ogImage = metaTags['og:image'] || '';
      const twitterCard = metaTags['twitter:card'] || '';

      // Strip scripts, styles, and noscript tags before scanning body headings & images
      const bodyClean = cleanHeadHtml
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ');

      const headingNodes: { level: 1 | 2 | 3 | 4 | 5 | 6; text: string }[] = [];
      const counts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
      const skippedTransitions: string[] = [];

      const headingRegex = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
      let headingMatch: RegExpExecArray | null;
      let prevLevel = 0;

      while ((headingMatch = headingRegex.exec(bodyClean)) !== null) {
        const level = Number(headingMatch[1]) as 1 | 2 | 3 | 4 | 5 | 6;
        const text = decodeEntities(headingMatch[2].replace(/<[^>]+>/g, ' ')) || '(Empty heading)';
        counts[`h${level}` as keyof typeof counts] += 1;

        if (prevLevel > 0 && level - prevLevel > 1) {
          const transition = `H${prevLevel} → H${level} (skipped H${prevLevel + 1})`;
          if (!skippedTransitions.includes(transition)) {
            skippedTransitions.push(transition);
          }
        }
        prevLevel = level;
        if (headingNodes.length < 30) {
          headingNodes.push({ level, text: text.slice(0, 180) });
        }
      }

      const totalHeadings =
        counts.h1 + counts.h2 + counts.h3 + counts.h4 + counts.h5 + counts.h6;

      // Image alt audit
      const imageItems: { src: string; alt: string; status: 'valid' | 'empty' | 'missing' }[] = [];
      let imagesTotalCount = 0;
      let withAltCount = 0;
      let emptyAltCount = 0;
      let missingAltCount = 0;

      const imgRegex = /<img\b([^>]*?)\/?>/gi;
      let imgMatch: RegExpExecArray | null;
      while ((imgMatch = imgRegex.exec(bodyClean)) !== null) {
        const attrs = parseAttributes(imgMatch[1]);
        const rawSrc = attrs.src?.value || attrs['data-src']?.value || '(inline or lazy image)';
        let resolvedSrc = rawSrc;
        if (rawSrc && !rawSrc.startsWith('data:') && !rawSrc.startsWith('(')) {
          try {
            resolvedSrc = new URL(rawSrc, finalUrl).toString();
          } catch {
            resolvedSrc = rawSrc;
          }
        }

        let status: 'valid' | 'empty' | 'missing';
        const altAttr = attrs.alt;
        if (!altAttr || !altAttr.present) {
          status = 'missing';
          missingAltCount += 1;
        } else if (!altAttr.value.trim()) {
          status = 'empty';
          emptyAltCount += 1;
        } else {
          status = 'valid';
          withAltCount += 1;
        }

        imagesTotalCount += 1;
        if (imageItems.length < 25) {
          imageItems.push({
            src: resolvedSrc.slice(0, 260),
            alt: altAttr?.value?.slice(0, 180) || '',
            status,
          });
        }
      }

      // Evaluate audit checks
      let passedChecks = 0;
      const totalChecks = 10;
      const recommendations: string[] = [];

      const titleOk = title.length >= 25 && title.length <= 65;
      if (titleOk) passedChecks += 1;
      else if (!title) recommendations.push('Add a descriptive <title> tag between 45 and 60 characters.');
      else if (title.length > 65)
        recommendations.push(`Shorten <title> from ${title.length} to under 60 characters to prevent SERP truncation.`);
      else recommendations.push(`Expand <title> from ${title.length} to 45–60 characters with primary keywords.`);

      const descOk = description.length >= 100 && description.length <= 165;
      if (descOk) passedChecks += 1;
      else if (!description) recommendations.push('Add a meta description (120–160 chars) with a clear call to action.');
      else if (description.length > 165)
        recommendations.push(`Trim meta description from ${description.length} to under 160 characters.`);
      else recommendations.push(`Expand meta description from ${description.length} to 120–160 characters.`);

      if (canonical) passedChecks += 1;
      else recommendations.push('Add a <link rel="canonical"> tag to consolidate duplicate URL signals.');

      if (viewport) passedChecks += 1;
      else recommendations.push('Include <meta name="viewport" content="width=device-width, initial-scale=1"> for mobile indexing.');

      if (!robots.toLowerCase().includes('noindex')) passedChecks += 1;
      else recommendations.push(`Robots meta contains "${robots}" — confirm whether this page should be indexed.`);

      if (ogTitle && ogDescription) passedChecks += 1;
      else recommendations.push('Add Open Graph (og:title, og:description, og:image) tags for social sharing previews.');

      const singleH1Ok = counts.h1 === 1;
      if (singleH1Ok) passedChecks += 1;
      else if (counts.h1 === 0) recommendations.push('Add exactly one descriptive <h1> heading containing the page’s primary topic.');
      else recommendations.push(`Consolidate ${counts.h1} <h1> headings into a single primary <h1> per page.`);

      const hierarchyOk = totalHeadings > 0 && skippedTransitions.length === 0;
      if (hierarchyOk) passedChecks += 1;
      else if (skippedTransitions.length > 0)
        recommendations.push(`Fix heading hierarchy skips (${skippedTransitions.slice(0, 2).join(', ')}) so sections nest sequentially.`);

      const noMissingAltOk = missingAltCount === 0;
      if (noMissingAltOk) passedChecks += 1;
      else recommendations.push(`Add descriptive alt attributes to ${missingAltCount} image(s) missing an alt attribute.`);

      const goodAltCoverageOk = imagesTotalCount === 0 || emptyAltCount <= Math.floor(imagesTotalCount * 0.25);
      if (goodAltCoverageOk) passedChecks += 1;
      else recommendations.push(`Review ${emptyAltCount} image(s) with empty alt="" and add descriptive text for non-decorative visuals.`);

      if (recommendations.length === 0) {
        recommendations.push('All core on-page meta, heading hierarchy, and image alt checks passed cleanly.');
      }

      const metaStatus: 'Pass' | 'Warning' | 'Critical' =
        !title || !description ? 'Critical' : titleOk && descOk && Boolean(canonical) && Boolean(ogTitle) ? 'Pass' : 'Warning';

      const headingsStatus: 'Pass' | 'Warning' | 'Critical' =
        counts.h1 === 0 ? 'Critical' : counts.h1 === 1 && skippedTransitions.length === 0 ? 'Pass' : 'Warning';

      const imagesStatus: 'Pass' | 'Warning' | 'Critical' =
        missingAltCount > 0 ? 'Critical' : emptyAltCount > 0 && imagesTotalCount > 0 ? 'Warning' : 'Pass';

      return res.json({
        id: `aud-${Date.now()}`,
        url: parsedUrl.toString(),
        finalUrl,
        httpStatus: fetchRes.status,
        responseTimeMs,
        auditedAt: new Date().toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        passedChecks,
        totalChecks,
        meta: {
          status: metaStatus,
          title,
          titleLength: title.length,
          description,
          descriptionLength: description.length,
          canonical,
          robots: robots || 'index, follow (default)',
          viewport,
          ogTitle,
          ogDescription,
          ogImage,
          twitterCard,
        },
        headings: {
          status: headingsStatus,
          totalCount: totalHeadings,
          h1Count: counts.h1,
          h2Count: counts.h2,
          h3Count: counts.h3,
          h4Count: counts.h4,
          h5Count: counts.h5,
          h6Count: counts.h6,
          skippedTransitions,
          nodes: headingNodes,
        },
        images: {
          status: imagesStatus,
          totalCount: imagesTotalCount,
          withAltCount,
          emptyAltCount,
          missingAltCount,
          items: imageItems,
        },
        recommendations,
      });
    } catch (err) {
      const msg =
        err instanceof Error && err.name === 'AbortError'
          ? 'The target URL took longer than 10 seconds to respond.'
          : err instanceof Error
            ? err.message
            : 'Failed to fetch and analyze the target URL.';
      console.error('[SEO Audit Error]:', msg);
      return res.status(502).json({ error: msg });
    }
  });

  app.post('/api/webhook/forward', async (req, res) => {
    try {
      const { webhookUrl, payload } = req.body as {
        webhookUrl?: string;
        payload?: Record<string, unknown>;
      };

      if (!webhookUrl || !webhookUrl.startsWith('https://')) {
        return res.status(400).json({ error: 'Valid HTTPS Make.com webhook URL is required.' });
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'RankFlow AI - Shri Shyam Consulting',
          forwardedAt: new Date().toISOString(),
          ...payload,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        return res.status(502).json({
          error: `Webhook responded with HTTP ${response.status}${text ? `: ${text.slice(0, 140)}` : ''}`,
        });
      }

      return res.json({ delivered: true, status: response.status });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Webhook delivery failed.';
      return res.status(502).json({ error: message });
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RankFlow AI server listening on http://0.0.0.0:${PORT}`);
  });
}

createApp();
