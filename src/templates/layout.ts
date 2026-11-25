// src/templates/layout.ts
import type { User } from '../db/schema';
import type { FlashMessage } from '../utils/flash';
import { esc, icon } from '../utils/html';

export interface LayoutOptions {
  title: string;
  description?: string;
  activePath?: string;
  user?: User | null;
  flash?: FlashMessage | null;
  csrfToken?: string;
  appUrl?: string;
  extraScripts?: string[];
  content: string;
}

export function renderLayout(opts: LayoutOptions): string {
  const {
    title,
    description = 'BeeLab — сучасний веб-застосунок для обліку пасіки, вуликів, оглядів, фінансів та завдань.',
    activePath = '/',
    user = null,
    flash = null,
    appUrl = '',
    extraScripts = [],
    content,
  } = opts;

  const fullTitle = `${esc(title)} — BeeLab`;
  const canonicalUrl = appUrl ? `${appUrl.replace(/\/$/, '')}${activePath}` : '';

  const isActive = (path: string) => (activePath === path ? ' active' : '');

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'BeeLab',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description,
    inLanguage: 'uk',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'UAH' },
  });

  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fullTitle}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="theme-color" content="#5C3317">
  ${canonicalUrl ? `<link rel="canonical" href="${esc(canonicalUrl)}">` : ''}

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${fullTitle}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:locale" content="uk_UA">
  ${canonicalUrl ? `<meta property="og:url" content="${esc(canonicalUrl)}">` : ''}

  <!-- Icons & PWA -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="manifest" href="/manifest.json">

  <!-- Styles -->
  <link rel="stylesheet" href="/vendor/bootstrap/5.3.0/css/bootstrap.min.css">
  <link rel="stylesheet" href="/css/tokens.css">
  <link rel="stylesheet" href="/css/base.css">
  <link rel="stylesheet" href="/css/components.css">

  <script type="application/ld+json">${jsonLd}</script>
</head>
<body class="app-shell">
  <a href="#main-content" class="skip-link">Перейти до основного вмісту</a>

  <header class="app-header">
    <nav class="navbar navbar-expand-lg navbar-dark container">
      <a class="navbar-brand" href="/">
        ${icon('hive')}
        <span>BeeLab</span>
      </a>

      <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Меню">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="mainNav">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0 gap-lg-2">
          ${
            user
              ? `
            <li class="nav-item"><a class="nav-link${isActive('/')}" href="/">${icon('dashboard')} Пасіка</a></li>
            <li class="nav-item"><a class="nav-link${isActive('/add')}" href="/add">${icon('plus')} Додати вулик</a></li>
            <li class="nav-item"><a class="nav-link${isActive('/calendar')}" href="/calendar">${icon('calendar')} Календар</a></li>
            <li class="nav-item"><a class="nav-link${isActive('/finance')}" href="/finance">${icon('finance')} Фінанси</a></li>
            <li class="nav-item"><a class="nav-link${isActive('/analytics')}" href="/analytics">${icon('analytics')} Аналітика</a></li>
          `
              : ''
          }
          <li class="nav-item"><a class="nav-link${isActive('/faq')}" href="/faq">${icon('faq')} FAQ</a></li>
          <li class="nav-item"><a class="nav-link${isActive('/about')}" href="/about">${icon('about')} Про нас</a></li>
        </ul>

        <ul class="navbar-nav ms-auto align-items-lg-center gap-2">
          ${
            user
              ? `
            <li class="nav-item">
              <a class="nav-link${isActive('/profile')}" href="/profile">
                ${icon('user')} ${esc(user.username)}
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/logout">${icon('logout')} Вийти</a>
            </li>
          `
              : `
            <li class="nav-item">
              <a class="nav-link${isActive('/login')}" href="/login">${icon('login')} Вхід</a>
            </li>
            <li class="nav-item">
              <a class="btn btn-bee btn-sm px-3" href="/register">Реєстрація</a>
            </li>
          `
          }
        </ul>
      </div>
    </nav>
  </header>

  <main id="main-content" class="app-main container">
    ${
      flash
        ? `<div class="alert alert-${esc(flash.type)} alert-dismissible fade show mb-4" role="alert" data-auto-dismiss="true">
            ${esc(flash.message)}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Закрити"></button>
          </div>`
        : ''
    }
    ${content}
  </main>

  <footer class="app-footer">
    <div class="container d-flex flex-wrap justify-content-between align-items-center gap-2">
      <span>&copy; ${new Date().getFullYear()} BeeLab — Розумний облік пасіки</span>
      <div class="d-flex gap-3">
        <a href="/faq" class="text-decoration-none text-reset">FAQ</a>
        <a href="/about" class="text-decoration-none text-reset">Про проект</a>
        <a href="/privacy" class="text-decoration-none text-reset">Конфіденційність</a>
        <a href="/terms" class="text-decoration-none text-reset">Умови</a>
      </div>
    </div>
  </footer>

  ${
    user
      ? `<nav class="bottom-nav d-lg-none" aria-label="Мобільна навігація">
          <a href="/" class="bottom-nav__item${isActive('/')}">${icon('dashboard')}<span>Пасіка</span></a>
          <a href="/add" class="bottom-nav__item${isActive('/add')}">${icon('plus')}<span>Додати</span></a>
          <a href="/calendar" class="bottom-nav__item${isActive('/calendar')}">${icon('calendar')}<span>Календар</span></a>
          <a href="/finance" class="bottom-nav__item${isActive('/finance')}">${icon('finance')}<span>Фінанси</span></a>
          <a href="/analytics" class="bottom-nav__item${isActive('/analytics')}">${icon('analytics')}<span>Звіти</span></a>
        </nav>`
      : ''
  }

  <script src="/vendor/bootstrap/5.3.0/js/bootstrap.bundle.min.js" defer></script>
  <script src="/js/app.js" defer></script>
  ${extraScripts.map((src) => `<script src="${esc(src)}" defer></script>`).join('\n  ')}
</body>
</html>`;
}
