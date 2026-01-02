import { createGraph, switchPlot } from "../core";
import { months, monthsPretty, prettyModeNames } from "../staticData/constants";
import { addConfigField, clearChildren, getData, prettyMonthName, query } from "../utils";
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

        configDiv?.appendChild(addConfigField("select", "metric", "Metric: ", {prettyValues: ["Volume", "Profit", "Bases"], values: ["volume", "profit", "bases"]}, useURLParams ? this.urlParams.metric : undefined, updateFunc));
        configDiv?.appendChild(addConfigField("select", "month", "Month: ", {prettyValues: monthsPretty, "values": months}, useURLParams && this.urlParams.month ? this.urlParams.month : months[months.length - 1], updateFunc));
        
    }

    async generatePlot(configValues: any, plotContainerID: string)
    {
        
        // Get Data
        var companyData: any[];
        if(configValues.metric == 'bases')
        {
            companyData = await query("SELECT COALESCE(ci.username, bi.id, bi.bases FROM BaseInfo bi LEFT JOIN CompanyInfo ci ON ci.id = bi.id WHERE bi.month = '" + configValues.month + "'")
            companyData.forEach(data => {
                data.username = data.username ?? data.id.slice(0, 5) + '...' 
            });
        }
        else
        {
            companyData = await query("SELECT ci.username, tcd.id, tcd." + configValues.metric + " FROM TotalCompanyProd tcd LEFT JOIN CompanyInfo ci on ci.id = tcd.id WHERE tcd.month = '" + configValues.month + "'")
            companyData.forEach(data => {
                data.username = data.username ?? data.id.slice(0, 5) + '...' 
            });
        }
        
        // Sort the array by metric in descending order
        companyData.sort((a, b) => b[configValues.metric] - a[configValues.metric]);

        // Extract tickers and volumes into separate arrays
        const companyNames = companyData.map(item => item.username);
        const volumes = companyData.map(item => item[configValues.metric]);
        
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
                    title: {text: configValues.metric == "bases" ? "Bases" : prettyModeNames[configValues.metric] + ' [$/day]'},
                    range: [0, null]
                }
            }, {})
    }
}