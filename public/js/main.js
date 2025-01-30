let graphType = "wholesalePrice"; //Default graph type for the first chart
let graphTypesForSecondChart = ["actualelectricityconsumption"]; //Default second chart graph type
let myChartInstance; //Store the first chart instance
let myChartInstance2 = null; //Store the second chart instance
let graphIdentifiers; //Will store the graphIdentifiers object



//Define the vertical line plugin for the first chart
const verticalLinePlugin1 = {
    id: "verticalLine1",
    afterDraw(chart) {
        if (chart.tooltip._active && chart.tooltip._active.length) {
            const ctx = chart.ctx;
            const activePoint = chart.tooltip._active[0]; //Get the active tooltip point
            const x = activePoint.element.x; //X-coordinate of the point

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, chart.chartArea.top); //Start from the top of the chart area
            ctx.lineTo(x, chart.chartArea.bottom); //Draw to the bottom of the chart area
            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(0, 0, 0, 0.8)"; //Customize the color of the line
            ctx.stroke();
            ctx.restore();
        }
    }
};

//Define the vertical line plugin for the second chart
const verticalLinePlugin2 = {
    id: "verticalLine2",
    afterDraw(chart) {
        //Check if the tooltip is active and has at least one active point
        if (chart.tooltip && chart.tooltip._active && chart.tooltip._active.length) {
            const ctx = chart.ctx;
            const activePoint = chart.tooltip._active[0]; //Get the active tooltip point
            const x = activePoint.element.x; //X-coordinate of the point

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, chart.chartArea.top); //Start from the top of the chart area
            ctx.lineTo(x, chart.chartArea.bottom); //Draw to the bottom of the chart area
            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(0, 0, 0, 0.8)"; //Customize the color of the line
            ctx.stroke();
            ctx.restore();
        }
    }
};


//Function to load the graph identifiers from the JSON file
async function loadGraphIdentifiers() {
    try {
        const response = await fetch("/graphIdentifiers"); //Fetches from JSON
        if (!response.ok) {
            throw new Error("Failed to load graph identifiers");
        }
        const data = await response.json(); //Wait for response
        graphIdentifiers = data; //Store the loaded graph identifiers
        console.log("[INFO] Graph identifiers loaded:", graphIdentifiers);
    } catch (error) {
        console.error("[ERROR] Loading graph identifiers:", error.message);
    }
}

//Function to fetch data dynamically based on the selected graph type and time range
async function fetchData() {
    if (!graphIdentifiers) { //Ensures loading before proceeding
        console.error("[ERROR] Graph identifiers not loaded yet.");
        return;
    }

    try {
        //Define start and end time for data request
        const now = new Date();
        const timeRangeInHours = 1;
        const start = new Date(now.getTime() - timeRangeInHours * 60 * 60 * 1000);
        const end = now;

        const startISOString = start.toISOString(); //Converts to ISO string
        const endISOString = end.toISOString();

        console.log(`[INFO] Fetching data for graph type: ${graphType}, Start: ${startISOString}, End: ${endISOString}`);

        const graphData = graphIdentifiers[graphType]; //Resolve graphType to ID
        const graphId = graphData ? graphData.id : "1"; //Fallback to ID 1

        //Construct dynamic API URL
        const response = await fetch(`/data?graphType=${graphId}&start=${encodeURIComponent(startISOString)}&end=${encodeURIComponent(endISOString)}`);

        if (!response.ok) {
            throw new Error("Failed to fetch data from API");
        }

        const data = await response.json();
        console.log("[INFO] Received data:", data);

        if (!data.labels || !data.values) {
            throw new Error("Data structure is incorrect. Expected labels and values arrays.");
        }

        //Destroy existing chart instance to avoid overlapping
        if (myChartInstance) {
            myChartInstance.destroy();
        }

        const color = graphData ? graphData.color : "rgb(0, 0, 0)";
        const label = graphData ? graphData.label : "Unknown Graph";

        createChart("myChart", data.labels, data.values, label, color);

        //Fetch data for the second chart
        fetchDataForSecondGraph();
    } catch (error) {
        console.error("[ERROR] Fetching data:", error);
    }
}

