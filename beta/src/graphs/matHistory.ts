import { createGraph, switchPlot } from "../core";
import { months, monthsPretty } from "../staticData/constants";
import { addConfigField, clearChildren, getData, prettyMonthName } from "../utils";
import { Graph } from "./graph";

export class MatHistory implements Graph {
    id = "matHistory";
    displayName = "MAT History";
    configFieldIDs = ["metric", "ticker"];
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

        configDiv?.appendChild(addConfigField("select", "metric", "Metric: ", {prettyValues: ["Volume", "Profit", "Price", "Produced", "Consumption", "Surplus"], values: ["volume", "profit", "price", "amount", "consumed", "surplus"]}, useURLParams ? this.urlParams.metric : undefined, updateFunc));
        configDiv?.appendChild(addConfigField("input", "ticker", "Ticker: ", undefined, useURLParams && this.urlParams.ticker ? this.urlParams.ticker : undefined, updateFunc));
        
    }

    async generatePlot(configValues: any, plotContainerID: string)
    {
        if(!configValues.ticker || configValues.ticker == ""){return;}

        // Get Data
        const totalTickerData = [];
        for(var i = 0; i < months.length; i++)
        {
            const monthData = await getData(this.loadedData, "prod", months[i]);
            totalTickerData.push(monthData[(configValues.ticker ?? "").toUpperCase()])
        }
        
        const tickerData = [] as number[];  // Data for the specific metric
        const validMonths = [] as string[]; // Months with data
        totalTickerData.forEach((data, i) => {
            if(!data){return;}
            validMonths.push(monthsPretty[i]);

            switch(configValues.metric)
            {
                case "volume":
                    tickerData.push(data.volume);
                    break;
                case "profit":
                    tickerData.push(data.profit);
                    break;
                case "price":
                    tickerData.push(data.amount == 0 ? 0 : data.volume / data.amount);
                    break;
                case "amount":
                    tickerData.push(data.amount);
                    break;
                case "consumed":
                    tickerData.push(data.consumed);
                    break;
                case "surplus":
                    tickerData.push(data.amount - data.consumed);
                    break;
            }
        });

        if(validMonths.length == 0){return;}

        const titles = {
            'profit': 'Production Profit History of ',
            'volume': 'Production Volume History of ',
            'amount': 'Production Amount History of ',
            'price': 'Price History of ',
            'consumed': 'Consumption History of ',
            'surplus': 'Surplus Production History of '
        } as any
        const yAxis = {
            'profit': 'Daily Profit [$/day]',
            'volume': 'Daily Volume [$/day]',
            'amount': 'Daily Production [per day]',
            'price': 'Price [$]',
            'consumed': 'Daily Consumption [per day]',
            'surplus': 'Daily Surplus [per day]'
        } as any

        // Create graph
        createGraph(plotContainerID, [{x: validMonths, y: tickerData, type: 'bar'}], 
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
                title: {text: titles[configValues.metric] + (configValues.ticker ?? "").toUpperCase()},
                xaxis: {
                    title: {text: 'Month'}
                },
                yaxis: {
                    title: {text: yAxis[configValues.metric]}
                }
            }, {})
    }
}