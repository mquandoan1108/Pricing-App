import { PetrolimexProduct } from '../types/logistics';

export interface PvoilLiveResponse {
  success: boolean;
  products: PetrolimexProduct[];
  effectiveTime: string;
  dateOptions: Array<{ value: string; label: string }>;
  currentDate?: string;
  updatedAt?: string;
  tierDescription?: string;
}

const CLOUD_API_ORIGIN = 'https://ais-pre-hfghckwoyv5ad3gavspuay-397126670799.asia-southeast1.run.app';

function calcZone2(p1: number): number {
  return Math.round((p1 * 1.02) / 10) * 10;
}

function mapApiProducts(rawProducts: any[]): PetrolimexProduct[] {
  return rawProducts.map((p: any) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    unit: p.unit,
    zone1Price: p.zone1,
    zone2Price: p.zone2,
    priceDiff: p.diff,
    adjustmentDiff: p.adjustmentDiff,
    isPrimaryFuelForLogistics: p.primary,
    description: p.description,
  }));
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { cache: 'no-store', signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function tryJsonEndpoint(baseOrigin: string, dateParam?: string, forceRefresh = false): Promise<PvoilLiveResponse | null> {
  try {
    const url = new URL('/api/pvoil/prices', baseOrigin);
    if (dateParam) url.searchParams.set('date', dateParam);
    if (forceRefresh) url.searchParams.set('refresh', 'true');
    url.searchParams.set('_t', String(Date.now()));

    const res = await fetchWithTimeout(url.toString(), 7000);
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return null;

    const data = await res.json();
    if (data && data.success && Array.isArray(data.products) && data.products.length > 0) {
      return {
        success: true,
        products: mapApiProducts(data.products),
        effectiveTime: data.effectiveTime || '',
        dateOptions: Array.isArray(data.dateOptions) ? data.dateOptions : [],
        currentDate: data.currentDate,
        updatedAt: data.updatedAt,
        tierDescription: data.tierDescription,
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function tryClientMirrorFallback(): Promise<PvoilLiveResponse | null> {
  try {
    const res = await fetchWithTimeout(`https://r.jina.ai/https://giaxanghomnay.com/?_t=${Date.now()}`, 8000);
    if (!res.ok) return null;
    const md = await res.text();
    if (!md.includes('giá theo PVOIL')) return null;

    const pvoilSectionMatch = md.match(/giá theo PVOIL([\s\S]*?)Giá của PVOIL cập nhật/i);
    if (!pvoilSectionMatch) return null;

    let do05Price = 0;
    let do001Price = 0;
    let ron95Price = 0;
    let ron92Price = 0;
    let do05Diff = '';
    let do001Diff = '';
    let ron95Diff = '';
    let ron92Diff = '';

    const lines = pvoilSectionMatch[1].split('\n');
    for (const line of lines) {
      if (!line.trim().startsWith('|') || line.includes('---') || line.includes('Xăng/dầu')) continue;
      const cols = line.split('|').map((c) => c.trim()).filter(Boolean);
      if (cols.length >= 4) {
        const nameRaw = cols[0].replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
        const diffRaw = cols[2].replace(/,/g, '').trim();
        const price = parseInt(cols[3].replace(/[^0-9]/g, ''), 10);
        if (!isNaN(price) && price > 10000) {
          if (nameRaw.includes('0,05S') || nameRaw.includes('0.05S')) {
            do05Price = price;
            do05Diff = diffRaw;
          } else if (nameRaw.includes('0,001S') || nameRaw.includes('0.001S')) {
            do001Price = price;
            do001Diff = diffRaw;
          } else if (nameRaw.includes('95')) {
            ron95Price = price;
            ron95Diff = diffRaw;
          } else if (nameRaw.includes('92') || nameRaw.includes('E5')) {
            ron92Price = price;
            ron92Diff = diffRaw;
          }
        }
      }
    }

    if (!do05Price) return null;

    const dateMatch = md.match(/Ngày\s+(\d{2}\/\d{2}\/\d{4})[\s\S]*?(\d{2}:\d{2})/);
    const effectiveTime = dateMatch
      ? `Giá điều chỉnh lúc ${dateMatch[2]} ngày ${dateMatch[1]}`
      : 'Kỳ điều hành PVOIL mới nhất';

    const products: PetrolimexProduct[] = [
      {
        id: 'pvoil_do_0_05s',
        code: 'DO 0,05S-II',
        name: 'Dầu Điêzen DO 0,05S-II (PVOIL)',
        unit: 'đồng/lít',
        zone1Price: do05Price,
        zone2Price: calcZone2(do05Price),
        priceDiff: calcZone2(do05Price) - do05Price,
        adjustmentDiff: do05Diff,
        isPrimaryFuelForLogistics: true,
        description: 'Dầu Diesel nhiên liệu chuẩn tính bù trừ cước theo Phụ lục 3 Viettel Logistics.',
      },
      {
        id: 'pvoil_do_0_001s',
        code: 'DO 0,001S-V',
        name: 'Dầu Điêzen DO 0,001S-V (Euro 5)',
        unit: 'đồng/lít',
        zone1Price: do001Price || do05Price + 1800,
        zone2Price: calcZone2(do001Price || do05Price + 1800),
        priceDiff: calcZone2(do001Price || do05Price + 1800) - (do001Price || do05Price + 1800),
        adjustmentDiff: do001Diff,
        isPrimaryFuelForLogistics: false,
        description: 'Dầu Diesel Euro 5 chất lượng cao giảm thiểu phát thải.',
      },
      {
        id: 'pvoil_ron_95',
        code: 'RON 95-III',
        name: 'Xăng E10 RON 95-III (PVOIL)',
        unit: 'đồng/lít',
        zone1Price: ron95Price || 19840,
        zone2Price: calcZone2(ron95Price || 19840),
        priceDiff: calcZone2(ron95Price || 19840) - (ron95Price || 19840),
        adjustmentDiff: ron95Diff,
        isPrimaryFuelForLogistics: false,
        description: 'Xăng cao cấp mạng lưới PVOil.',
      },
      {
        id: 'pvoil_ron_92',
        code: 'E5 RON 92-II',
        name: 'Xăng sinh học E5 RON 92-II',
        unit: 'đồng/lít',
        zone1Price: ron92Price || 19390,
        zone2Price: calcZone2(ron92Price || 19390),
        priceDiff: calcZone2(ron92Price || 19390) - (ron92Price || 19390),
        adjustmentDiff: ron92Diff,
        isPrimaryFuelForLogistics: false,
        description: 'Xăng sinh học mạng lưới PVOil.',
      },
    ];

    return {
      success: true,
      products,
      effectiveTime,
      dateOptions: [],
      updatedAt: new Date().toISOString(),
      tierDescription: 'Đồng bộ thời gian thực qua nguồn mirror PVOIL',
    };
  } catch {
    return null;
  }
}

export async function fetchLivePvoilPrices(
  dateParam?: string,
  forceRefresh = false
): Promise<PvoilLiveResponse | null> {
  // 1. Primary: Local / Same-origin Express API (bypasses Cloudflare via 103.21.120.100)
  const localResult = await tryJsonEndpoint(window.location.origin, dateParam, forceRefresh);
  if (localResult) return localResult;

  // 2. Fallback for static GitHub Pages builds: try Cloud Run backend API if reachable via CORS
  if (window.location.origin !== CLOUD_API_ORIGIN) {
    const cloudResult = await tryJsonEndpoint(CLOUD_API_ORIGIN, dateParam, forceRefresh);
    if (cloudResult) return cloudResult;
  }

  // 3. Universal browser-only fallback (no backend required, works on GitHub Pages)
  if (!dateParam) {
    return await tryClientMirrorFallback();
  }

  return null;
}
