import { createGraph, switchPlot } from "../core";
import { months, monthsPretty } from "../staticData/constants";
import { addConfigField, clearChildren, getCompanyId, getData } from "../utils";
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

        // Get Company Data
        const knownCompanies = await getData(this.loadedData, "knownCompanies");

        // Get Company ID
        var companyID = await getCompanyId(configValues.companyName, this.loadedData) as string;
        if(!companyID){ return; }
        var companyName = knownCompanies[companyID];

        // Get Data
        const fullCompanyData = [] as any[];    // Company data across the months
        for(var i = 0; i < months.length; i++)
        {
            const monthData = await getData(this.loadedData, configValues.metric == "bases" ? "base" : "company", months[i]);
            fullCompanyData.push(configValues.metric == "bases" ? monthData[companyID] : monthData.totals[companyID]);
        }
        
        const validMonths = [] as string[]; // Months with data
        const companyData = [] as number[]; // Company data for specific metric
        fullCompanyData.forEach((data, i) => {
            if(!data){return;}
            validMonths.push(monthsPretty[i]);
            companyData.push(data[configValues.metric]);
        });

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
        createGraph(plotContainerID, [{x: validMonths, y: companyData, type: 'bar'}], 
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
            title: {text: titles[configValues.metric] + companyName},
            xaxis: {
                title: {text: 'Month'}
            },
            yaxis: {
                title: {text: yAxis[configValues.metric]}
            }
        }, {})

    }
}