import { graphs } from "./main";
import { updatePermalink } from "./permalink";
import { deepMerge } from "./utils";

export function switchPlot()
{
    const graphSelect = document.getElementById("graphType") as HTMLSelectElement;
    const graph = graphs.find(obj => obj.id == graphSelect.value);

    // Configure layout
    const oldGraph = document.getElementById("mainPlot");
	oldGraph?.remove();
	const newGraph = document.createElement("div");
	newGraph.id = "mainPlot";
	const graphContainer = document.getElementById("mainPlotContainer");
	graphContainer?.appendChild(newGraph);

    // Get data
    const configValues = {} as any;
    graph?.configFieldIDs.forEach(id => {
        const inputElem = document.getElementById(id) as HTMLInputElement;
        configValues[id] = inputElem?.value;
    });

    updatePermalink();

    (async () => {
        graph?.generatePlot(configValues, "mainPlot");
    })();
}

// Creating a Plotly graph using several defaults
// Define defaults
const defaultData = {marker: {color: 'rgb(247, 166, 0)'}, hovertemplate: '%{x}: %{y:,.3~s}<extra></extra>'};
const defaultLayout = {
    title: {
        font: {color: '#eee', family: '"Droid Sans", sans-serif'}},
    xaxis: {
        title: {
            font: {color: '#bbb', family: '"Droid Sans", sans-serif'}
        },
        tickfont: {color: '#666', family: '"Droid Sans", sans-serif'},
        tickangle: -45
    },
    yaxis: {
        title: {
            font: {color: '#bbb', family: '"Droid Sans", sans-serif'}
        },
        tickfont: {color: '#666', family: '"Droid Sans", sans-serif'},
        gridcolor: '#323232'
    }, 
    plot_bgcolor: '#252525',
	paper_bgcolor: '#252525',
	dragmode: 'pan'
};
const defaultConfig = {
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d'],  // Remove unwanted buttons
    displaylogo: false,
    scrollZoom: true,
    responsive: true
};
// Actually create the graph
export function createGraph(plotContainerID: string, data: any[], layout: any, config: any)
{
    // Assign default values
    for(var i = 0; i < data.length; i++)
    {
        data[i] = deepMerge(structuredClone(defaultData), data[i]);
    }
    layout = deepMerge(structuredClone(defaultLayout), layout);
    config = deepMerge(structuredClone(defaultConfig), config);
    
    // @ts-ignore
    Plotly.newPlot(plotContainerID, {'data': data, 'layout': layout, 'config': config})
}

// Create a table
export function createTable(plotContainerID: string, titleText: string, headers: string[], data: any[], dataDisplay: any[])
{
    const container = document.getElementById(plotContainerID);
    if(!container){return;}

    // Create title
	const title = document.createElement("div");
	title.textContent = titleText;
	title.classList.add("title");
	container.appendChild(title);

    const table = document.createElement("table");
    
    // Create header
    const header = document.createElement("thead");
    const headRow = document.createElement("tr");

    headers.forEach(label => {
        const column = document.createElement("th");
        column.textContent = label;
        headRow.appendChild(column);
    });
    header.appendChild(headRow);
    table.appendChild(header);

    // Create body
    const body = document.createElement("tbody");
    dataDisplay.forEach((dataRow: HTMLElement[]) => {
        const row = document.createElement("tr");
        dataRow.forEach(dataElem => {
            const td = document.createElement("td");
            td.appendChild(dataElem);
            row.appendChild(td);
        });
        body.appendChild(row);
    });

    table.appendChild(body);

    container.appendChild(table);
}