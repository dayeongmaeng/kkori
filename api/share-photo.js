const DEFAULT_API_BASE_URL = 'https://api.kkori.co.kr';
const DEFAULT_WEB_BASE_URL = 'https://test-kkori.vercel.app';
const fs = require('fs');
const path = require('path');

function getLogoDataUri() {
  try {
    const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
    const logo = fs.readFileSync(logoPath).toString('base64');
    return `data:image/png;base64,${logo}`;
  } catch {
    return '';
  }
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDateKorean(dateStr = '') {
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return '';
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

function renderPage({ photo, externalId, status = 200 }) {
  const webBaseUrl = (process.env.EXPO_PUBLIC_WEB_URL || DEFAULT_WEB_BASE_URL).replace(/\/$/, '');
  const shareUrl = `${webBaseUrl}/photos/${encodeURIComponent(externalId)}`;
  const imageUrl = photo?.mediumUrl || photo?.thumbnailUrl || '';
  const petName = photo?.petName || '반려동물';
  const dateText = formatDateKorean(photo?.date);
  const caption = photo?.caption || '';
  const edited = Boolean(photo?.edited);
  const title = photo ? `${petName}의 하루 한 장` : '사진을 찾을 수 없어요';
  const description = caption || (photo ? '꼬리에서 공유한 반려동물의 소중한 순간이에요.' : '공유 링크가 만료되었거나 삭제된 사진일 수 있어요.');
  const logoDataUri = getLogoDataUri();

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${escapeHtml(title)} | 꼬리</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="꼬리" />
  <meta property="og:url" content="${escapeHtml(shareUrl)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  ${imageUrl ? `<meta property="og:image" content="${escapeHtml(imageUrl)}" />` : ''}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  ${imageUrl ? `<meta name="twitter:image" content="${escapeHtml(imageUrl)}" />` : ''}
  <style>
    :root {
      color-scheme: light;
      --bg: #FAF8F5;
      --surface: #FFFFFF;
      --ink: #191F28;
      --muted: #8B95A1;
      --subtle: #F2F4F6;
      --line: #E5E8EB;
      --primary: #4E5968;
      --accent: #E8985C;
      --danger-soft: #FFE5E5;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif;
      letter-spacing: 0;
    }
    main {
      min-height: 100vh;
      display: flex;
      justify-content: center;
      padding: 0;
    }
    .page {
      width: 100%;
      max-width: 560px;
      background: var(--surface);
      min-height: 100vh;
    }
    .topbar {
      padding: max(14px, env(safe-area-inset-top)) 4px 10px 4px;
      border-bottom: 1px solid var(--line);
    }
    .brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .logo-img {
      display: block;
      width: 32px;
      height: 32px;
      object-fit: contain;
      object-position: right center;
    }
    .badge {
      border-radius: 999px;
      background: var(--subtle);
      color: var(--primary);
      font-size: 12px;
      font-weight: 800;
      padding: 6px 9px;
      white-space: nowrap;
    }
    .date {
      margin-top: 4px;
      color: var(--primary);
      font-size: 13px;
      font-weight: 800;
    }
    .photo {
      display: block;
      width: 100%;
      aspect-ratio: 1 / 1;
      object-fit: cover;
      background: var(--subtle);
    }
    .empty-photo {
      width: 100%;
      aspect-ratio: 1 / 1;
      display: grid;
      place-items: center;
      background: var(--subtle);
      color: var(--muted);
      font-size: 14px;
      font-weight: 700;
    }
    .content {
      padding: 16px 20px 4px;
    }
    h1 {
      margin: 0;
      font-size: 21px;
      line-height: 1.32;
      font-weight: 900;
    }
    .edited {
      display: inline-flex;
      margin-top: 8px;
      border-radius: 999px;
      background: var(--subtle);
      color: var(--muted);
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
    }
    .caption {
      margin: 10px 0 0;
      color: var(--primary);
      font-size: 16px;
      line-height: 1.45;
      white-space: pre-wrap;
    }
    .caption.empty {
      color: var(--muted);
      font-style: italic;
    }
    .footer {
      padding: 8px 20px 20px;
    }
    .footer-copy {
      margin: 0 0 10px;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.38;
    }
    .cta {
      display: flex;
      width: 100%;
      min-height: 48px;
      align-items: center;
      justify-content: center;
      border-radius: 16px;
      background: var(--primary);
      color: #fff;
      text-decoration: none;
      font-size: 16px;
      font-weight: 900;
    }
    .error {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 32px 24px;
      text-align: center;
    }
    .error-card {
      width: 100%;
      max-width: 360px;
    }
    .error-icon {
      font-size: 44px;
      margin-bottom: 14px;
    }
    .error-title {
      margin: 0 0 10px;
      font-size: 22px;
      font-weight: 900;
    }
    .error-desc {
      margin: 0 0 22px;
      color: var(--muted);
      font-size: 14px;
      line-height: 1.55;
    }
    @media (min-width: 720px) {
      main {
        align-items: center;
        padding: 16px;
      }
      .page {
        min-height: auto;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 18px 54px rgba(25, 31, 40, 0.14);
      }
    }
  </style>
</head>
<body>
  <main>
    ${photo ? `
      <article class="page">
        <header class="topbar">
          <div class="brand">
            ${logoDataUri ? `<img class="logo-img" src="${logoDataUri}" alt="" />` : `<span aria-hidden="true"></span>`}
            <div class="badge">꼬리에서 공유됨</div>
          </div>
          <div class="date">${escapeHtml(dateText)}</div>
        </header>
        ${imageUrl ? `<img class="photo" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(petName)}의 사진" />` : `<div class="empty-photo">사진을 불러올 수 없어요</div>`}
        <section class="content">
          <h1>${escapeHtml(petName)}의 하루 한 장</h1>
          ${edited ? `<div class="edited">수정됨</div>` : ''}
          ${caption ? `<p class="caption">${escapeHtml(caption)}</p>` : `<p class="caption empty">캡션이 없는 사진이에요.</p>`}
        </section>
        <footer class="footer">
          <p class="footer-copy">반려동물의 식사, 산책, 컨디션과 소중한 사진을 꼬리에서 함께 기록해요.</p>
          <a class="cta" href="${escapeHtml(webBaseUrl)}">꼬리에서 기록하기</a>
        </footer>
      </article>
    ` : `
      <section class="error">
        <div class="error-card">
          <div class="error-icon">🔍</div>
          <h1 class="error-title">사진을 찾을 수 없어요</h1>
          <p class="error-desc">공유 링크가 만료되었거나 삭제된 사진일 수 있어요.</p>
          <a class="cta" href="${escapeHtml(webBaseUrl)}">꼬리 홈으로</a>
        </div>
      </section>
    `}
  </main>
</body>
</html>`;
}

module.exports = async function handler(req, res) {
  const externalId = String(req.query.externalId || '').trim();

  if (!externalId) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Kkori-Share-Page', '1');
    res.end(renderPage({ photo: null, externalId: '' }));
    return;
  }

  const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');
  const apiUrl = `${apiBaseUrl}/api/v1/photos/${encodeURIComponent(externalId)}/share`;

  try {
    const apiRes = await fetch(apiUrl, {
      headers: { Accept: 'application/json' },
    });

    if (!apiRes.ok) {
      res.statusCode = apiRes.status === 404 ? 404 : 502;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Kkori-Share-Page', '1');
      res.end(renderPage({ photo: null, externalId, status: res.statusCode }));
      return;
    }

    const json = await apiRes.json();
    const photo = json?.data || json;

    if (!photo?.mediumUrl && !photo?.thumbnailUrl) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Kkori-Share-Page', '1');
      res.end(renderPage({ photo: null, externalId, status: 404 }));
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Kkori-Share-Page', '1');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    res.end(renderPage({ photo, externalId, status: 200 }));
  } catch {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Kkori-Share-Page', '1');
    res.end(renderPage({ photo: null, externalId, status: 502 }));
  }
};
