let graphType = 'wholesalePrice';  // Default graph type for the first chart
let graphTypesForSecondChart = ['actualelectricityconsumption']; // Default second chart graph type
let myChartInstance;  // Store the first chart instance
let myChartInstance2 = null; // Store the second chart instance
let graphIdentifiers; // Will store the graphIdentifiers object

// Function to load the graph identifiers from the JSON file
async function loadGraphIdentifiers() {
    try {
        const response = await fetch('/graphIdentifiers');  // Fetches from JSON
        if (!response.ok) {
            throw new Error('Failed to load graph identifiers');
        }
        const data = await response.json(); // Wait for response
        graphIdentifiers = data; // Store the loaded graph identifiers
        console.log('Graph identifiers loaded:', graphIdentifiers);
    } catch (error) {
        console.error('Error loading graph identifiers:', error.message);
    }
}

// Function to fetch data dynamically based on the selected graph type and time range
async function fetchData() {
    if (!graphIdentifiers) { // Ensures loading before proceeding
        console.error('Graph identifiers not loaded yet.');
        return;
    }

    try {
        // Defining start and end time for data request
        const now = new Date();
        const timeRangeInHours = 1;
        const start = new Date(now.getTime() - timeRangeInHours * 60 * 60 * 1000);
        const end = now;

        const startISOString = start.toISOString(); // Converts start and end time into ISO string format for the API
        const endISOString = end.toISOString();

        console.log(`Fetching data for graph type: ${graphType}, Start: ${startISOString}, End: ${endISOString}`);

        const graphData = graphIdentifiers[graphType]; // Resolving graphType to ID
        const graphId = graphData ? graphData.id : '1'; // Sets to 1 if undefined

        // Constructing dynamic API URL
        const response = await fetch(`/data?graphType=${graphId}&start=${encodeURIComponent(startISOString)}&end=${encodeURIComponent(endISOString)}`);

        if (!response.ok) {
            throw new Error('Failed to fetch data from API');
        }

        const data = await response.json();
        console.log('Received data:', data);

        if (!data.labels || !data.values) {
            throw new Error('Data structure is incorrect. Expected "labels" and "values" arrays.');
        }

        if (myChartInstance) { // Destroying existing chart instance to avoid overlapping
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
                pointHoverRadius: 6, // Enlarged point size on hover
                pointHitRadius: 20 // Area around the point that triggers hover
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
                    min: minTime, // Set min to the first label's time
                    max: maxTime, // Set max to the latest label's time
                },
                y: {
                    title: {
                        display: true,
                        text: '€/MWh'
                    },
                    beginAtZero: true
                }
            },
            layout: {
                padding: {
                    right: 500,
                    left: 10
                }
            }
        }
    });
}

// Select all checkboxes and add event listeners
document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
        // Get the selected checkboxes
        const selectedCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
        
        // Ensure that selectedCheckboxes is iterable and the array is updated
        graphTypesForSecondChart = Array.from(selectedCheckboxes).map(checkbox => checkbox.value);

        console.log('Selected Graph Types for Second Chart:', graphTypesForSecondChart); // Debugging line

        // Fetch data for the second graph
        fetchDataForSecondGraph();
    });
});

// Function to fetch data for the second graph
async function fetchDataForSecondGraph() {
    if (!graphIdentifiers) {
        console.error('Graph identifiers not loaded yet.');
        return;
    }

    try {
        // Ensure there are selected graph types
        if (graphTypesForSecondChart.length === 0) {
            console.error('No graph types selected for the second chart.');
            return;
        }

        // Always include 'actualelectricityconsumption' in the second chart
        graphTypesForSecondChart = ['actualelectricityconsumption', ...graphTypesForSecondChart];

        // Fetch data for all selected graph types
        const graphDataPromises = graphTypesForSecondChart.map(async (graphType) => {
            const graphData = graphIdentifiers[graphType];
            const graphId = graphData ? graphData.id : '1'; // Default ID if not found

            const now = new Date();
            const timeRangeInHours = 1;
            const start = new Date(now.getTime() - timeRangeInHours * 60 * 60 * 1000);
            const end = now;
            const startISOString = start.toISOString();
            const endISOString = end.toISOString();

            const response = await fetch(`/data?graphType=${graphId}&start=${encodeURIComponent(startISOString)}&end=${encodeURIComponent(endISOString)}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch data for graph type: ${graphType}`);
            }

            const data = await response.json();
            if (!data.labels || !data.values) {
                throw new Error('Data structure for the second chart is incorrect.');
            }

            return {
                labels: data.labels.map(label => new Date(label)),
                values: data.values,
                label: graphData.label || graphType,
                borderColor: graphData.color || 'rgb(0, 0, 0)',
            };
        });

        const graphDataArray = await Promise.all(graphDataPromises);

        // Create or update the second chart with multiple datasets
        updateSecondChart(graphDataArray);
    } catch (error) {
        console.error('Error fetching data for second chart:', error);
    }
}

// Function to update the second chart
function updateSecondChart(graphDataArray) {
    const ctx = document.getElementById('myChart2').getContext('2d');

    // Destroy the existing chart instance to avoid overlapping
    if (myChartInstance2) {
        myChartInstance2.destroy();
    }

    myChartInstance2 = new Chart(ctx, {
        type: 'line',
        data: {
            labels: graphDataArray[0].labels,  // Assuming all graphs have the same labels
            datasets: graphDataArray.map(graphData => ({
                label: graphData.label,
                data: graphData.values,
                borderColor: graphData.borderColor,
                backgroundColor: graphData.borderColor.replace(/rgb\(([^)]+)\)/, 'rgba($1, 0.8)'),
                tension: 0.1,
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHitRadius: 20,
            }))
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'hour',
                        tooltipFormat: 'll HH:mm',
                        displayFormats: {
                            hour: 'D, HH:mm',
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'MWh'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// Initial data fetch when the page loads
window.onload = async () => {
    await loadGraphIdentifiers();  // Load graph identifiers first
    fetchData();  // Then fetch data
};
