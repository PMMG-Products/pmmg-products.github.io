import { createGraph, switchPlot } from "../core";
import { monthsPrettyMap } from "../staticData/constants";
import { addConfigField, clearChildren, monthSort, query } from "../utils";
import { Graph } from "./graph";

export class CompanyHistory implements Graph {
    id = "compHistory";
    displayName = "Company History";
    configFieldIDs = ["metric", "companyName"];
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
        configDiv?.appendChild(addConfigField("input", "companyName", "Username: ", undefined, useURLParams ? this.urlParams.companyName : undefined, updateFunc, "-27px"));
        
    }

    async generatePlot(configValues: any, plotContainerID: string)
    {
        if(!configValues.companyName || configValues.companyName == ""){return;}

        // Get Data
        var companyData: any[];
        if(configValues.metric == 'bases')
        {
            companyData = await query("SELECT ci.username, bi.bases, bi.month FROM BaseInfo bi LEFT JOIN CompanyInfo ci ON ci.id = bi.id WHERE LOWER(ci.username) = LOWER('" + configValues.companyName + "')")
        }
        else
        {
            companyData = await query("SELECT ci.username, tcd." + configValues.metric + ", tcd.month FROM TotalCompanyProd tcd LEFT JOIN CompanyInfo ci on ci.id = tcd.id WHERE LOWER(ci.username) = LOWER('" + configValues.companyName + "')")
        }
        companyData.sort(monthSort)

        const months = companyData.map(item => monthsPrettyMap[item.month]);
        const companyArray = companyData.map(item => item[configValues.metric])

        // Create graph
        const titles = {
            'profit': 'Production Profit History of ',
            'volume': 'Production Volume History of ',
            'bases': 'Base Count History of '
        } as any
        const yAxis = {
            'profit': 'Daily Profit [$/day]',
            'volume': 'Daily Volume [$/day]',
            'bases': 'Bases'
        } as any
        createGraph(plotContainerID, [{x: months, y: companyArray, type: 'bar'}], 
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
            title: {text: titles[configValues.metric] + configValues.companyName},
            xaxis: {
                title: {text: 'Month'}
            },
            yaxis: {
                title: {text: yAxis[configValues.metric]}
            }
        }, {})

    }
}