import { createGraph, switchPlot } from "../core";
import { months, monthsPretty, prettyModeNames } from "../staticData/constants";
import { addConfigField, clearChildren, getData, prettyMonthName } from "../utils";
import { Graph } from "./graph";

export class TopCompanies implements Graph {
    id = "topCompanies";
    displayName = "Top Companies";
    configFieldIDs = ["metric", "month"];
    loadedData: any;
    urlParams: any;

    constructor(loadedData: any, urlParams: any)
    {
        this.loadedData = loadedData;
        this.urlParams = urlParams;
    }

    setConfigs(useURLParams?: boolean)
    {
        const updateFunc = function() {switchPlot();}

        const configDiv = document.getElementById("selectorSubtypes");
        if(configDiv)
        {
            clearChildren(configDiv);
        }

        configDiv?.appendChild(addConfigField("select", "metric", "Metric: ", {prettyValues: ["Volume", "Profit"], values: ["volume", "profit"]}, useURLParams ? this.urlParams.metric : undefined, updateFunc));
        configDiv?.appendChild(addConfigField("select", "month", "Month: ", {prettyValues: monthsPretty, "values": months}, useURLParams && this.urlParams.month ? this.urlParams.month : months[months.length - 1], updateFunc));
        
    }

    async generatePlot(configValues: any, plotContainerID: string)
    {
        // Get Data
        const companyData = await getData(this.loadedData, "company", configValues.month);
        const knownCompanies = await getData(this.loadedData, "knownCompanies");
        
        // Convert the data object into an array of [companyID, volume] pairs
        const volumeArray = Object.entries(companyData.totals).map(([companyID, info]) => ({
            companyID,
            volume: (info as any)[configValues.metric]
        }));

        // Sort the array by volume in descending order
        volumeArray.sort((a, b) => b.volume - a.volume);

        // Extract tickers and volumes into separate arrays
        const companyIDs = volumeArray.map(item => item.companyID);
        const volumes = volumeArray.map(item => item.volume);

        const companyNames = [] as any[];
        companyIDs.forEach(id => {
            companyNames.push(knownCompanies[id] || (id.slice(0, 5) + "..."));
        });

        // Create graph
        createGraph(plotContainerID, [{x: companyNames, y: volumes, type: 'bar'}], 
            {
                width: this.urlParams.hideOptions !== undefined ? undefined : 800,
                height: this.urlParams.hideOptions !== undefined ? undefined : 400,
                autosize: this.urlParams.hideOptions !== undefined,
                ...(this.urlParams.hideOptions !== undefined ? {margin: {
                    l: 60,  // left
                    r: 10,  // right
                    t: 40,  // top
                    b: 100   // bottom
                }} : {}),
                title: {text: 'Top Companies (' + prettyModeNames[configValues.metric] + ') - ' + prettyMonthName(configValues.month)},
                xaxis: {
                    title: {text: 'Ticker'},
                    range: [-0.5, 29.5]
                },
                yaxis: {
                    title: {text: prettyModeNames[configValues.metric] + ' [$/day]'},
                    range: [0, null]
                }
            }, {})
    }
}