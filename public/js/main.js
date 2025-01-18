let zoomLevel = 1;  // Variable to control the zoom level (1 = current range, 2 = zoomed out, etc.)
let graphType = 'wholesalePrice';  // Default graph type
let myChartInstance;  // Store the chart instance

// Function to fetch data dynamically based on the selected graph type and time range
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

        // Fetch data from the API with query parameters for the time range and graph type
        console.log(`Fetching data for graph type: ${graphType}, Start: ${startISOString}, End: ${endISOString}`);  // Debug log
        const response = await fetch(`/data?graphType=${graphType}&start=${encodeURIComponent(startISOString)}&end=${encodeURIComponent(endISOString)}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch data from API');
        }

        const data = await response.json();
        console.log('Received data:', data);  // Debug log

        // Check if data has the expected structure
        if (!data.labels || !data.values) {
            throw new Error('Data structure is incorrect. Expected "labels" and "values" arrays.');
        }

        // Destroy previous chart instance if it exists
        if (myChartInstance) {
            myChartInstance.destroy();
        }

        // Determine the color and Y-axis label based on the selected graph type
        let borderColor, yAxisLabel;
        if (graphType === 'wholesalePrice') {
            borderColor = 'rgb(39, 99, 158)';  // Darker blue for wholesalePrice
            yAxisLabel = 'Price (€/MWh)';
        } else if (graphType === 'actualelectricityconsumption') {
            borderColor = 'rgb(255, 0, 0)';  // Lighter blue for electricity consumption
            yAxisLabel = 'Electricity Consumption (MWh)';
        } else {
            borderColor = 'rgb(75, 192, 192)';  // Default color
            yAxisLabel = 'Value';
        }

        // Update the chart with the new data and Y-axis label
        createChart('myChart', data.labels, data.values, graphType, borderColor, yAxisLabel);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

//Create chart
function createChart(canvasId, labels, values, labelName, borderColor, yAxisLabel) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    myChartInstance = new Chart(ctx, {
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
            plugins: {
                legend: {
                    display: false  // Disable the legend
                }
            },
            scales: {
                x: {},
                y: {
                    title: {
                        display: true,
                        text: yAxisLabel  // Dynamically set the Y-axis label
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

// Event listener for selecting a graph type
document.getElementById('graph-selector').addEventListener('change', (event) => {
    graphType = event.target.value;  // Update the selected graph type
    fetchData();  // Fetch new data with the updated graph type
});

// Initial data fetch when the page loads
window.onload = fetchData;
