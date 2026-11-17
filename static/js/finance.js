const financeCanvas = document.getElementById('financeChart');

if (financeCanvas) {
    let financeChartData = {};
    try {
        financeChartData = JSON.parse(financeCanvas.dataset.chartData || '{}');
    } catch (error) {
        financeChartData = {};
    }

    if (financeChartData.labels) {
        new Chart(financeCanvas, {
            type: 'line',
            data: {
                labels: financeChartData.labels,
                datasets: [
                    {
                        label: 'Прибуток',
                        data: financeChartData.revenue,
                        borderColor: '#FD7E14',
                        backgroundColor: 'rgba(253, 126, 20, 0.12)',
                        tension: 0.35,
                        fill: true
                    },
                    {
                        label: 'Витрати',
                        data: financeChartData.expenses,
                        borderColor: '#212529',
                        backgroundColor: 'rgba(33, 37, 41, 0.08)',
                        tension: 0.35,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: {
                            usePointStyle: true,
                            boxWidth: 8
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(33, 37, 41, 0.08)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
}
