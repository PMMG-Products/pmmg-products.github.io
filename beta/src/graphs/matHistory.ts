import { createGraph, switchPlot } from "../core";
import { monthsPrettyMap } from "../staticData/constants";
import { addConfigField, clearChildren, monthSort, query } from "../utils";
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
        const ticker = configValues.ticker ? (configValues.ticker).toUpperCase() : undefined

        // Get Data
        var prodData: any[]
        switch(configValues.metric)
        {
            case 'price':
                prodData = await query("SELECT CASE WHEN amount = 0 THEN 0 ELSE volume/amount END price, month FROM ProdInfo WHERE ticker = '" + ticker + "'")
                break;
            case 'surplus':
                prodData = await query("SELECT amount - consumed surplus, month FROM ProdInfo WHERE ticker = '" + ticker + "'")
                break;
            default:
                prodData = await query("SELECT " + configValues.metric + ", month FROM ProdInfo WHERE ticker = '" + ticker + "'")
        
        }
        prodData.sort(monthSort)
        
        const months = prodData.map(item => monthsPrettyMap[item.month]);
        const prodArray = prodData.map(item => item[configValues.metric])

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
        createGraph(plotContainerID, [{x: months, y: prodArray, type: 'bar'}], 
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