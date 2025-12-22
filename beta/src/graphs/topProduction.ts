import { Graph } from "./graph"
import { addConfigField, clearChildren, prettyMonthName, query } from "../utils";
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
        // Fields to be queried from table
        const queryFields = configValues.metric == 'deficit' ? 'amount, consumed, volume' : configValues.metric
        
        // Get Data
        const prodData = await query("SELECT ticker, " + queryFields + " FROM ProdInfo WHERE month = '" + configValues.month + "'") as any[]
        
        // Process Data
        if(configValues.metric == 'deficit')	// Populate deficit into data
		{
			prodData.forEach(row => {
				if(!row.amount || row.amount == 0){row.deficit = 0; return;}
				row.deficit = (row.amount - (row.consumed || 0)) * row.volume / row.amount;
			});
		}

        if(configValues.metric == 'deficit')
        {
            prodData.sort((a: any, b: any) => a[configValues.metric] - b[configValues.metric]);
        }
        else
        {
            prodData.sort((a: any, b: any) => b[configValues.metric] - a[configValues.metric]);
        }

        // Extract tickers and volumes into separate arrays
	    const tickers = prodData.map(item => item.ticker);
	    const volumes = prodData.map(item => item[configValues.metric]);

        const titles = {
            'profit': 'Profit Materials',
            'volume': 'Production Volumes',
            'deficit': 'Deficits'
	    } as any;

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