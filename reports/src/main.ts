import { switchPlot } from "./core";
import { CompanyHistory } from "./graphs/companyHistory";
import { CompanyRank } from "./graphs/companyRank";
import { CompanyTotals } from "./graphs/companyTotals";
import { Graph } from "./graphs/graph";
import { MatHistory } from "./graphs/matHistory";
import { TopCompanies } from "./graphs/topCompanies";
import { TopProduction } from "./graphs/topProduction";
import { UniverseHistory } from "./graphs/universeHistory";
import { MarketOverview } from "./graphs/marketOverview";
import { addPermalink } from "./permalink";
import { addOption } from "./utils";

window.onload = function() {
	// Do permalink stuff
	addPermalink();

	// Populate the graph select with options
	const graphSelect = document.getElementById("graphType") as HTMLSelectElement;

	graphs.forEach(graph => {
		addOption(graphSelect, graph.displayName, graph.id);
	});

	if(urlParams.type)
	{
		graphSelect.value = urlParams.type;
	}

	graphSelect.addEventListener("change", function() {
		graphs.find(graph => graph.id == graphSelect.value)?.setConfigs();
		switchPlot();
	});

	// Initialize default values
	graphs.find(graph => graph.id == graphSelect.value)?.setConfigs(true);
	switchPlot();

	// Set the graphs to fullscreen
	if(urlParams.hideOptions !== undefined)
	{
		const graphTypeContainer = document.getElementById('graphTypeContainer');
		const topTabs = document.getElementById('topTabContainer');
		const configDiv = document.getElementById("selectorSubtypes");
		const plotContainer = document.getElementById("mainPlot")
		if(topTabs && graphTypeContainer && configDiv)
		{
			topTabs.style.display = 'none';
			graphTypeContainer.style.display = 'none';
			configDiv.style.display = 'none';
			plotContainer?.classList.add("fullScreen")
		}
	}
}

const urlParams = Object.fromEntries(new URLSearchParams(window.location.search));
const loadedData = {};
export const graphs: Graph[] = [
	new TopProduction(loadedData, urlParams),
	new TopCompanies(loadedData, urlParams),
	new MatHistory(loadedData, urlParams),
	new UniverseHistory(loadedData, urlParams),
    new MarketOverview(loadedData, urlParams),
	new CompanyTotals(loadedData, urlParams),
	new CompanyHistory(loadedData, urlParams),
	new CompanyRank(loadedData, urlParams)
];