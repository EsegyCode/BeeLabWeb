// src/templates/faq.ts
import type { User } from '../db/schema';
import { icon } from '../utils/html';
import { renderLayout } from './layout';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq1',
    question: 'Як додати новий вулик на пасіку?',
    answer:
      'Увійдіть у свій акаунт, перейдіть на вкладку «Додати вулик» у верхньому меню (або натисніть «Додати» на нижній панелі мобільного) та вкажіть номер вулика, породу бджіл, рік матки та початковий стан.',
  },
  {
    id: 'faq2',
    question: 'Як працюють автоматичні часові статуси вуликів?',
    answer:
      'BeeLab автоматично відстежує важливі дати: через 21 день після встановлення пластин від кліща нагадує зняти їх; через 4 дні після підкормки просить перевірити корм; попереджає за 2 дні до запланованого огляду та сигналізує про прострочення або стару матку (3+ роки).',
  },
  {
    id: 'faq3',
    question: 'Як працює календар завдань?',
    answer:
      'Завдання створюються автоматично після швидких дій (підкормка, пластини, наступний огляд), а також ви можете додавати власні нотатки на сторінці «Календар» і позначати їх виконаними в один клік.',
  },
  {
    id: 'faq4',
    question: 'Як підключити щоденні Telegram-нагадування?',
    answer:
      'Відкрийте сторінку профілю (натисніть на ваше імʼя у верхньому меню), вкажіть свій Telegram Chat ID та місто для прогнозу погоди. Щоранку о 08:00 бот надсилатиме зведення по пасіці, прострочених оглядах та погоду.',
  },
  {
    id: 'faq5',
    question: 'Як вести облік витрат, медозбору та продажів?',
    answer:
      'На сторінці «Фінанси» доступні три вкладки/форми: витрати (інвентар, ліки, цукор, рамки тощо), медозбір у кілограмах та продажі меду. Загальний баланс, середній чек і залишок меду рахуються автоматично.',
  },
  {
    id: 'faq6',
    question: 'Чи можна перенести дані з Excel або експортувати звіт?',
    answer:
      'Так, на сторінці «Аналітика» ви можете експортувати поточні дані пасіки у форматі CSV або завантажити таблицю для імпорту.',
  },
];

export function renderFaq(user: User | null = null, appUrl = ''): string {
  return renderLayout({
    title: 'Допомога / FAQ',
    description: 'Відповіді на популярні запитання щодо роботи з BeeLab: вулики, статуси, календар, фінанси та Telegram-нагадування.',
    activePath: '/faq',
    user,
    appUrl,
    content: `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 class="h3 fw-bold mb-1" style="color:var(--bee-brown);">${icon('faq')} Допомога та часті запитання</h1>
          <p class="text-muted small mb-0">Усе, що потрібно знати для зручної роботи з пасікою в BeeLab</p>
        </div>
        ${user ? `<a href="/" class="btn btn-bee btn-sm">${icon('dashboard')} На пасіку</a>` : `<a href="/register" class="btn btn-bee btn-sm">Почати безкоштовно</a>`}
      </div>

      <div class="card p-3 p-md-4">
        <div class="accordion accordion-flush" id="faqAccordion">
          ${FAQ_ITEMS.map(
            (item, idx) => `
            <div class="accordion-item">
              <h2 class="accordion-header" id="heading-${item.id}">
                <button
                  class="accordion-button ${idx === 0 ? '' : 'collapsed'} fw-semibold"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#${item.id}"
                  aria-expanded="${idx === 0 ? 'true' : 'false'}"
                  aria-controls="${item.id}"
                >
                  ${item.question}
                </button>
              </h2>
              <div
                id="${item.id}"
                class="accordion-collapse collapse ${idx === 0 ? 'show' : ''}"
                aria-labelledby="heading-${item.id}"
                data-bs-parent="#faqAccordion"
              >
                <div class="accordion-body text-muted">
                  ${item.answer}
                </div>
              </div>
            </div>
          `
          ).join('')}
        </div>
      </div>
    `,
  });
}
