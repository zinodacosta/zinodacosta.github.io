let graphType = 'wholesalePrice'; // Default graph type for the first chart
let graphType2 = 'actualelectricityconsumption'; // Default graph type for the second chart
let myChartInstance; // Store the first chart instance
let myChartInstance2; // Store the second chart instance
let graphIdentifiers; // Will store the graphIdentifiers object

// Function to load the graph identifiers from the JSON file
async function loadGraphIdentifiers() {
    try {
        const response = await fetch('/graphIdentifiers'); // Corrected path
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
        // Get the current date and time
        const now = new Date();
        
        // Calculate the time range for fetching data (1 hour as default)
        const timeRangeInHours = 1;  // Default zoom level is 1

        const start = new Date(now.getTime() - timeRangeInHours * 60 * 60 * 1000); // Start time
        const end = now;

        // Convert start and end to ISO strings
        const startISOString = start.toISOString();
        const endISOString = end.toISOString();

        // Fetch data for the first graph (based on the selected filter)
        console.log(`Fetching data for graph type: ${graphType}, Start: ${startISOString}, End: ${endISOString}`);  // Debug log
        
        // Get the ID for the selected graph type
        const graphData = graphIdentifiers[graphType];
        const graphId = graphData ? graphData.id : '1'; // Default to '1' if not found

        // Update the API URL with the graph ID
        const response = await fetch(`/data?graphType=${graphId}&start=${encodeURIComponent(startISOString)}&end=${encodeURIComponent(endISOString)}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch data from API');
        }

        const data = await response.json();
        console.log('Received data:', data);  // Debug log

        // Check if data has the expected structure
        if (!data.labels || !data.values) {
            throw new Error('Data structure is incorrect. Expected "labels" and "values" arrays.');
        }

        // Destroy the previous chart instance of the first chart if it exists
        if (myChartInstance) {
            myChartInstance.destroy();
        }

        // Get the color and label for the selected graph type
        const color = graphData ? graphData.color : 'rgb(0, 0, 0)'; // Default to black if not found
        const label = graphData ? graphData.label : 'Unknown Graph';

        // Update the first chart with the new data and dynamic color and label
        createChart('myChart', data.labels, data.values, label, color);

        // Fetch and render data for the second graph
        const graphData2 = graphIdentifiers[graphType2];
        const graphId2 = graphData2 ? graphData2.id : '1'; // Default to '1' if not found

        const response2 = await fetch(`/data?graphType=${graphId2}&start=${encodeURIComponent(startISOString)}&end=${encodeURIComponent(endISOString)}`);

        if (!response2.ok) {
            throw new Error('Failed to fetch data for the second graph');
        }

        const data2 = await response2.json();
        console.log('Received data for second graph:', data2);  // Debug log

        // Check if data for the second graph has the expected structure
        if (!data2.labels || !data2.values) {
            throw new Error('Data structure is incorrect for the second graph.');
        }

        // Destroy the previous chart instance of the second chart if it exists
        if (myChartInstance2) {
            myChartInstance2.destroy();
        }

        // Get the color and label for the second graph type
        const color2 = graphData2 ? graphData2.color : 'rgb(0, 0, 0)'; // Default to black if not found
        const label2 = graphData2 ? graphData2.label : 'Unknown Graph';

        // Update the second chart with the new data and dynamic color and label
        createChart2('myChart2', data2.labels, data2.values, label2, color2);

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Function to create the first chart
function createChart(canvasId, labels, values, labelName, borderColor) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    const formattedLabels = labels.map(label => {
        if (typeof label === 'string') {
            return new Date(label);
        }
        return label;
    });

    const minTime = Math.min(...formattedLabels);
    const maxTime = Math.max(...formattedLabels);

    myChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedLabels,
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
                    type: 'time',
                    time: {
                        unit: 'hour',
                        tooltipFormat: 'll HH:mm',
                        displayFormats: {
                            hour: 'D, HH:mm',
                        }
                    },
                    min: minTime,
                    max: maxTime,
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

// Function to create the second chart
function createChart2(canvasId, labels, values, labelName, borderColor) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    const formattedLabels = labels.map(label => {
        if (typeof label === 'string') {
            return new Date(label);
        }
        return label;
    });

    const minTime = Math.min(...formattedLabels);
    const maxTime = Math.max(...formattedLabels);

    myChartInstance2 = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedLabels,
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
                    type: 'time',
                    time: {
                        unit: 'hour',
                        tooltipFormat: 'll HH:mm',
                        displayFormats: {
                            hour: 'D, HH:mm',
                        }
                    },
                    min: minTime,
                    max: maxTime,
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

window.onload = async () => {
    await loadGraphIdentifiers();  // Load graph identifiers first
    fetchData();  // Then fetch data
};
