// public/js/finance.js — Finance & Analytics helpers

document.addEventListener('DOMContentLoaded', () => {
  // 1. Live total calculation for honey sale form
  const kgInput = document.getElementById('saleKg');
  const priceInput = document.getElementById('salePrice');
  const totalPreview = document.getElementById('saleTotalPreview');

  function updateSaleTotal() {
    if (!kgInput || !priceInput || !totalPreview) return;
    const kg = parseFloat((kgInput.value || '0').replace(',', '.'));
    const price = parseFloat((priceInput.value || '0').replace(',', '.'));
    if (!isNaN(kg) && !isNaN(price) && kg > 0 && price > 0) {
      totalPreview.textContent = (kg * price).toFixed(2) + ' грн';
    } else {
      totalPreview.textContent = '0.00 грн';
    }
  }

  if (kgInput && priceInput) {
    kgInput.addEventListener('input', updateSaleTotal);
    priceInput.addEventListener('input', updateSaleTotal);
  }

  // 2. Analytics Charts (if Chart.js and data attributes are present)
  const statusCanvas = document.getElementById('hiveStatusChart');
  if (statusCanvas && window.Chart) {
    try {
      const chartData = JSON.parse(statusCanvas.getAttribute('data-chart') || '{}');
      new window.Chart(statusCanvas, {
        type: 'doughnut',
        data: {
          labels: chartData.labels || [],
          datasets: [{
            data: chartData.values || [],
            backgroundColor: ['#2E8B4A', '#D97706', '#DC2626', '#8B5A2B'],
            borderWidth: 2,
            borderColor: '#FFFFFF',
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' },
          },
        },
      });
    } catch { /* ignore chart errors */ }
  }

  const financeCanvas = document.getElementById('financeSummaryChart');
  if (financeCanvas && window.Chart) {
    try {
      const chartData = JSON.parse(financeCanvas.getAttribute('data-chart') || '{}');
      new window.Chart(financeCanvas, {
        type: 'bar',
        data: {
          labels: ['Дохід (продаж меду)', 'Витрати', 'Чистий баланс'],
          datasets: [{
            label: 'грн',
            data: [chartData.revenue || 0, chartData.expenses || 0, chartData.profit || 0],
            backgroundColor: ['#2E8B4A', '#DC2626', '#E8730A'],
            borderRadius: 8,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        },
      });
    } catch { /* ignore chart errors */ }
  }
});
