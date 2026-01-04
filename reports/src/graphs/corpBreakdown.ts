import { createGraph, switchPlot } from "../core";
import { months, monthsPretty, prettyModeNames } from "../staticData/constants";
import { addConfigField, clearChildren, getData, prettyMonthName } from "../utils";
import { Graph } from "./graph";

export class CorporationBreakdown implements Graph {
    id = "corpBreakdown";
    displayName = "Corp Breakdown";

    configFieldIDs = ["chartType", "metric", "month", "companyName"];
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

        configDiv?.appendChild(addConfigField("select", "chartType", "Chart Type: ", {prettyValues: ["Bar", "Pie", "Treemap"], values: ["bar", "pie", "treemap"]}, useURLParams ? this.urlParams.chartType : "treemap", updateFunc, "-30px"));
        configDiv?.appendChild(addConfigField("select", "metric", "Metric: ", {prettyValues: ["Volume", "Profit", "Bases"], values: ["volume", "profit", "bases"]}, useURLParams ? this.urlParams.metric : undefined, updateFunc));
        configDiv?.appendChild(addConfigField("select", "month", "Month: ", {prettyValues: monthsPretty, "values": months}, useURLParams && this.urlParams.month ? this.urlParams.month : months[months.length - 1], updateFunc));
        configDiv?.appendChild(addConfigField("input", "companyName", "Corp Code: ", undefined, useURLParams ? this.urlParams.companyName : undefined, updateFunc, "-29px"));
        
    }

    async generatePlot(configValues: any, plotContainerID: string)
    {
        if(!configValues.companyName || configValues.companyName == ""){return;}
        // Get Company Data
        const companyData = await getData(this.loadedData, configValues.metric == "bases" ? "base" : "company", configValues.month);
        const dataset = configValues.metric == "bases" ? companyData : companyData.totals;

        const knownCompanies = await getData(this.loadedData, "knownCompanies");

        var companyName: string;

        const parentCorps = await getData(this.loadedData, 'parentCorps');
        companyName = configValues.companyName.toUpperCase();
        const corpData = {} as any;
        
        Object.keys(dataset).forEach(id => {
            const companyObj = knownCompanies[id]
            if(companyObj && (companyObj.Corporation == companyName || parentCorps[companyObj.Corporation] == companyName))
            {
                const indivCompanyData = dataset[id];
                const name = companyObj['Username'];
                corpData[name] = indivCompanyData;
            }
        });

        if(Object.keys(corpData).length == 0){return;}

        // Parse Data
        var catData = [] as number[]; // Y-axis of chart
        var categories = [] as any[];  // X-axis of chart
        var totalValue = 0; // Total of metric
        
        Object.keys(corpData).forEach((name: string) => {
            const metric = corpData[name][configValues.metric];
            if(metric < 0 && (configValues.chartType == "treemap")){return;}
            totalValue += metric;

            catData.push(metric);
            categories.push(name);

        });

        // Sort data from largest to smallest categories
        const indices = Array.from(categories.keys());
        indices.sort((a, b) => catData[b] - catData[a]);
        catData = indices.map(i => catData[i]);
        categories = indices.map(i => categories[i]);

        // Create graph
        const titles = {
		    'profit': 'Production Profit Breakdown of ',
		    'volume': 'Production Volume Breakdown of ',
            'bases': 'Base Breakdown of '
	    } as any;

        if(configValues.chartType == "treemap")
        {
            
            const parents = categories.map(m => "Total");
            categories.push("Total");
            catData.push(totalValue);
            parents.push('');

            // Make graph
            createGraph(plotContainerID, [{
                labels: categories, 
                values: catData, 
                parents: parents, 
                type: 'treemap', 
                maxdepth: 2, 
                branchvalues: 'total',
                tiling: {
                    pad: 0,
                },
                textposition: 'middle center',
                hovertemplate: '%{label}<br>$%{value:,.3~s}/day<br>%{percentEntry:.2%}<extra></extra>'}],
            {
                width: this.urlParams.hideOptions !== undefined ? undefined : 800,
                height: this.urlParams.hideOptions !== undefined ? undefined : 400,
                autosize: this.urlParams.hideOptions !== undefined,
                ...(this.urlParams.hideOptions !== undefined ? {margin: {
                    l: 10,  // left
                    r: 10,  // right
                    t: 40,  // top
                    b: 10   // bottom
                }} : {}),
                title: {text: titles[configValues.metric] + companyName + ' - ' + prettyMonthName(configValues.month)}
            }, {})
        }
        else if(configValues.chartType == "bar")
        {
            // Create graph
            createGraph(plotContainerID, [{x: categories, y: catData, type: 'bar'}], 
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
                    title: {text: titles[configValues.metric] + companyName + ' - ' + prettyMonthName(configValues.month)},
                    xaxis: {
                        title: {text: 'Ticker'},
                        range: [-0.5, Math.min(categories.length, 30) - 0.5]
                    },
                    yaxis: {
                        title: {text: prettyModeNames[configValues.metric] + ' [$/day]'},
                        range: [0, null]
                    }
                }, {})
        }
        else if(configValues.chartType == "pie")
        {
            // Create graph
            createGraph(plotContainerID, [{labels: categories, values: catData, type: 'pie', textinfo: 'label',textposition: 'inside', insidetextorientation: 'none', automargin: false, hovertemplate: '%{label}<br>$%{value:,.3~s}/day<br>%{percent}<extra></extra>'}], 
                {
                    width: this.urlParams.hideOptions !== undefined ? undefined : 800,
                    height: this.urlParams.hideOptions !== undefined ? undefined : 400,
                    autosize: this.urlParams.hideOptions !== undefined,
                    ...(this.urlParams.hideOptions !== undefined ? {margin: {
                        l: 10,  // left
                        r: 10,  // right
                        t: 40,  // top
                        b: 10   // bottom
                    }} : {}),
                    title: {text: titles[configValues.metric] + companyName + ' - ' + prettyMonthName(configValues.month)},
                    xaxis: {
                        title: {text: 'Ticker'},
                        range: [-0.5, Math.min(categories.length, 30) - 0.5]
                    },
                    yaxis: {
                        title: {text: prettyModeNames[configValues.metric] + ' [$/day]'},
                        range: [0, null]
                    }
                }, {})
        }
    }

}