//Function to create the first chart
function createChart(canvasId, labels, values, labelName, borderColor) {
    const ctx = document.getElementById(canvasId).getContext("2d");

    const formattedLabels = labels.map(label => (typeof label === "string" ? new Date(label) : label));

    myChartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: formattedLabels,
            datasets: [{
                label: labelName,
                data: values,
                borderColor: borderColor,
                backgroundColor: borderColor.startsWith("rgb")
                    ? borderColor.replace(/rgb\(([^)]+)\)/, "rgba($1, 0.8)")
                    : "rgba(0, 0, 0, 0.8)", //Fallback to black
                tension: 0.1,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHitRadius: 20,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    mode: "index",
                    intersect: false,
                    callbacks: {
                        label: context => `${context.dataset.label}: ${context.raw.toFixed(2)} €/MWh`
                    }
                },
                verticalLine1: {} //Enable the custom plugin
            },
            interaction: {
                mode: "index",
                intersect: false
            },
            scales: {
                x: {
                    type: "time",
                    time: {
                        unit: "hour",
                        tooltipFormat: "ll HH:mm",
                        displayFormats: {
                            hour: "D, HH:mm",
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: "€/MWh"
                    },
                    beginAtZero: true
                }
            }
        },
        plugins: [verticalLinePlugin1] //Register the custom plugin here
    });
}


//Function to fetch data for the second chart
async function fetchDataForSecondGraph() {
    if (!graphIdentifiers) {
        console.error("Graph identifiers not loaded yet.");
        return;
    }

    try {
        if (graphTypesForSecondChart.length === 0) {
            console.error("No graph types selected for the second chart.");
            return;
        }

        graphTypesForSecondChart = ["actualelectricityconsumption", ...graphTypesForSecondChart];

        const graphDataPromises = graphTypesForSecondChart.map(async (graphType) => {
            const graphData = graphIdentifiers[graphType];
            const graphId = graphData ? graphData.id : "1";

            const now = new Date();
            const timeRangeInHours = 1;
            const start = new Date(now.getTime() - timeRangeInHours * 60 * 60 * 1000);
            const end = now;

            const response = await fetch(`/data?graphType=${graphId}&start=${start.toISOString()}&end=${end.toISOString()}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch data for graph type: ${graphType}`);
            }

            const data = await response.json();
            if (!data.labels || !data.values) {
                throw new Error("Data structure for the second chart is incorrect.");
            }

            return {
                labels: data.labels.map(label => new Date(label)),
                values: data.values,
                label: graphData.label || graphType,
                borderColor: graphData.color || "rgb(0, 0, 0)",
            };
        });

        const graphDataArray = await Promise.all(graphDataPromises);
        updateSecondChart(graphDataArray);
    } catch (error) {
        console.error("Error fetching data for second chart:", error);
    }
}

//Function to update the second chart
function updateSecondChart(graphDataArray) {
    const ctx = document.getElementById("myChart2").getContext("2d");

    //Destroy the previous chart instance to prevent overlap
    if (myChartInstance2) {
        myChartInstance2.destroy();
    }

    //Create a new chart instance with the vertical line plugin
    myChartInstance2 = new Chart(ctx, {
        type: "line",
        data: {
            labels: graphDataArray[0].labels, //Assume shared labels across datasets
            datasets: graphDataArray.map(graphData => ({
                label: graphData.label,
                data: graphData.values,
                borderColor: graphData.borderColor,
                backgroundColor: graphData.borderColor.startsWith("rgb")
                    ? graphData.borderColor.replace(/rgb\(([^)]+)\)/, "rgba($1, 0.8)")  //Ensure transparency for background
                    : "rgba(0, 0, 0, 0.8)", //Fallback to black
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
                },
                tooltip: {
                    enabled: true,
                    mode: "index",
                    intersect: false
                },
                verticalLine2: {}  //Ensure plugin is registered
            },
            interaction: {
                mode: "index",
                intersect: false
            },
            scales: {
                x: {
                    type: "time",
                    time: {
                        unit: "hour",
                        tooltipFormat: "ll HH:mm",
                        displayFormats: {
                            hour: "D, HH:mm",
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: "MWh"
                    },
                    beginAtZero: true
                }
            }
        },
        plugins: [verticalLinePlugin2] //Register plugin
    });
}


//Checkbox event listener
document.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
    checkbox.addEventListener("change", () => {
        const selectedCheckboxes = document.querySelectorAll("input[type='checkbox']:checked");
        graphTypesForSecondChart = Array.from(selectedCheckboxes).map(cb => cb.value);
        fetchDataForSecondGraph();
    });
});

//Initial data fetch on page load
window.onload = async () => {
    await loadGraphIdentifiers();
    fetchData();
};