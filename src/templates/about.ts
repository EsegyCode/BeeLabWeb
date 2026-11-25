// src/templates/about.ts
import type { User } from '../db/schema';
import { icon } from '../utils/html';
import { renderLayout } from './layout';

export function renderAbout(user: User | null = null, appUrl = ''): string {
  return renderLayout({
    title: 'Про проект',
    description: 'BeeLab — розумний веб-органайзер для пасічників: облік вуликів, огляди, календар, фінанси, аналітика та Telegram-брифінги.',
    activePath: '/about',
    user,
    appUrl,
    content: `
      <div class="card p-4 p-md-5 mb-4">
        <div class="row align-items-center g-4">
          <div class="col-12 col-lg-8">
            <h1 class="h2 fw-bold mb-3" style="color:var(--bee-brown);">${icon('hive')} Про проект BeeLab</h1>
            <p class="lead mb-3">
              BeeLab — сучасний органайзер для пасічників, створений для швидкого та зручного обліку пасіки прямо зі смартфона у полі або вдома.
            </p>
            <p class="text-muted mb-0">
              Жодних зайвих таблиць і паперових блокнотів: уся історія оглядів, стан маток, лікування від кліща, підкормки, фінанси та щоденні нагадування зібрані в одному легкому застосунку.
            </p>
          </div>
          <div class="col-12 col-lg-4 text-lg-end">
            ${
              user
                ? `<a href="/" class="btn btn-bee btn-lg">${icon('dashboard')} Перейти до пасіки</a>`
                : `<a href="/register" class="btn btn-bee btn-lg">Створити акаунт</a>`
            }
          </div>
        </div>
      </div>

      <div class="row g-3 g-md-4">
        <div class="col-12 col-md-6 col-lg-3">
          <div class="card h-100 p-4">
            <div class="mb-2" style="color:var(--bee-orange);">${icon('hive')}</div>
            <h2 class="h6 fw-bold" style="color:var(--bee-brown);">Облік вуликів</h2>
            <p class="text-muted small mb-0">Журнал оглядів, порода, рік матки, рівень меду та швидкі дії в один дотик.</p>
          </div>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <div class="card h-100 p-4">
            <div class="mb-2" style="color:var(--bee-orange);">${icon('calendar')}</div>
            <h2 class="h6 fw-bold" style="color:var(--bee-brown);">Розумні статуси</h2>
            <p class="text-muted small mb-0">Автоматичні сигнали про огляди, зняття пластин (21 день), перевірку корму та маточники.</p>
          </div>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <div class="card h-100 p-4">
            <div class="mb-2" style="color:var(--bee-orange);">${icon('finance')}</div>
            <h2 class="h6 fw-bold" style="color:var(--bee-brown);">Фінанси та мед</h2>
            <p class="text-muted small mb-0">Контроль витрат, медозбору та продажів із підрахунком чистого прибутку.</p>
          </div>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <div class="card h-100 p-4">
            <div class="mb-2" style="color:var(--bee-orange);">${icon('analytics')}</div>
            <h2 class="h6 fw-bold" style="color:var(--bee-brown);">Погода і Telegram</h2>
            <p class="text-muted small mb-0">Актуальна температура для вашого міста та ранкові зведення у Telegram.</p>
          </div>
        </div>
      </div>
    `,
  });
}
