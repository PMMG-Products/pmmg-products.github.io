import { createGraph, switchPlot } from "../core";
import { months, monthsPretty, prettyModeNames } from "../staticData/constants";
import { addConfigField, clearChildren, getData, prettyMonthName } from "../utils";
import { Graph } from "./graph";

export class TopCompanies implements Graph {
    id = "topCompanies";
    displayName = "Top Companies";
    configFieldIDs = ["metric", "group", "month"];
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

        configDiv?.appendChild(addConfigField("select", "metric", "Metric: ", {prettyValues: ["Volume", "Profit", "Bases", "Ships"], values: ["volume", "profit", "bases", "ships"]}, useURLParams ? this.urlParams.metric : undefined, updateFunc));
        configDiv?.appendChild(addConfigField("select", "group", "Group: ", {prettyValues: ["By Company", "By Corporation"], values: ["company", "corp"]}, useURLParams ? this.urlParams.group : undefined, updateFunc));
        configDiv?.appendChild(addConfigField("select", "month", "Month: ", {prettyValues: monthsPretty, "values": months}, useURLParams && this.urlParams.month ? this.urlParams.month : months[months.length - 1], updateFunc));
        
    }

    async generatePlot(configValues: any, plotContainerID: string)
    {
        // Get Data
        var fileName;
        switch(configValues.metric)
        {
            case "bases":
                fileName = "base"
                break;
            case "ships":
                fileName = "ship"
                break;
            default:
                fileName = "company"
        }
        const companyData = await getData(this.loadedData, fileName, configValues.month);
        const knownCompanies = await getData(this.loadedData, "knownCompanies");
        const dataset = configValues.metric == "bases" || configValues.metric == "ships" ? companyData : companyData.totals;

        var companyNames;
        var volumes;

        // Return if company data not defined for that month
        if(!companyData)
        {
            console.error("Data type not defined for this month.")
            return;
        }

        // Agglomerate corporations
        if(configValues.group == 'corp')
        {
            const parentCorps = await getData(this.loadedData, 'parentCorps');
            const corpData = {} as any
            Object.keys(dataset).forEach(id => {
                const companyObj = knownCompanies[id]
                if(companyObj && companyObj['Corporation'])
                {
                    var corp = companyObj['Corporation'] as string
                    if(parentCorps[corp]){ corp = parentCorps[corp]; }
                    
                    if(corpData[corp])
                    {
                        corpData[corp] += dataset[id][configValues.metric]
                    }
                    else
                    {
                        corpData[corp] = dataset[id][configValues.metric]
                    }
                }
            });

            // Convert the data object into an array of [corpCode, volume] pairs
            const volumeArray = Object.entries(corpData).map(([corpCode, info]) => ({
                corpCode,
                volume: info as any
            }));

            // Sort the array by volume in descending order
            volumeArray.sort((a, b) => b.volume - a.volume);

            // Extract tickers and volumes into separate arrays
            companyNames = volumeArray.map(item => item.corpCode);
            volumes = volumeArray.map(item => item.volume);
        }
        else
        {
            // Convert the data object into an array of [companyID, volume] pairs
            const volumeArray = Object.entries(dataset).map(([companyID, info]) => ({
                companyID,
                volume: (info as any)[configValues.metric]
            }));

            // Sort the array by volume in descending order
            volumeArray.sort((a, b) => b.volume - a.volume);

            // Extract tickers and volumes into separate arrays
            const companyIDs = volumeArray.map(item => item.companyID);
            volumes = volumeArray.map(item => item.volume);

            companyNames = [] as any[];
            companyIDs.forEach(id => {
                const companyObj = knownCompanies[id]
                companyNames.push(companyObj ? companyObj['Username'] : (id.slice(0, 5) + "..."));
            });
        }

        // Pretty names for group
        const prettyGroupNames = {'company': 'Companies', 'corp': 'Corporations'} as any

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
                title: {text: 'Top ' + prettyGroupNames[configValues.group] + ' (' + prettyModeNames[configValues.metric] + ') - ' + prettyMonthName(configValues.month)},
                xaxis: {
                    title: {text: 'Ticker'},
                    range: [-0.5, 29.5]
                },
                yaxis: {
                    title: {text: prettyModeNames[configValues.metric] + (configValues.metric == 'bases' || configValues.metric == 'ships' ? '' : ' [$/day]')},
                    range: [0, null]
                }
            }, {})
    }
}