import { createGraph, switchPlot } from "../core";
import { months, monthsPretty } from "../staticData/constants";
import { addConfigField, clearChildren, getData, prettyMonthName } from "../utils";
import { Graph } from "./graph";

export class MarketOverview implements Graph {
    id = "marketOverview";
    displayName = "Market Overview";
    configFieldIDs = ["month", "ticker"];
    loadedData: any;
    urlParams: any;

    constructor(loadedData: any, urlParams: any) {
        this.loadedData = loadedData;
        this.urlParams = urlParams;
    }

    setConfigs(useURLParams?: boolean) {
        const updateFunc = switchPlot;

        const configDiv = document.getElementById("selectorSubtypes");
        if (configDiv) {
            clearChildren(configDiv);
        }

        configDiv?.appendChild(addConfigField("select", "month", "Month: ", {
            prettyValues: monthsPretty,
            "values": months
        }, useURLParams && this.urlParams.month ? this.urlParams.month : months[months.length - 1], updateFunc));
        configDiv?.appendChild(addConfigField("input", "ticker", "Ticker: ",
            undefined, useURLParams && this.urlParams.ticker ? this.urlParams.ticker : undefined, updateFunc));
    }

    async generatePlot(configValues: any, plotContainerID: string) {
        const ticker = configValues.ticker?.toUpperCase();
        if (!ticker) {
            return;
        }

        const companyData = await getData(this.loadedData, "company", configValues.month);
        const knownCompanies = await getData(this.loadedData, "knownCompanies");

        const labels = [] as string[];
        const parents = [] as string[];
        const values = [] as number[];
        let totalAmount = 0;
        let totalVolume = 0;
        let totalProfit = 0;
        for (const key of Object.keys(companyData.individual)) {
            const individualData = companyData.individual[key];
            const tickerData = individualData[ticker];
            if (!tickerData) {
                continue;
            }
            labels.push(knownCompanies[key] ?? (key.substring(0, 5) + "..."));
            parents.push("Total");
            values.push(tickerData.amount);
            totalVolume += tickerData.volume;
            totalProfit += tickerData.profit;
            totalAmount += tickerData.amount;
        }

        if (labels.length === 0) {
            return;
        }

        labels.push("Total");
        parents.push("");
        values.push(totalAmount);

        const formatMoney = (num: number) => "$" + num.toLocaleString(undefined, { maximumFractionDigits: 0 });
        const title = `${ticker} Market - ${prettyMonthName(configValues.month)}`
            + "<br>"
            + `Produced per day: ${Math.round(totalAmount).toLocaleString()} ${ticker}`
            + "<br>"
            + `Volume: ${formatMoney(totalVolume)} | Profit: ${formatMoney(totalProfit)}`;

        // Create graph
        createGraph(plotContainerID, [{
                labels: labels,
                values: values,
                parents: parents,
                type: "treemap",
                branchvalues: "total",
                tiling: {
                    pad: 0,
                },
                textposition: "middle center",
                hovertemplate: "%{label}<br>%{value:,.3~s}/day<br>%{percentEntry:.2%}<extra></extra>"
            }],
            {
                title: { text: title },
                width: this.urlParams.hideOptions !== undefined ? undefined : 800,
                height: this.urlParams.hideOptions !== undefined ? undefined : 400,
                autosize: this.urlParams.hideOptions !== undefined,
                ...(this.urlParams.hideOptions !== undefined ? {
                    margin: {
                        l: 10,  // left
                        r: 10,  // right
                        t: 60,  // top
                        b: 10   // bottom
                    }
                } : {}),
            }, {});
    }
}