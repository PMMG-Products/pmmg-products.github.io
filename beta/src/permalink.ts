import { Graph } from "./graphs/graph";
import { graphs } from "./main";

export function addPermalink()
{
    // Permalink stuff
	const permalinkContainer = document.getElementById("permalinkContainer") as HTMLDivElement;
	const permalinkButton = document.getElementById("permalinkButton") as HTMLButtonElement;
	const permalinkCopyButton = document.getElementById("permalinkCopyButton") as HTMLButtonElement;
	const rprunCopyButton = document.getElementById("permalinkCopyButton-rprun") as HTMLButtonElement;
	const permalinkOptionsButton = document.getElementById("hideOptions") as HTMLInputElement;
	const permalinkLatestMonth = document.getElementById("latestMonth") as HTMLInputElement;

	permalinkButton?.addEventListener("click", function(e) {
		e.stopPropagation();
		const currentDisplay = permalinkContainer.style.display;
		if(currentDisplay == "none")
		{
			permalinkContainer.style.display = "block";
		}
		else
		{
			permalinkContainer.style.display = "none";
		}
	});

	document.addEventListener("click", function(e: any) {
		if(!permalinkContainer.contains(e.target) && !permalinkButton.contains(e.target))
		{
			permalinkContainer.style.display = "none";
		}
	});

	permalinkCopyButton.addEventListener("click", function() {
		const permalinkElem = document.getElementById("permalink") as HTMLInputElement;
		if(permalinkElem.value && permalinkElem.value != "")
		{
			navigator.clipboard.writeText(permalinkElem.value);
		}
	});
	
	rprunCopyButton.addEventListener("click", function() {
		const permalinkElem = document.getElementById("permalink-rprun") as HTMLInputElement;
		if(permalinkElem.value && permalinkElem.value != "")
		{
			navigator.clipboard.writeText(permalinkElem.value);
		}
	});

	permalinkOptionsButton.addEventListener("change", function() {
		updatePermalink();
	});
	permalinkLatestMonth.addEventListener("change", function() {
		updatePermalink();
	});
}

export function updatePermalink()
{
	const graphSelect = document.getElementById("graphType") as HTMLSelectElement;
    const permalinkInput = document.getElementById("permalink") as HTMLInputElement;
	const rprunInput = document.getElementById("permalink-rprun") as HTMLInputElement;
	const hideOptionsButton = document.getElementById("hideOptions") as HTMLInputElement;
	const latestMonthButton = document.getElementById("latestMonth") as HTMLInputElement;
	
	var permalink = "https://pmmg-products.github.io/reports/?type=" + graphSelect.value;
	var rprunLink = "XIT PRUNSTATS type-" + graphSelect.value;
	
    const graph = graphs.find(obj => obj.id == graphSelect.value);
	graph?.configFieldIDs.forEach(subtype => {
		if(subtype == "month" && latestMonthButton.checked){return;}
		
		const inputElem = document.getElementById(subtype) as HTMLInputElement;
		if(inputElem.value && inputElem.value != "")
		{
			permalink += "&" + subtype + "=" + inputElem.value;
			rprunLink += " " + subtype + "-" + inputElem.value;
		}
	});

	if(hideOptionsButton.checked)
	{
		permalink += "&hideOptions";
		rprunLink += " hideOptions";
	}

	permalinkInput.value = permalink;
	rprunInput.value = rprunLink;
	return;
}