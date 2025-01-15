let zoomLevel = 1;  // Variable to control the zoom level (1 = current range, 2 = zoomed out, etc.)

async function fetchData() {
    try {
        // Get the current date and time
        const now = new Date();
        
        // Calculate the time range based on zoom level
        const timeRangeInHours = 1 * zoomLevel;  // Zoom out by multiplying the zoomLevel

        const start = new Date(now.getTime() - timeRangeInHours * 60 * 60 * 1000);  // Calculate start time
        const end = now;

        // Convert start and end to ISO strings
        const startISOString = start.toISOString();
        const endISOString = end.toISOString();

        // Fetch data with query parameters for the time range
        const response = await fetch(`/data?start=${encodeURIComponent(startISOString)}&end=${encodeURIComponent(endISOString)}`);
        const data = await response.json();

        console.log('Received data:', data);

        // Update the chart with the new time range
        createChart('myChart', data.labels, data.values, 'Braunkohle', 'rgb(75, 192, 192)');
    } catch (error) {
        console.error('Error fetching data:', error);
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

// Zoom-out function to increase the time range
function zoomOut() {
    zoomLevel++;  // Increase zoom level to show more data
    fetchData();  // Fetch new data with updated range
}

// Event listener for the zoom-out button
document.getElementById('zoom-out').addEventListener('click', zoomOut);

// Initial data fetch when the page loads
window.onload = fetchData;
