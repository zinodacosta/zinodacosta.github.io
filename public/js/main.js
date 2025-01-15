async function fetchData() {
    try {
        const response = await fetch('/data');
        const data = await response.json();
        console.log('Empfangene Daten:', data); // Testen der empfangenen Daten

        // Update Chart.js with the transformed data
        const labels = data.labels;  // Zeitstempel
        const values = data.values;  // Verbrauchswerte

        createChart('myChart', labels, values, 'Braunkohle', 'rgb(75, 192, 192)');
    } catch (error) {
        console.error('Fehler beim Abrufen der Daten:', error);
    }
}
function createChart(canvasId, labels, values, labelName, borderColor) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: labelName,
                data: values,
                borderColor: borderColor,
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Zeitstempel'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Erzeugung (kWh)'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}




window.onload = fetchData;

