import { createGraph, createTable, switchPlot } from "../core";
import { months, monthsPretty } from "../staticData/constants";
import { addConfigField, clearChildren, getCompanyId, getData, prettyMonthName } from "../utils";
import { Graph } from "./graph";

export class CompanyRank implements Graph {
    id = "compRank";
    displayName = "Company Rank";
    configFieldIDs = ["month", "companyName"];
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

        configDiv?.appendChild(addConfigField("select", "month", "Month: ", {prettyValues: monthsPretty, "values": months}, useURLParams && this.urlParams.month ? this.urlParams.month : months[months.length - 1], updateFunc));
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
        const fullCompanyData = await getData(this.loadedData, "company", configValues.month);    // Company data for the current month
        const fullPrevCompanyData = configValues.month == months[0] ? {individual: {}} : await getData(this.loadedData, "company", months[months.indexOf(configValues.month) - 1])
        
        const companyData = fullCompanyData.individual[companyID];  // Company data for this company for this month
        const prevCompanyData = fullPrevCompanyData.individual[companyID];  // Company data for this company for last month. May be undefined.

        if(!companyData){return;}

        var tableData = [] as any[];   // Entries in the table in raw data form
        var tableDisplay = [] as any[];    // Entries in the table in presentable form

        Object.keys(companyData).forEach(ticker => {
            const tableRow = [companyData[ticker].rank, ticker, companyData[ticker].amount, companyData[ticker].volume, companyData[ticker].profit];
            const tableDisplayRow = [] as any[];

            // Add company rank
            if(prevCompanyData)
            {
                const outerRankDiv = document.createElement("div");
                const symbolDiv = document.createElement("div");
                const rankDiv = document.createElement("div");
                
                outerRankDiv.style.display = "flex";

                symbolDiv.style.width = "14px";
                symbolDiv.style.minWidth = "14px";
                symbolDiv.style.marginRight = "2px";

                const prevRank = prevCompanyData[ticker]?.rank;
                const increasing = prevRank < companyData[ticker].rank;

                if(prevRank && prevRank != companyData[ticker].rank)
                {
                    symbolDiv.textContent = increasing ? "▼" : "▲";
				    symbolDiv.style.color = increasing ? "#d9534f" : "#5cb85c";
                }
                
                rankDiv.textContent = companyData[ticker].rank;

                outerRankDiv.appendChild(symbolDiv);
                outerRankDiv.appendChild(rankDiv);
                tableDisplayRow.push(outerRankDiv);
            }
            else
            {
                const rankDiv = document.createElement("div");
                rankDiv.textContent = companyData[ticker].rank;
                tableDisplayRow.push(rankDiv);
            }

            // Add ticker
            const tickerDiv = document.createElement("div");
            tickerDiv.textContent = ticker;
            tableDisplayRow.push(tickerDiv);

            // Add amount
            const amountDiv = document.createElement("div");
            amountDiv.textContent = companyData[ticker].amount.toLocaleString(undefined, {maximumFractionDigits: 1});
            tableDisplayRow.push(amountDiv);

            // Add volume
            const volumeDiv = document.createElement("div");
            volumeDiv.textContent = "$" + companyData[ticker].volume.toLocaleString(undefined, {notation: "compact", maximumSignificantDigits: 3});
            tableDisplayRow.push(volumeDiv);

            // Add profit
            const profitDiv = document.createElement("div");
            var profitText: string;
            if(companyData[ticker].profit < 0)
            {
                profitText = "-$" + (-companyData[ticker].profit).toLocaleString(undefined, {notation: "compact", maximumSignificantDigits: 3});
            }
            else
            {
                profitText = "$" + companyData[ticker].profit.toLocaleString(undefined, {notation: "compact", maximumSignificantDigits: 3});
            }
            profitDiv.textContent = profitText;
            tableDisplayRow.push(profitDiv);

            tableData.push(tableRow);
            tableDisplay.push(tableDisplayRow);
        });

        // Sort by rank by default
        const indices = tableData.map((_, i) => i)
            .sort((a, b) => tableData[a][0] - tableData[b][0]);

        tableData = indices.map(i => tableData[i]);
        tableDisplay = indices.map(i => tableDisplay[i]);

        // Get overall ranks for the title
        const volumeRank = fullCompanyData.totals.volumeRank;

        const title = "Production Ranking of " + companyName + " - " + prettyMonthName(configValues.month) + "\nVolume: #" + fullCompanyData.totals[companyID].volumeRank + ", Profit: #" + fullCompanyData.totals[companyID].profitRank;

        const headers = ["Rank", "Ticker", "Amount [/day]", "Volume [$/day]", "Profit [$/day]"];

        createTable(plotContainerID, title, headers, tableData, tableDisplay);
    }
}