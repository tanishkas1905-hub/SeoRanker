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
5. schemaJsonLd: Valid JSON-LD string for Schema.org (Service or ProfessionalService) with provider "Shri Shyam Consulting", "url": "https://www.shrishyamconsulting.in", "sameAs": ["https://share.google/lpfED2zhNx6e5Te5m"], streetAddress "Paras Complex, Near Gurudwara Road", addressLocality "Durg", addressRegion "Chhattisgarh", addressCountry "IN", and areaServed matching Target Location. Do NOT wrap in markdown code fences — return raw valid JSON string.`;

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
