// Format numbers for tooltip display, trimming trailing zeros for decimals
function formatTooltipNumber(value) {
  if (typeof value !== 'number' || !isFinite(value)) {
    return value;
  }
  const rounded = Math.round(value);
  return Math.abs(value - rounded) < 1e-6 ? rounded : parseFloat(value.toFixed(2));
}

// Initialize all charts after components are loaded
function initializeCharts() {
  // Check if Chart.js is loaded
  if (typeof Chart === 'undefined') {
    console.error('Chart.js is not loaded');
    return;
  }

  // LLaDA Chart
  const lladaCtx = document.getElementById('lladaChart');
  if (lladaCtx) {
    new Chart(lladaCtx.getContext('2d'), {
      type: 'line',
      data: {
        labels: [1, 2, 4, 8, 16, 32],
        datasets: [
          {
            label: 'Copy',
            data: [100, 100, 100, 100, 100, 98],
            borderColor: 'rgb(249, 115, 22)',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
          {
            label: 'Replace Idx.',
            data: [43, 42, 38, 38, 35, 25],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
          {
            label: 'Replace Rand.',
            data: [99, 79, 71, 39, 21, 8],
            borderColor: 'rgb(168, 85, 247)',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
          {
            label: 'Shuffle',
            data: [100, 30, 27, 4, 3, 1],
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                size: 14,
                weight: 'bold',
              },
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 15,
              boxHeight: 15,
            },
            maxWidth: 500,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            callbacks: {
              title: function (context) {
                if (!context.length) return '';
                const point = context[0];
                const xValue =
                  typeof point.parsed?.x !== 'undefined' ? point.parsed.x : point.label;
                return '# Tokens per Step: ' + formatTooltipNumber(xValue);
              },
              label: function (context) {
                return context.dataset.label + ': ' + context.parsed.y + '%';
              },
            },
          },
        },
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: '# Tokens per Step',
              font: {
                size: 16,
                weight: 'bold',
              },
              color: '#334155',
            },
            min: 0,
            max: 35,
            grid: {
              color: 'rgba(148, 163, 184, 0.1)',
            },
            ticks: {
              values: [1, 2, 4, 8, 16, 32],
              font: {
                size: 12,
              },
              color: '#64748b',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Accuracy (%)',
              font: {
                size: 16,
                weight: 'bold',
              },
              color: '#334155',
            },
            min: -10,
            max: 110,
            grid: {
              color: 'rgba(148, 163, 184, 0.1)',
            },
            afterBuildTicks: function (axis) {
              axis.ticks = [0, 20, 40, 60, 80, 100].map((v) => ({
                value: v,
              }));
            },
            ticks: {
              font: {
                size: 12,
              },
              color: '#64748b',
              callback: function (value) {
                return value + '%';
              },
            },
          },
        },
      },
    });
  }

  // Dream Chart
  const dreamCtx = document.getElementById('dreamChart');
  if (dreamCtx) {
    new Chart(dreamCtx.getContext('2d'), {
      type: 'line',
      data: {
        labels: [1, 2, 4, 8, 16, 32],
        datasets: [
          {
            label: 'Copy',
            data: [100, 100, 100, 100, 100, 100],
            borderColor: 'rgb(249, 115, 22)',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
          {
            label: 'Replace Idx.',
            data: [27, 26, 24, 26, 27, 24],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
          {
            label: 'Replace Rand.',
            data: [99, 100, 53, 27, 17, 3],
            borderColor: 'rgb(168, 85, 247)',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
          {
            label: 'Shuffle',
            data: [99, 99, 9, 0, 0, 0],
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                size: 14,
                weight: 'bold',
              },
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 15,
              boxHeight: 15,
            },
            maxWidth: 500,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            callbacks: {
              title: function (context) {
                if (!context.length) return '';
                const point = context[0];
                const xValue =
                  typeof point.parsed?.x !== 'undefined' ? point.parsed.x : point.label;
                return '# Tokens per Step: ' + formatTooltipNumber(xValue);
              },
              label: function (context) {
                return context.dataset.label + ': ' + context.parsed.y + '%';
              },
            },
          },
        },
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: '# Tokens per Step',
              font: {
                size: 16,
                weight: 'bold',
              },
              color: '#334155',
            },
            min: 0,
            max: 35,
            grid: {
              color: 'rgba(148, 163, 184, 0.1)',
            },
            ticks: {
              values: [1, 2, 4, 8, 16, 32],
              font: {
                size: 12,
              },
              color: '#64748b',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Accuracy (%)',
              font: {
                size: 16,
                weight: 'bold',
              },
              color: '#334155',
            },
            min: -10,
            max: 110,
            grid: {
              color: 'rgba(148, 163, 184, 0.1)',
            },
            afterBuildTicks: function (axis) {
              axis.ticks = [0, 20, 40, 60, 80, 100].map((v) => ({
                value: v,
              }));
            },
            ticks: {
              font: {
                size: 12,
              },
              color: '#64748b',
              callback: function (value) {
                return value + '%';
              },
            },
          },
        },
      },
    });
  }

  // Trade-off Chart
  const tradeoffCtx = document.getElementById('tradeoffChart');
  if (tradeoffCtx) {
    new Chart(tradeoffCtx.getContext('2d'), {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Random Top-k',
            data: [
              { x: 1.0, y: 75.81 },
              { x: 2.0, y: 67.74 },
              { x: 4.0, y: 63.04 },
              { x: 8.0, y: 47.27 },
              { x: 16.0, y: 32.89 },
              { x: 32.0, y: 20.0 },
            ],
            borderColor: 'rgb(14, 165, 233)',
            backgroundColor: 'rgb(14, 165, 233)',
            pointRadius: 6,
            pointHoverRadius: 8,
          },
          {
            label: 'Left to Right Top-k',
            data: [
              { x: 1.0, y: 78.07 },
              { x: 2.0, y: 58.56 },
              { x: 4.0, y: 31.39 },
              { x: 8.0, y: 21.39 },
              { x: 16.0, y: 17.0 },
              { x: 32.0, y: 16.7 },
            ],
            borderColor: 'rgb(168, 85, 247)',
            backgroundColor: 'rgb(168, 85, 247)',
            pointRadius: 6,
            pointHoverRadius: 8,
          },
          {
            label: 'Confidence Top-k',
            data: [
              { x: 1.0, y: 86.36 },
              { x: 2.0, y: 68.91 },
              { x: 4.0, y: 55.68 },
              { x: 8.0, y: 38.63 },
              { x: 16.0, y: 26.7 },
              { x: 32.0, y: 16.5 },
            ],
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgb(34, 197, 94)',
            pointRadius: 6,
            pointHoverRadius: 8,
          },
          {
            label: 'Confidence Threshold',
            data: [
              { x: 3.1, y: 86.16 },
              { x: 7.8, y: 84.06 },
              { x: 9.8, y: 77.17 },
              { x: 11.56, y: 67.29 },
              { x: 13.46, y: 58.69 },
              { x: 15.94, y: 47.0 },
            ],
            borderColor: 'rgb(234, 179, 8)',
            backgroundColor: 'rgb(234, 179, 8)',
            pointRadius: 6,
            pointHoverRadius: 8,
          },
          {
            label: 'Confidence Threshold (Oracle)',
            data: [{ x: 13.44, y: 88.11 }],
            borderColor: 'rgb(234, 179, 8)',
            backgroundColor: 'rgb(234, 179, 8)',
            pointRadius: 12,
            pointHoverRadius: 14,
            pointStyle: 'star',
            borderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                size: 14,
                weight: 'bold',
              },
              padding: 15,
              usePointStyle: true,
              boxWidth: 15,
              boxHeight: 15,
            },
            maxWidth: 500,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            callbacks: {
              title: function (context) {
                if (!context.length) return '';
                const point = context[0];
                const xValue =
                  typeof point.parsed?.x !== 'undefined' ? point.parsed.x : point.label;
                return (
                  'Parallelism: ' + formatTooltipNumber(xValue) + ' tokens per step'
                );
              },
              label: function (context) {
                return context.dataset.label + ': ' + context.parsed.y + '%';
              },
            },
          },
        },
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: 'Parallelism (# Tokens per Step)',
              font: {
                size: 16,
                weight: 'bold',
              },
              color: '#334155',
            },
            min: 0,
            max: 35,
            grid: {
              color: 'rgba(148, 163, 184, 0.1)',
            },
            ticks: {
              values: [1, 2, 4, 8, 16, 32],
              font: {
                size: 12,
              },
              color: '#64748b',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Accuracy (%)',
              font: {
                size: 16,
                weight: 'bold',
              },
              color: '#334155',
            },
            min: -10,
            max: 110,
            grid: {
              color: 'rgba(148, 163, 184, 0.1)',
            },
            afterBuildTicks: function (axis) {
              axis.ticks = [0, 20, 40, 60, 80, 100].map((v) => ({
                value: v,
              }));
            },
            ticks: {
              font: {
                size: 12,
              },
              color: '#64748b',
              callback: function (value) {
                return value + '%';
              },
            },
          },
        },
      },
    });
  }

  // Mercury Chart
  const mercuryCtx = document.getElementById('mercuryChart');
  if (mercuryCtx) {
    new Chart(mercuryCtx.getContext('2d'), {
      type: 'line',
      data: {
        labels: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
        datasets: [
          {
            label: 'Reverse',
            data: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 99, 99, 100],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
          {
            label: 'Shuffle',
            data: [100, 100, 100, 100, 100, 100, 96, 99, 90, 95, 92, 86, 67, 68, 49, 39],
            borderColor: 'rgb(168, 85, 247)',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                size: 14,
                weight: 'bold',
              },
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 15,
              boxHeight: 15,
            },
            maxWidth: 500,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            callbacks: {
              title: function (context) {
                if (!context.length) return '';
                const point = context[0];
                const xValue =
                  typeof point.parsed?.x !== 'undefined' ? point.parsed.x : point.label;
                return '# Names in Question: ' + formatTooltipNumber(xValue);
              },
              label: function (context) {
                return context.dataset.label + ': ' + context.parsed.y + '%';
              },
            },
          },
        },
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: '# Names in Question (n)',
              font: {
                size: 16,
                weight: 'bold',
              },
              color: '#334155',
            },
            min: 3,
            max: 22,
            grid: {
              color: 'rgba(148, 163, 184, 0.1)',
            },
            afterBuildTicks: function (axis) {
              axis.ticks = [5, 10, 15, 20].map((v) => ({
                value: v,
              }));
            },
            ticks: {
              font: {
                size: 12,
              },
              color: '#64748b',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Accuracy (%)',
              font: {
                size: 16,
                weight: 'bold',
              },
              color: '#334155',
            },
            min: -10,
            max: 110,
            grid: {
              color: 'rgba(148, 163, 184, 0.1)',
            },
            afterBuildTicks: function (axis) {
              axis.ticks = [0, 20, 40, 60, 80, 100].map((v) => ({
                value: v,
              }));
            },
            ticks: {
              font: {
                size: 12,
              },
              color: '#64748b',
              callback: function (value) {
                return value + '%';
              },
            },
          },
        },
      },
    });
  }

  // Claude Chart
  const claudeCtx = document.getElementById('claudeChart');
  if (claudeCtx) {
    new Chart(claudeCtx.getContext('2d'), {
      type: 'line',
      data: {
        labels: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
        datasets: [
          {
            label: 'Reverse',
            data: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
          {
            label: 'Shuffle',
            data: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
            borderColor: 'rgb(168, 85, 247)',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                size: 14,
                weight: 'bold',
              },
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 15,
              boxHeight: 15,
            },
            maxWidth: 500,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            callbacks: {
              title: function (context) {
                if (!context.length) return '';
                const point = context[0];
                const xValue =
                  typeof point.parsed?.x !== 'undefined' ? point.parsed.x : point.label;
                return '# Names in Question: ' + formatTooltipNumber(xValue);
              },
              label: function (context) {
                return context.dataset.label + ': ' + context.parsed.y + '%';
              },
            },
          },
        },
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: '# Names in Question (n)',
              font: {
                size: 16,
                weight: 'bold',
              },
              color: '#334155',
            },
            min: 3,
            max: 22,
            grid: {
              color: 'rgba(148, 163, 184, 0.1)',
            },
            afterBuildTicks: function (axis) {
              axis.ticks = [5, 10, 15, 20].map((v) => ({
                value: v,
              }));
            },
            ticks: {
              font: {
                size: 12,
              },
              color: '#64748b',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Accuracy (%)',
              font: {
                size: 16,
                weight: 'bold',
              },
              color: '#334155',
            },
            min: -10,
            max: 110,
            grid: {
              color: 'rgba(148, 163, 184, 0.1)',
            },
            afterBuildTicks: function (axis) {
              axis.ticks = [0, 20, 40, 60, 80, 100].map((v) => ({
                value: v,
              }));
            },
            ticks: {
              font: {
                size: 12,
              },
              color: '#64748b',
              callback: function (value) {
                return value + '%';
              },
            },
          },
        },
      },
    });
  }

  // Qwen Chart
  const qwenCtx = document.getElementById('qwenChart');
  if (qwenCtx) {
    new Chart(qwenCtx.getContext('2d'), {
      type: 'line',
      data: {
        labels: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
        datasets: [
          {
            label: 'Reverse',
            data: [100, 99, 98, 98, 93, 84, 85, 82, 80, 74, 75, 59, 56, 46, 44, 42],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
          {
            label: 'Shuffle',
            data: [100, 100, 100, 100, 100, 98, 99, 99, 99, 99, 97, 95, 92, 87, 74, 78],
            borderColor: 'rgb(168, 85, 247)',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                size: 14,
                weight: 'bold',
              },
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 15,
              boxHeight: 15,
            },
            maxWidth: 500,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            callbacks: {
              title: function (context) {
                if (!context.length) return '';
                const point = context[0];
                const xValue =
                  typeof point.parsed?.x !== 'undefined' ? point.parsed.x : point.label;
                return '# Names in Question: ' + formatTooltipNumber(xValue);
              },
              label: function (context) {
                return context.dataset.label + ': ' + context.parsed.y + '%';
              },
            },
          },
        },
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: '# Names in Question (n)',
              font: {
                size: 16,
                weight: 'bold',
              },
              color: '#334155',
            },
            min: 3,
            max: 22,
            grid: {
              color: 'rgba(148, 163, 184, 0.1)',
            },
            afterBuildTicks: function (axis) {
              axis.ticks = [5, 10, 15, 20].map((v) => ({
                value: v,
              }));
            },
            ticks: {
              font: {
                size: 12,
              },
              color: '#64748b',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Accuracy (%)',
              font: {
                size: 16,
                weight: 'bold',
              },
              color: '#334155',
            },
            min: -10,
            max: 110,
            grid: {
              color: 'rgba(148, 163, 184, 0.1)',
            },
            afterBuildTicks: function (axis) {
              axis.ticks = [0, 20, 40, 60, 80, 100].map((v) => ({
                value: v,
              }));
            },
            ticks: {
              font: {
                size: 12,
              },
              color: '#64748b',
              callback: function (value) {
                return value + '%';
              },
            },
          },
        },
      },
    });
  }
}
