import { fullMonthNames, materialCategories, materialCategoryColors } from "./staticData/constants";
import { createDbWorker } from "sql.js-httpvfs";

// Get data from SQL database
var sqlWorker = undefined as any;
export async function query(sqlQuery: string)
{
	if(!sqlWorker)
	{
		const workerUrl = new URL(
			"sql.js-httpvfs/dist/sqlite.worker.js",
			import.meta.url
		);
		const wasmUrl = new URL("sql.js-httpvfs/dist/sql-wasm.wasm", import.meta.url);

		sqlWorker = await createDbWorker(
		[
		{
			from: "inline",
			config: {
			serverMode: "full",
			url: "./data/prun-data.db",
			requestChunkSize: 4096,
			},
		},
		],
		workerUrl.toString(),
		wasmUrl.toString()
		);
	}

    const result = await sqlWorker.db.query(sqlQuery);

    return result
}

// Sort an array by the key of each object month
const monthOrder = {
		jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
		jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
} as any;
export function monthSort(a: any, b: any)
{
	const ma = a.month.slice(0, 3);
	const mb = b.month.slice(0, 3);

	const ya = Number(a.month.slice(3));
	const yb = Number(b.month.slice(3));

	return (ya * 12 + monthOrder[ma]) - (yb * 12 + monthOrder[mb]);
}

// Add an option to a selector
export function addOption(selector: HTMLSelectElement, displayName: string, id: string)
{
    const optionElem = document.createElement("option");
    optionElem.textContent = displayName;
    optionElem.value = id ?? displayName;
    selector.appendChild(optionElem);
}

// Remove all the children of a given element
export function clearChildren(elem: HTMLElement)
{
	elem.textContent = "";
	while(elem.children[0])
	{
		elem.removeChild(elem.children[0]);
	}
	return;
}

// Add a config field
export function addConfigField(inputType: string, id: string, label: string, value: any, defaultValue: any, updateFunc: (() => void), marginShift?: string)
{
	const labelElem = document.createElement('label');
	labelElem.textContent = label;
	
	const inputElem = document.createElement(inputType);
	inputElem.id = id;
	inputElem.classList.add("plotSelector");
	if(inputType == 'select')
	{
		addOptions(inputElem as HTMLSelectElement, value.prettyValues, value.values);
	}
	
	if(defaultValue)
	{
		(inputElem as HTMLInputElement).value = defaultValue;
	}
	
	inputElem.addEventListener("change", updateFunc);
	
	labelElem.appendChild(inputElem);

	const output = wrapInDiv(labelElem);
	if(marginShift)
	{
		output.style.marginLeft = marginShift
	}
	
	return output;
}

// Wrap an element in an extra div
function wrapInDiv(elem: HTMLElement)	// Wrap selector element in a div to center it and give it margin
{
	const div = document.createElement('div');
	
	div.appendChild(elem);
	
	return div;
}

// Add options to a selector
function addOptions(selector: HTMLSelectElement, prettyValues: any[], values: any[])
{
	for(var i = 0; i < prettyValues.length; i++)
	{
		const optionElem = document.createElement("option");
		optionElem.textContent = prettyValues[i];
		optionElem.value = values ? values[i] : prettyValues[i];
		selector.appendChild(optionElem);
	}
}

// Merge a default object with one entered by the user.
export function deepMerge<T>(target: T, source: Partial<T>): T {
  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      // @ts-ignore
      target[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      // @ts-ignore
      target[key] = source[key];
    }
  }
  return target;
}

// Generate pretty month name from id format: mar25
export function prettyMonthName(monthStr: string)
{
	const monthAbv = monthStr.substring(0,3);
	const monthNum = monthStr.substring(3);
	
	return fullMonthNames[monthAbv] + " 30" + monthNum;
}

// Functions to deal with loading data
export async function getData(loadedData: any, dataType: string, month?: string)	// dataType is either: prod, company, base, universe, or knownCompanies
{
	switch(dataType)
	{
		case "prod":
		case "company":
		case "base":
			if(!loadedData[dataType + '-data-' + month])
			{
				loadedData[dataType + '-data-' + month] = await fetch('data/' + dataType + '-data-' + month + '.json?cb=' + Date.now()).then(response => response.json());
			}
			return loadedData[dataType + '-data-' + month];
		case "knownCompanies":
			if(!loadedData['known-companies']) 
			{ 
				loadedData['known-companies'] = await fetch('data/knownCompanies.json?cb=' + Date.now()).then(response => response.json());
			}
			return loadedData['known-companies']
		case "universe":
			if(!loadedData['universe-data']) 
			{ 
				loadedData['universe-data'] = await fetch('data/universe-data.json?cb=' + Date.now()).then(response => response.json());
			}
			return loadedData['universe-data']
	}
}

export function getMatCategory(ticker: string): string | undefined {
  return Object.entries(materialCategories).find(
    ([_, tickers]) => tickers.includes(ticker)
  )?.[0];
}

export function getMatColor(ticker: string): string {
	return materialCategoryColors[getMatCategory(ticker) ?? ""] ?? "#000000";
}

export async function getCompanyId(companyName: string, loadedData: any) {
	const knownCompanies = await getData(loadedData, "knownCompanies") as any;

	// Pull from known companies
	var companyID = Object.keys(knownCompanies).find(id => (knownCompanies[id] ?? "").toLowerCase() == companyName.toLowerCase()) as string;
	if(companyID) { return companyID; }

	// Resort to FIO
	console.log("Unknown username, querying FIO.");
	const fioResult = await fetch('https://rest.fnar.net/user/' + companyName).then(response => response.json()).catch(error => {alert('Bad Response: Check Username'); console.error(error)});
	companyID = fioResult?.CompanyId;
	companyName = fioResult?.UserName;

	// Temporarily add to the list of known companies preventing multiple FIO queries
	knownCompanies[companyID] = companyName;

	return companyID as string | undefined;
}