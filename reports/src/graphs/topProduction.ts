import { Graph } from "./graph"
import { addConfigField, clearChildren, getData, prettyMonthName } from "../utils";
import { createGraph, switchPlot } from "../core";
import { months, monthsPretty, prettyModeNames } from "../staticData/constants";

export class TopProduction implements Graph {
    id = "topProduction";
    displayName = "Top Production";
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

        configDiv?.appendChild(addConfigField("select", "metric", "Metric: ", {prettyValues: ["Volume", "Profit", "Deficit"], values: ["volume", "profit", "deficit"]}, useURLParams ? this.urlParams.metric : undefined, updateFunc));
        configDiv?.appendChild(addConfigField("select", "month", "Month: ", {prettyValues: monthsPretty, "values": months}, useURLParams && this.urlParams.month ? this.urlParams.month : months[months.length - 1], updateFunc));
        
    }

    async generatePlot(configValues: any, plotContainerID: string)
    {
        // Get Data
        const prodData = await getData(this.loadedData, "prod", configValues.month)
        
        // Process Data
        if(configValues.metric == 'deficit')	// Populate deficit into data
		{
			Object.keys(prodData).forEach(ticker => {
				if(!prodData[ticker].amount || prodData[ticker].amount == 0){prodData[ticker].deficit = 0; return;}
				prodData[ticker].deficit = (prodData[ticker].amount - (prodData[ticker].consumed || 0)) * prodData[ticker].volume / prodData[ticker].amount;
			});
		}

        const titles = {
            'profit': 'Profit Materials',
            'volume': 'Production Volumes',
            'deficit': 'Deficits'
	    } as any;

        // Convert the data object into an array of [ticker, volume] pairs
        const volumeArray = Object.entries(prodData).map(([ticker, info]) => ({
            ticker,
            volume: (info as any)[configValues.metric]
        }));

        // Sort the array by volume in descending order
        if(configValues.metric == 'deficit')
        {
            volumeArray.sort((a, b) => a.volume - b.volume);
        }
        else
        {
            volumeArray.sort((a, b) => b.volume - a.volume);
        }

        // Extract tickers and volumes into separate arrays
	    const tickers = volumeArray.map(item => item.ticker);
	    const volumes = volumeArray.map(item => item.volume);

        // Create graph
        createGraph(plotContainerID, [{x: tickers, y: volumes, type: 'bar'}], 
            {
                width: this.urlParams.hideOptions !== undefined ? undefined : 800,
                height: this.urlParams.hideOptions !== undefined ? undefined : 400,
                autosize: this.urlParams.hideOptions !== undefined,
                ...(this.urlParams.hideOptions !== undefined ? {margin: {
					l: 60,  // left
					r: 10,  // right
					t: 40,  // top
					b: 60   // bottom
				}} : {}),
                title: {text: 'Top ' + titles[configValues.metric] + ' - ' + prettyMonthName(configValues.month)},
                xaxis: {
                    title: {text: 'Ticker'},
                    range: [-0.5, 29.5]
                },
                yaxis: {
                    title: {text: prettyModeNames[configValues.metric] + ' [$/day]'},
                    range: [(configValues.metric == 'deficit' ? null : 0), (configValues.metric == 'deficit' ? 0 : null)]
                }
            }, {})
    }
}