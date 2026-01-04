import { fullMonthNames, materialCategories, materialCategoryColors } from "./staticData/constants";

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
	labelElem.id = id + '-label'
	
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
		case "parentCorps":
			if(!loadedData['parent-corps']) 
			{ 
				loadedData['parent-corps'] = await fetch('data/parentCorps.json?cb=' + Date.now()).then(response => response.json());
			}
			return loadedData['parent-corps']
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
	// @ts-ignore
	var companyID = Object.entries(knownCompanies).find(([, v]) => v?.Username?.toLowerCase() === companyName.toLowerCase())?.[0] as any;
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

// Update the username label (companyName-label ID) to say "Corp Code" or "Username" depending on group selection
export function updateUsernameLabel()
{
    const usernameLabel = document.getElementById('companyName-label')
    const groupElem = document.getElementById('group') as HTMLInputElement
    

    if(usernameLabel && usernameLabel.firstChild)
    {
        if(groupElem && groupElem.value && groupElem.value != 'company')
        {
            usernameLabel.firstChild.nodeValue = 'Corp Code: ';
        }
        else
        {
            usernameLabel.firstChild.nodeValue = 'Username: ';
        }
    }
}