import { NextRequest, NextResponse } from 'next/server';

export type LinkedInData = {
  recruiterName?: string;
  company?: string;
  position?: string;
  location?: string;
  salary?: string;
  jobLink?: string;
  industry?: string;
  contactLink?: string;
  remote?: boolean;
  _partial?: boolean;
  _message?: string;
  _urlType?: 'job' | 'profile' | 'company' | 'unknown';
  _filledFields?: string[];
};

// ── Helpers ─────────────────────────────────────────────────────────
function capitalizeSlug(slug: string): string {
  return slug
    .replace(/\d+$/, '')
    .split(/[-_]+/)
    .filter(w => w.length > 1 && !/^\d+$/.test(w))
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

function extractNameFromSlug(slug: string): string | undefined {
  const cleaned = slug.replace(/[-_]?\d+$/, '');
  const parts = cleaned.split('-').filter(p => p.length > 1 && !/^\d+$/.test(p));
  if (parts.length < 2) return undefined;
  // Take first 2-3 parts as name (ignore company suffixes like "at-stripe")
  const atIdx = parts.indexOf('at');
  const nameParts = atIdx > 1 ? parts.slice(0, atIdx) : parts.slice(0, Math.min(3, parts.length));
  if (nameParts.length < 2) return undefined;
  return nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

function extractCompanyFromProfileSlug(slug: string): string | undefined {
  const parts = slug.split('-');
  const atIdx = parts.indexOf('at');
  if (atIdx !== -1 && atIdx < parts.length - 1) {
    return parts.slice(atIdx + 1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  }
  return undefined;
}

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Cache-Control': 'max-age=0',
};

// ── URL type detection ───────────────────────────────────────────────
function detectUrlType(url: string): 'job' | 'profile' | 'company' | 'unknown' {
  if (/linkedin\.com\/jobs\//.test(url)) return 'job';
  if (/linkedin\.com\/in\//.test(url)) return 'profile';
  if (/linkedin\.com\/company\//.test(url)) return 'company';
  return 'unknown';
}

// ── LinkedIn Guest Job API (no auth needed) ──────────────────────────
async function fetchJobGuestApi(jobId: string): Promise<Partial<LinkedInData> | null> {
  const endpoints = [
    `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`,
    `https://www.linkedin.com/jobs/view/${jobId}?trk=public_jobs_topcard-title`,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        headers: {
          ...FETCH_HEADERS,
          Referer: 'https://www.google.com/',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(9000),
      });

      if (!res.ok || res.status === 999 || res.status === 429) continue;

      const html = await res.text();
      if (html.includes('/checkpoint/') || html.includes('authwall') || html.length < 500) continue;

      const parsed = parseJobHTML(html);
      if (parsed.position || parsed.company) return parsed;
    } catch { /* try next */ }
  }
  return null;
}

// ── HTML parsers ─────────────────────────────────────────────────────
function parseJobHTML(html: string): Partial<LinkedInData> {
  const data: Partial<LinkedInData> = {};

  // ── JSON-LD (most reliable) ──────────────────────────────────
  const ldRe = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = ldRe.exec(html)) !== null) {
    try {
      const json = JSON.parse(m[1]);
      if (json['@type'] === 'JobPosting') {
        data.position = json.title ?? json.name;
        data.company = json.hiringOrganization?.name ?? json.hiringOrganization?.['@name'];
        data.industry = json.industry;

        const rawLoc = Array.isArray(json.jobLocation) ? json.jobLocation[0] : json.jobLocation;
        if (rawLoc) {
          const addr = rawLoc.address ?? {};
          const city = addr.addressLocality;
          const region = addr.addressRegion;
          if (city && region) data.location = `${city}, ${region}`;
          else data.location = city ?? region ?? (rawLoc.name !== 'Remote' ? rawLoc.name : 'Remote');
        }
        if (json.jobLocationType === 'TELECOMMUTE') { data.remote = true; data.location = data.location ?? 'Remote'; }

        if (json.baseSalary?.value) {
          const sv = json.baseSalary.value;
          const fmt = (n: number) => n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`;
          if (sv.minValue && sv.maxValue) data.salary = `${fmt(sv.minValue)} – ${fmt(sv.maxValue)}`;
          else if (sv.value) data.salary = fmt(sv.value);
        }
        return data; // JSON-LD is most authoritative
      }
    } catch { /* ignore */ }
  }

  // ── OpenGraph fallback ────────────────────────────────────────
  const og = (prop: string) => {
    const r = html.match(new RegExp(`<meta[^>]*(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i'));
    return r?.[1];
  };

  const title = og('og:title') ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? '';
  const cleanTitle = title.replace(/\s*[-|]\s*LinkedIn\s*$/i, '').trim();

  // "Job Title at Company" pattern
  const atMatch = cleanTitle.match(/^(.+?)\s+at\s+(.+)$/i);
  if (atMatch) {
    data.position = atMatch[1].trim();
    data.company = data.company ?? atMatch[2].trim();
  } else if (cleanTitle && !data.position) {
    data.position = cleanTitle;
  }

  // Location from description
  const desc = og('og:description') ?? '';
  if (desc && !data.location) {
    const locM = desc.match(/\b([A-Z][a-z]+(?:[\s,]+[A-Z][a-z]+)*,?\s*(?:[A-Z]{2,3}|United States|Remote))\b/);
    if (locM) data.location = locM[1];
  }
  if (desc.toLowerCase().includes('remote')) data.remote = true;

  // ── LinkedIn-specific HTML classes ───────────────────────────
  if (!data.position) {
    const h1 = html.match(/class="[^"]*(?:topcard__title|top-card-layout__title)[^"]*"[^>]*>\s*([^<]+)/i);
    if (h1) data.position = h1[1].trim();
  }
  if (!data.company) {
    const co = html.match(/class="[^"]*(?:topcard__org-name-link|top-card-layout__company)[^"]*"[^>]*>\s*([^<]+)/i);
    if (co) data.company = co[1].trim();
  }
  if (!data.location) {
    const loc = html.match(/class="[^"]*(?:topcard__flavor--bullet|top-card-layout__card-partition)[^"]*"[^>]*>\s*([^<]+)/i);
    if (loc) data.location = loc[1].trim();
  }

  return data;
}

function parseCompanyHTML(html: string): Partial<LinkedInData> {
  const data: Partial<LinkedInData> = {};

  const og = (prop: string) => html.match(new RegExp(`<meta[^>]*property=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i'))?.[1];
  const title = og('og:title') ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? '';
  const clean = title.replace(/\s*[-|]\s*LinkedIn\s*$/i, '').trim();
  if (clean) data.company = clean;

  const desc = og('og:description') ?? '';
  const indM = desc.match(/(?:industry|sector)[:\s]+([A-Za-z& ]+)/i);
  if (indM) data.industry = indM[1].trim();

  return data;
}

// ── Main handler ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url?.trim()) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    const normalized = /^https?:\/\//.test(url) ? url : `https://www.linkedin.com${url.startsWith('/') ? url : '/in/' + url}`;
    const urlType = detectUrlType(normalized);
    const result: LinkedInData = { jobLink: normalized, _urlType: urlType };

    // ── CASE 1: Job posting ──────────────────────────────────────
    if (urlType === 'job') {
      const jobId = normalized.match(/\/jobs\/view\/(\d+)/)?.[1];

      if (jobId) {
        const fetched = await fetchJobGuestApi(jobId);
        if (fetched) {
          Object.assign(result, fetched);
          result.jobLink = normalized;
        }
      }

      if (!result.position && !result.company) {
        // Fallback: parse from full page
        try {
          const res = await fetch(normalized, {
            headers: { ...FETCH_HEADERS, Referer: 'https://www.google.com/' },
            redirect: 'follow',
            signal: AbortSignal.timeout(8000),
          });
          if (res.ok) {
            const html = await res.text();
            if (!html.includes('/checkpoint/') && !html.includes('authwall')) {
              Object.assign(result, parseJobHTML(html));
            }
          }
        } catch { /* no fallback */ }
      }

      const filled = getFilledFields(result);
      result._filledFields = filled;

      if (filled.length === 0) {
        result._partial = true;
        result._message = 'Job listing unavailable — LinkedIn may require login. Enter details manually.';
      } else {
        result._partial = false;
      }

      return NextResponse.json(result);
    }

    // ── CASE 2: Profile URL ──────────────────────────────────────
    if (urlType === 'profile') {
      const slug = normalized.match(/\/in\/([^/?#]+)/)?.[1] ?? '';
      const nameFromSlug = extractNameFromSlug(slug);
      const companyFromSlug = extractCompanyFromProfileSlug(slug);

      if (nameFromSlug) result.recruiterName = nameFromSlug;
      if (companyFromSlug) result.company = companyFromSlug;
      result.contactLink = normalized;

      // Try to scrape public profile page for name, position, company
      try {
        const res = await fetch(normalized, {
          headers: { ...FETCH_HEADERS, Referer: 'https://www.google.com/' },
          redirect: 'follow',
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const html = await res.text();
          if (!html.includes('/checkpoint/') && !html.includes('authwall') && html.length > 500) {

            // Title tag: "Full Name - Job Title at Company | LinkedIn"
            const rawTitle = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? '';
            const cleanTitle = rawTitle.replace(/\s*\|\s*LinkedIn\s*$/i, '').trim();
            const dashIdx = cleanTitle.indexOf(' - ');
            if (dashIdx !== -1) {
              const fullName = cleanTitle.slice(0, dashIdx).trim();
              const afterDash = cleanTitle.slice(dashIdx + 3).trim();
              if (fullName && fullName.split(' ').length >= 2) result.recruiterName = fullName;
              // "Title at Company" pattern
              const atMatch = afterDash.match(/^(.+?)\s+at\s+(.+)$/i);
              if (atMatch) {
                result.position = atMatch[1].trim();
                if (!result.company) result.company = atMatch[2].trim();
              } else if (afterDash && !afterDash.toLowerCase().includes('linkedin')) {
                result.position = afterDash;
              }
            }

            // JSON-LD Person schema
            const ldRe = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
            let m: RegExpExecArray | null;
            while ((m = ldRe.exec(html)) !== null) {
              try {
                const json = JSON.parse(m[1]);
                if (json['@type'] === 'Person') {
                  if (json.name) result.recruiterName = json.name;
                  if (json.jobTitle && !result.position) result.position = json.jobTitle;
                  if (json.worksFor?.name && !result.company) result.company = json.worksFor.name;
                }
              } catch { /* ignore */ }
            }

            // OG description: "Job Title at Company · X followers"
            const ogDesc = html.match(/<meta[^>]*(?:property|name)=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1] ?? '';
            if (ogDesc && !result.position) {
              const atMatch = ogDesc.match(/^([^.·|]+?)\s+at\s+([^.·|]+)/i);
              if (atMatch) {
                if (!result.position) result.position = atMatch[1].trim();
                if (!result.company) result.company = atMatch[2].trim();
              }
            }
          }
        }
      } catch { /* use slug fallback only */ }

      result._partial = !result.position || !result.company;
      result._filledFields = getFilledFields(result);

      const filled = result._filledFields ?? [];
      if (result.position && result.company) {
        result._message = `Profile scraped — ${filled.length} fields filled.`;
      } else {
        const missing = [!result.company && 'Company', !result.position && 'Position'].filter(Boolean).join(' and ');
        result._message = `Profile detected — please fill in ${missing} manually.`;
      }

      return NextResponse.json(result);
    }

    // ── CASE 3: Company URL ──────────────────────────────────────
    if (urlType === 'company') {
      const companySlug = normalized.match(/\/company\/([^/?#]+)/)?.[1] ?? '';
      result.company = capitalizeSlug(companySlug);

      // Try to scrape company page for more info
      try {
        const res = await fetch(normalized, {
          headers: FETCH_HEADERS,
          redirect: 'follow',
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const html = await res.text();
          if (!html.includes('/checkpoint/') && !html.includes('authwall')) {
            const extra = parseCompanyHTML(html);
            if (extra.company) result.company = extra.company;
            if (extra.industry) result.industry = extra.industry;
          }
        }
      } catch { /* use slug fallback */ }

      result._filledFields = getFilledFields(result);
      result._partial = true;
      result._message = 'Company page — fill in position and your contact details.';
      return NextResponse.json(result);
    }

    // ── CASE 4: Unknown URL ──────────────────────────────────────
    result._partial = true;
    result._message = "Paste a LinkedIn job posting URL (best) or recruiter profile URL for auto-fill.";
    return NextResponse.json(result);

  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

function getFilledFields(data: LinkedInData): string[] {
  return (['recruiterName', 'company', 'position', 'location', 'salary', 'industry', 'contactLink'] as const)
    .filter(k => !!data[k]);
}
