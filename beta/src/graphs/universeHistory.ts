import { createGraph, switchPlot } from "../core";
import { monthsPrettyMap } from "../staticData/constants";
import { addConfigField, clearChildren, query, monthSort } from "../utils";
import { Graph } from "./graph";

export class UniverseHistory implements Graph {
    id = "universeHistory";
    displayName = "Universe History";
    configFieldIDs = ["metric"];
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

        configDiv?.appendChild(addConfigField("select", "metric", "Metric: ", {prettyValues: ["Volume", "Profit", "Bases", "Companies"], values: ["volume", "profit", "bases", "companies"]}, useURLParams ? this.urlParams.metric : undefined, updateFunc));
    }

    async generatePlot(configValues: any, plotContainerID: string)
    {
        // Get Data
        const fullData = await query("select month, " + configValues.metric + " from UniverseInfo") as any[]
        fullData.sort(monthSort)

        const months = fullData.map(x => monthsPrettyMap[x.month]);
        const data = fullData.map(x => x[configValues.metric]);

        // Create graph
        const titles = {
            'profit': 'Profit History of the Universe',
            'volume': 'Production Volume History of the Universe',
            'bases': 'Base Count History of the Universe',
            'companies': 'Company Count History of the Universe'
        } as any
        const yAxis = {
            'profit': 'Daily Profit [$/day]',
            'volume': 'Daily Volume [$/day]',
            'bases': 'Bases',
            'companies': 'Companies'
        } as any
        createGraph(plotContainerID, [{x: months, y: data, type: 'bar'}], 
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
            title: {text: titles[configValues.metric]},
            xaxis: {
                title: {text: 'Month'}
            },
            yaxis: {
                title: {text: yAxis[configValues.metric]}
            }
        }, {})

    }
}