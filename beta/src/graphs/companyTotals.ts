import { createGraph, switchPlot } from "../core";
import { materialCategoryColors, months, monthsPretty, prettyModeNames } from "../staticData/constants";
import { addConfigField, clearChildren, getCompanyId, getData, getMatCategory, getMatColor, prettyMonthName, query } from "../utils";
import { Graph } from "./graph";

export class CompanyTotals implements Graph {
    id = "compTotals";
    displayName = "Company Totals";
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

        configDiv?.appendChild(addConfigField("select", "chartType", "Chart Type: ", {prettyValues: ["Bar", "Pie", "Treemap (Mat)", "Treemap (Cat)"], values: ["bar", "pie", "treemap", "treemap-categories"]}, useURLParams ? this.urlParams.chartType : undefined, updateFunc, "-30px"));
        configDiv?.appendChild(addConfigField("select", "metric", "Metric: ", {prettyValues: ["Volume", "Profit"], values: ["volume", "profit"]}, useURLParams ? this.urlParams.metric : undefined, updateFunc));
        configDiv?.appendChild(addConfigField("select", "month", "Month: ", {prettyValues: monthsPretty, "values": months}, useURLParams && this.urlParams.month ? this.urlParams.month : months[months.length - 1], updateFunc));
        configDiv?.appendChild(addConfigField("input", "companyName", "Username: ", undefined, useURLParams ? this.urlParams.companyName : undefined, updateFunc, "-27px"));
        
    }

    async generatePlot(configValues: any, plotContainerID: string)
    {
        if(!configValues.companyName || configValues.companyName == ""){return;}
        
        const companyData = await query("SELECT icp.ticker, icp." + configValues.metric + " FROM IndivCompanyProd icp LEFT JOIN CompanyInfo ci on ci.id = icp.id WHERE ci.usernamelower = '" + (configValues.companyName).toLowerCase() + "' AND icp.month = '" + configValues.month + "'")
        
        // Parse Data
        var catData = [] as number[]; // Y-axis of chart
        var categories = [] as any[];  // X-axis of chart
        var totalValue = 0; // Total of metric
        companyData.forEach((data: any) => {
            const metric = data[configValues.metric];
            if(metric < 0 && (configValues.chartType == "treemap" || configValues.chartType == "treemap-categories")){return;}
            totalValue += metric;

            if(configValues.chartType == "treemap-categories")
            {
                const category = getMatCategory(data.ticker);
                
                const catIndex = categories.indexOf(category);
                if(catIndex == -1)
                {
                    categories.push(category);
                    catData.push(metric);
                }
                else
                {
                    catData[catIndex] += metric;
                }
            }
            else
            {
                catData.push(metric);
                categories.push(data.ticker);
            }
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
	    } as any;

        if(configValues.chartType == "treemap" || configValues.chartType == "treemap-categories")
        {
            // Get Colors
            const colors = [] as string[];
            if(configValues.chartType == "treemap")
            {
                categories.forEach(cat => {
                    colors.push(getMatColor(cat));
                }); 
            }
            else
            {
                categories.forEach(cat => {
                    colors.push(materialCategoryColors[cat] ?? "#000000");
                });
            }
            
            const parents = categories.map(m => "Total");
            categories.push("Total");
            catData.push(totalValue);
            parents.push('');
            colors.push('#252525');

            // Make graph
            createGraph(plotContainerID, [{
                labels: categories, 
                values: catData, 
                parents: parents, 
                type: 'treemap', 
                maxdepth: 2, 
                branchvalues: 'total',
                marker: {
                    colors: colors,
                },
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
                title: {text: titles[configValues.metric] + configValues.companyName + ' - ' + prettyMonthName(configValues.month)}
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
                    title: {text: titles[configValues.metric] + configValues.companyName + ' - ' + prettyMonthName(configValues.month)},
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
                    title: {text: titles[configValues.metric] + configValues.companyName + ' - ' + prettyMonthName(configValues.month)},
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