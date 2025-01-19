let zoomLevel = 1;  // Variable to control the zoom level (1 = current range, 2 = zoomed out, etc.)
let graphType = 'wholesalePrice';  // Default graph type for the first chart
let myChartInstance;  // Store the first chart instance
let myChartInstance2; // Store the second chart instance
let graphType2 = 'actualelectricityconsumption'; // Default graph type for the second chart

let graphIdentifiers; // Will store the graphIdentifiers object


// Function to load the graph identifiers from the JSON file
async function loadGraphIdentifiers() {
    try {
        const response = await fetch('/graphIdentifiers');  // Corrected path
        if (!response.ok) {
            throw new Error('Failed to load graph identifiers');
        }
        const data = await response.json();
        graphIdentifiers = data; // Store the loaded graph identifiers
        console.log('Graph identifiers loaded:', graphIdentifiers);
    } catch (error) {
        console.error('Error loading graph identifiers:', error.message);
    }
}

// Function to fetch data dynamically based on the selected graph type and time range
async function fetchData() {
    if (!graphIdentifiers) {
        console.error('Graph identifiers not loaded yet.');
        return;
    }

    try {
        const now = new Date();
        const timeRangeInHours = 1 * zoomLevel;

        const start = new Date(now.getTime() - timeRangeInHours * 60 * 60 * 1000);
        const end = now;

        const startISOString = start.toISOString();
        const endISOString = end.toISOString();

        console.log(`Fetching data for graph type: ${graphType}, Start: ${startISOString}, End: ${endISOString}`);

        const graphData = graphIdentifiers[graphType];
        const graphId = graphData ? graphData.id : '1';

        const response = await fetch(`/data?graphType=${graphId}&start=${encodeURIComponent(startISOString)}&end=${encodeURIComponent(endISOString)}`);

        if (!response.ok) {
            throw new Error('Failed to fetch data from API');
        }

        const data = await response.json();
        console.log('Received data:', data);

        if (!data.labels || !data.values) {
            throw new Error('Data structure is incorrect. Expected "labels" and "values" arrays.');
        }

        if (myChartInstance) {
            myChartInstance.destroy();
        }              
        const color = graphData ? graphData.color : 'rgb(0, 0, 0)';
        const label = graphData ? graphData.label : 'Unknown Graph';

        createChart('myChart', data.labels, data.values, label, color);

        // Fetch data for the second chart
        fetchDataForSecondGraph();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Function to create the first chart
function createChart(canvasId, labels, values, labelName, borderColor) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    // Convert labels to Date objects if they're not already
    const formattedLabels = labels.map(label => {
        if (typeof label === 'string') {
            return new Date(label); // Convert string to Date object
        }
        return label; // Already a Date object
    });

    // Get the min and max values from the data (start and end of the data range)
    const minTime = Math.min(...formattedLabels); // Minimum time (first label)
    const maxTime = Math.max(...formattedLabels); // Maximum time (last label or current time)

    // Create the chart instance
    myChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedLabels,
            datasets: [{
                label: labelName,
                data: values,
                borderColor: borderColor,
                backgroundColor: borderColor.replace(/rgb\(([^)]+)\)/, 'rgba($1, 0.8)'), // Use same color with transparency
                tension: 0.1,
                fill: true,
                pointRadius: 0, // Remove circles around data points
                pointHoverRadius: 6,   // Enlarged point size on hover
                pointHitRadius: 20     // Area around the point that triggers hover
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false // Disable the legend
                }
            },
            scales: {
                x: {
                    type: 'time', // Use 'time' scale for dates
                    time: {
                        unit: 'hour', // Unit set to hour
                        tooltipFormat: 'll HH:mm', // Format of tooltip (e.g., "Jan 1, 14:00")
                        displayFormats: {
                            hour: 'D, HH:mm', // Only display the day and hour (e.g., "1, 00:00")
                        }
                    },
                    min: minTime,  // Set min to the first label's time
                    max: maxTime,  // Set max to the latest label's time
                },
                y: {
                    title: {
                        display: true,
                        text: '€/MWh'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}
async function fetchDataForSecondGraph() {
    if (!graphIdentifiers) {
        console.error('Graph identifiers not loaded yet.');
        return;
    }

    try {
        const now = new Date();
        const timeRangeInHours = 1 * zoomLevel;

        const start = new Date(now.getTime() - timeRangeInHours * 60 * 60 * 1000);
        const end = now;

        const startISOString = start.toISOString();
        const endISOString = end.toISOString();

        console.log(`Fetching data for graph type: ${graphType2}, Start: ${startISOString}, End: ${endISOString}`);

        const graphData = graphIdentifiers[graphType2];
        const graphId = graphData ? graphData.id : '2'; // Default to '2' if not found

        const response = await fetch(`/data?graphType=${graphId}&start=${encodeURIComponent(startISOString)}&end=${encodeURIComponent(endISOString)}`);

        if (!response.ok) {
            throw new Error('Failed to fetch data from API for the second chart');
        }

        const data = await response.json();
        console.log('Received data for second chart:', data);

        if (!data.labels || !data.values) {
            throw new Error('Data structure for the second chart is incorrect.');
        }

        if (myChartInstance2) {
            myChartInstance2.destroy();
        }

        const color = graphData ? graphData.color : 'rgb(100, 100, 100)'; // Default gray
        const label = graphData ? graphData.label : 'Second Graph';

        createChart2('myChart2', data.labels, data.values, label, color);
    } catch (error) {
        console.error('Error fetching data for second chart:', error);
    }
}

// Function to create the second chart
function createChart2(canvasId, labels, values, labelName, borderColor) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    // Convert labels to Date objects if they're not already
    const formattedLabels = labels.map(label => {
        if (typeof label === 'string') {
            return new Date(label); // Convert string to Date object
        }
        return label; // Already a Date object
    });

    // Get the min and max values from the data (start and end of the data range)
    const minTime = Math.min(...formattedLabels); // Minimum time (first label)
    const maxTime = Math.max(...formattedLabels); // Maximum time (last label or current time)

    // Create the chart instance
    myChartInstance2 = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedLabels,
            datasets: [{
                label: labelName,
                data: values,
                borderColor: borderColor,
                backgroundColor: borderColor.replace(/rgb\(([^)]+)\)/, 'rgba($1, 0.8)'), // Use same color with transparency
                tension: 0.1,
                fill: false,
                pointRadius: 0, // Remove circles around data points
                pointHoverRadius: 6,   // Enlarged point size on hover
                pointHitRadius: 20     // Area around the point that triggers hover
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false // Disable the legend
                }
            },
            scales: {
                x: {
                    type: 'time', // Use 'time' scale for dates
                    time: {
                        unit: 'hour', // Unit set to hour
                        tooltipFormat: 'll HH:mm', // Format of tooltip (e.g., "Jan 1, 14:00")
                        displayFormats: {
                            hour: 'D, HH:mm', // Only display the day and hour (e.g., "1, 00:00")
                        }
                    },
                    min: minTime,  // Set min to the first label's time
                    max: maxTime,  // Set max to the latest label's time
                },
                y: {
                    title: {
                        display: true,
                        text: '€/MWh'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// Zoom-out function to increase the time range (applies only to the first chart)
function zoomOut() {
    zoomLevel++;  // Increase zoom level to show more data
    fetchData();  // Fetch new data with updated range for the first chart
}



// Event listener for selecting a graph type
document.getElementById('graph-selector').addEventListener('change', (event) => {
    graphType = event.target.value;  // Update the selected graph type for the first chart
    fetchData();  // Fetch new data with the updated graph type for the first chart
});

// Initial data fetch when the page loads
window.onload = async () => {
    await loadGraphIdentifiers();  // Load graph identifiers first
    fetchData();  // Then fetch data
};