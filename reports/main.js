const loadedData = {};	// Data loaded from files
const monthsPretty = ["March 2025", "April 2025", "May 2025", "June 2025", "July 2025"];
const months = ["mar25", "apr25", "may25", "jun25", "jul25"];
const currentMonth = "jul25";
	
window.onload = function() {
	const graphTypeSelector = document.getElementById("graphType");
	const selectorSubtypes = document.getElementById("selectorSubtypes");
	
	graphTypeSelector.addEventListener("change", function() {
		updateSelectors(graphTypeSelector, selectorSubtypes);
		switchPlot();
	});
	
	updateSelectors(graphTypeSelector, selectorSubtypes, (new URLSearchParams(window.location.search)).has('type'));
	switchPlot();
	
	// Permalink stuff
	const permalinkContainer = document.getElementById("permalinkContainer");
	const permalinkButton = document.getElementById("permalinkButton");
	const permalinkCopyButton = document.getElementById("permalinkCopyButton");
	const rprunCopyButton = document.getElementById("permalinkCopyButton-rprun");
	const permalinkOptionsButton = document.getElementById("hideOptions");
	const permalinkLatestMonth = document.getElementById("latestMonth");
	
	permalinkButton.addEventListener("click", function(e) {
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

	document.addEventListener("click", function(e) {
		if(!permalinkContainer.contains(e.target) && !permalinkButton.contains(e.target))
		{
			permalinkContainer.style.display = "none";
		}
	});

	permalinkCopyButton.addEventListener("click", function() {
		const permalinkElem = document.getElementById("permalink");
		if(permalinkElem.value && permalinkElem.value != "")
		{
			navigator.clipboard.writeText(permalinkElem.value);
		}
	});
	
	rprunCopyButton.addEventListener("click", function() {
		const permalinkElem = document.getElementById("permalink-rprun");
		if(permalinkElem.value && permalinkElem.value != "")
		{
			navigator.clipboard.writeText(permalinkElem.value);
		}
	});

	permalinkOptionsButton.addEventListener("change", function() {
		updatePermalink(graphTypeSelector);
	});
	permalinkLatestMonth.addEventListener("change", function() {
		updatePermalink(graphTypeSelector);
	});
};

// Update selectors based on graph type
function updateSelectors(graphTypeSelector, selectorSubtypes, useURLParams)
{
	clearChildren(selectorSubtypes);
	
	const urlParams = new URLSearchParams(window.location.search);
	
	if(urlParams.has('hideOptions'))
	{
		const graphTypeContainer = document.getElementById('graphTypeContainer');
		const topTabs = document.getElementById('topTabContainer');
		topTabContainer.style.display = 'none';
		graphTypeContainer.style.display = 'none';
		selectorSubtypes.style.display = 'none';
	}
	
	if(useURLParams)
	{
		graphTypeSelector.value = urlParams.get('type');
	}
	
	if(graphTypeSelector.value == "topProduction")
	{
		selectorSubtypes.appendChild(addInput('select', 'metric', 'Metric: ', [['Volume', 'Profit', 'Deficit'], ['volume', 'profit', 'deficit']], useURLParams && urlParams.get('metric')));
		
		selectorSubtypes.appendChild(addInput('select', 'month', 'Month: ', [monthsPretty, months], useURLParams && urlParams.has('month') ? urlParams.get('month') : currentMonth));
	}
	else if(graphTypeSelector.value == "topCompanies")
	{
		selectorSubtypes.appendChild(addInput('select', 'metric', 'Metric: ', [['Volume', 'Profit'], ['volume', 'profit']], useURLParams && urlParams.get('metric')));
		
		selectorSubtypes.appendChild(addInput('select', 'month', 'Month: ', [monthsPretty, months], useURLParams && urlParams.has('month') ? urlParams.get('month') : currentMonth));
	}
	else if(graphTypeSelector.value == "matHistory")
	{
		selectorSubtypes.appendChild(addInput('select', 'metric', 'Metric: ', [['Volume', 'Profit', 'Price', 'Produced', 'Consumption', 'Surplus'], ['volume', 'profit', 'price', 'amount', 'consumed', 'surplus']], useURLParams && urlParams.get('metric')));
		
		selectorSubtypes.appendChild(addInput('input', 'ticker', 'Ticker: ', undefined, useURLParams && urlParams.get('ticker')));
	}
	else if(graphTypeSelector.value == "compTotals")
	{
		const chartTypeElem = addInput('select', 'chartType', 'Chart Type: ', [['Bar', 'Pie', 'Treemap (Mat)', 'Treemap (Cat)'], ['bar', 'pie', 'treemap', 'treemap-categories']], useURLParams && urlParams.get('chartType'));
		chartTypeElem.style.marginLeft = "-30px";
		selectorSubtypes.appendChild(chartTypeElem);
		
		selectorSubtypes.appendChild(addInput('select', 'metric', 'Metric: ', [['Volume', 'Profit'], ['volume', 'profit']], useURLParams && urlParams.get('metric')));
		
		selectorSubtypes.appendChild(addInput('select', 'month', 'Month: ', [monthsPretty, months], useURLParams && urlParams.has('month') ? urlParams.get('month') : currentMonth));
		
		// Username input and query button
		const usernameInput = addInput('input', 'username', 'Username: ', undefined, useURLParams && urlParams.get('companyName'));
		
		const submitButton = document.createElement("button");
		submitButton.textContent = "Query";
		submitButton.classList.add("queryButton");
		usernameInput.appendChild(submitButton);
		
		submitButton.addEventListener('click', getCompanyInfo);
		usernameInput.addEventListener('keypress', function(e) {if(e.key === 'Enter'){getCompanyInfo();}})
		
		usernameInput.style.marginLeft = "33px";
		
		selectorSubtypes.appendChild(usernameInput);
		
		// Hidden company ID input, autofilled by query
		const companyIDInput = addInput('input', 'companyID', 'Company ID: ', undefined, useURLParams && urlParams.get('companyID'));
		companyIDInput.style.visibility = 'hidden';
		
		selectorSubtypes.appendChild(companyIDInput);
		
		const companyNameInput = addInput('input', 'companyName', 'Company Name: ', undefined, useURLParams && urlParams.get('companyName'));
		companyNameInput.style.visibility = 'hidden';
		
		selectorSubtypes.appendChild(companyNameInput);
		
	}
	else if(graphTypeSelector.value == "compHistory")
	{
		selectorSubtypes.appendChild(addInput('select', 'metric', 'Metric: ', [['Volume', 'Profit'], ['volume', 'profit']], useURLParams && urlParams.get('metric')));
		
		// Username input and query button
		const usernameInput = addInput('input', 'username', 'Username: ', undefined, useURLParams && urlParams.get('companyName'));
		
		const submitButton = document.createElement("button");
		submitButton.textContent = "Query";
		submitButton.classList.add("queryButton");
		usernameInput.appendChild(submitButton);
		
		submitButton.addEventListener('click', getCompanyInfo);
		usernameInput.addEventListener('keypress', function(e) {if(e.key === 'Enter'){getCompanyInfo();}})
		
		usernameInput.style.marginLeft = "33px";
		
		selectorSubtypes.appendChild(usernameInput);
		
		// Hidden company ID input, autofilled by query
		const companyIDInput = addInput('input', 'companyID', 'Company ID: ', undefined, useURLParams && urlParams.get('companyID'));
		companyIDInput.style.visibility = 'hidden';
		
		selectorSubtypes.appendChild(companyIDInput);
		
		const companyNameInput = addInput('input', 'companyName', 'Company Name: ', undefined, useURLParams && urlParams.get('companyName'));
		companyNameInput.style.visibility = 'hidden';
		
		selectorSubtypes.appendChild(companyNameInput);
	}
	else if(graphTypeSelector.value == "compRank")
	{
		selectorSubtypes.appendChild(addInput('select', 'month', 'Month: ', [monthsPretty, months], useURLParams && urlParams.has('month') ? urlParams.get('month') : currentMonth));
		
		// Username input and query button
		const usernameInput = addInput('input', 'username', 'Username: ', undefined, useURLParams && urlParams.get('companyName'));
		
		const submitButton = document.createElement("button");
		submitButton.textContent = "Query";
		submitButton.classList.add("queryButton");
		usernameInput.appendChild(submitButton);
		
		submitButton.addEventListener('click', getCompanyInfo);
		usernameInput.addEventListener('keypress', function(e) {if(e.key === 'Enter'){getCompanyInfo();}})
		
		usernameInput.style.marginLeft = "33px";
		
		selectorSubtypes.appendChild(usernameInput);
		
		// Hidden company ID input, autofilled by query
		const companyIDInput = addInput('input', 'companyID', 'Company ID: ', undefined, useURLParams && urlParams.get('companyID'));
		companyIDInput.style.visibility = 'hidden';
		
		selectorSubtypes.appendChild(companyIDInput);
		
		const companyNameInput = addInput('input', 'companyName', 'Company Name: ', undefined, useURLParams && urlParams.get('companyName'));
		companyNameInput.style.visibility = 'hidden';
		
		selectorSubtypes.appendChild(companyNameInput);
		
	}
}

function switchPlot()
{
	const urlParams = new URLSearchParams(window.location.search);
	const fullScreen = urlParams.has("hideOptions");
	
	const typeElem = document.getElementById("graphType");
	
	var subtypeElem;
	var monthElem;
	var metricElem;
	var matElem;
	var nameElem;
	var idElem;
	
	const oldGraph = document.getElementById("mainPlot");
	oldGraph.remove();
	const newGraph = document.createElement("div");
	newGraph.id = "mainPlot";
	const graphContainer = document.getElementById("mainPlotContainer");
	graphContainer.appendChild(newGraph);
	switch(typeElem.value)
	{
		case "topProduction":
			metricElem = document.getElementById("metric");
			monthElem = document.getElementById("month");
			promiseGenerateTopProdGraph("mainPlot", monthElem.value, metricElem.value, fullScreen);
			break;
		case "topCompanies":
			metricElem = document.getElementById("metric");
			monthElem = document.getElementById("month");
			promiseGenerateTopCompanyGraph("mainPlot", monthElem.value, metricElem.value, fullScreen);
			break;
		case "matHistory":
			metricElem = document.getElementById("metric");
			matElem = document.getElementById("ticker");
			promiseGenerateMatGraph("mainPlot", matElem.value, metricElem.value, months, fullScreen);
			break;
		case "compTotals":
			subtypeElem = document.getElementById("chartType");
			metricElem = document.getElementById("metric");
			monthElem = document.getElementById("month");
			nameElem = document.getElementById("companyName");
			idElem = document.getElementById("companyID");
			promiseGenerateCompanyGraph("mainPlot", subtypeElem.value, nameElem.value, idElem.value, monthElem.value, metricElem.value, fullScreen);
			break;
		case "compHistory":
			metricElem = document.getElementById("metric");
			nameElem = document.getElementById("companyName");
			idElem = document.getElementById("companyID");
			promiseGenerateCompanyHistoryGraph("mainPlot", nameElem.value, idElem.value, metricElem.value, months, fullScreen);
			break;
		case "compRank":
			monthElem = document.getElementById("month");
			nameElem = document.getElementById("companyName");
			idElem = document.getElementById("companyID");
			promiseGenerateRankChart("mainPlot", nameElem.value, idElem.value, monthElem.value, months, fullScreen);
	}

	updatePermalink(typeElem);
}

function updatePermalink(typeElem)
{
	const permalinkInput = document.getElementById("permalink");
	const rprunInput = document.getElementById("permalink-rprun");
	const hideOptionsButton = document.getElementById("hideOptions");
	const latestMonthButton = document.getElementById("latestMonth");
	
	var permalink = "https://pmmg-products.github.io/reports/?type=" + typeElem.value;
	var rprunLink = "XIT PRUNSTATS type-" + typeElem.value;
	
	const relevantSubtypes = {
		"topProduction": ["metric", "month"],
		"topCompanies": ["metric", "month"],
		"matHistory": ["metric", "ticker"],
		"compTotals": ["chartType", "metric", "month", "companyName", "companyID"],
		"compHistory": ["metric", "companyName", "companyID"],
		"compRank": ["month", "companyName", "companyID"]
	}
	
	relevantSubtypes[typeElem.value].forEach(subtype => {
		if(subtype == "month" && latestMonthButton.checked){return;}
		
		const inputElem = document.getElementById(subtype);
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

function promiseGenerateRankChart(container, companyName, companyID, currentMonth, months, fullScreen)
{
	const monthIndex = months.indexOf(currentMonth);
	const prevMonth = months[monthIndex == 0 ? 0 : monthIndex - 1];	// Get previous month to determine change
	
	(async () => {
		if(!loadedData['company-data-' + currentMonth])
		{
			loadedData['company-data-' + currentMonth] = await fetch('data/company-data-' + currentMonth + '.json?cb=' + Date.now()).then(response => response.json())
		}
		
		if(!loadedData['company-data-' + prevMonth])
		{
			loadedData['company-data-' + prevMonth] = await fetch('data/company-data-' + prevMonth + '.json?cb=' + Date.now()).then(response => response.json())
		}
		
		generateRankChart(container, loadedData['company-data-' + currentMonth].individual[companyID], (monthIndex == 0 ? undefined : loadedData['company-data-' + prevMonth].individual[companyID]), companyName, currentMonth, fullScreen);  // Use the JSON data
	})();
}

function promiseGenerateCompanyHistoryGraph(container, companyName, companyID, metric, months, fullScreen)	// Metric is either 'profit' or 'volume'
{
	if(!companyID){return;}
	const validMonths = [];
	const data = []
	var hasData = false;
	
	(async () => {
		for(const month of months) {
			if(!loadedData['company-data-' + month])
			{
				loadedData['company-data-' + month] = await fetch('data/company-data-' + month + '.json?cb=' + Date.now()).then(response => response.json())
			}
			
			const dataPoint = loadedData['company-data-' + month].totals[companyID]
			if(dataPoint)
			{
				data.push(dataPoint[metric])
				validMonths.push(month);
				hasData = true;
			}
		};
		
		if(hasData)
		{
			generateCompanyHistoryGraph(container, months.map(month => prettyMonthName(month)), data, companyName, metric, fullScreen)
		}
	})();
}

function promiseGenerateCompanyGraph(container, chartType, companyName, companyID, month, metric, fullScreen)	// Metric is either 'profit' or 'volume'. chartType is either 'bar' or 'pie'
{
	(async () => {
		if(!loadedData['company-data-' + month])
		{
			loadedData['company-data-' + month] = await fetch('data/company-data-' + month + '.json?cb=' + Date.now()).then(response => response.json())
		}
		
		generateCompanyGraph(container, chartType, loadedData['company-data-' + month].individual[companyID], companyName, month, metric, fullScreen);  // Use the JSON data
	})();
}

function promiseGenerateTopCompanyGraph(container, month, metric, fullScreen)	// Metric is either 'profit' or 'volume'
{
	(async () => {
		if(!loadedData['company-data-' + month])
		{
			loadedData['company-data-' + month] = await fetch('data/company-data-' + month + '.json?cb=' + Date.now()).then(response => response.json())
		}
		
		if(!loadedData['known-companies'])
		{
			loadedData['known-companies'] = await fetch('data/knownCompanies2.json?cb=' + Date.now()).then(response => response.json())
		}
		
		generateTopCompanyGraph(container, loadedData['company-data-' + month], loadedData['known-companies'], month, metric, fullScreen);  // Use the JSON data
	})();
}

function promiseGenerateTopProdGraph(container, month, metric, fullScreen)	// Metric is either 'profit' or 'volume'
{
	(async () => {
		if(!loadedData['prod-data-' + month])
		{
			loadedData['prod-data-' + month] = await fetch('data/prod-data-' + month + '.json?cb=' + Date.now()).then(response => response.json())
		}
		
		const data = loadedData['prod-data-' + month];
		if(metric == 'deficit')	// Populate deficit into data
		{
			Object.keys(data).forEach(ticker => {
				if(!data[ticker]['amount'] || data[ticker]['amount'] == 0){data[ticker]['deficit'] = 0; return;}
				data[ticker]['deficit'] = (data[ticker]['amount'] - (data[ticker]['consumed'] || 0)) * data[ticker]['volume'] / data[ticker]['amount'];
			});
		}
		generateTopProdGraph(container, data, month, metric, fullScreen);  // Use the JSON data
	})();
}

function promiseGenerateMatGraph(container, ticker, metric, months, fullScreen)	// Metric is either 'profit', 'volume', or 'amount'
{
	// Validation/sanitizing
	if(!ticker){return;}
	ticker = ticker.toUpperCase();
	
	const validMonths = [];
	const data = [];
	
	(async () => {
		for(const month of months) {
			if(!loadedData['prod-data-' + month])
			{
				loadedData['prod-data-' + month] = await fetch('data/prod-data-' + month + '.json?cb=' + Date.now()).then(response => response.json())
			}
			
			const dataPoint = loadedData['prod-data-' + month][ticker]
			if(dataPoint)
			{
				if(metric == 'price')
				{
					data.push(dataPoint['amount'] == 0 ? 0 : dataPoint['volume'] / dataPoint['amount']);
				}
				else if(metric == 'surplus')
				{
					data.push(dataPoint['amount'] - dataPoint['consumed'])
				}
				else
				{
					data.push(dataPoint[metric])
				}
				validMonths.push(month)
				hasData = true;
			}
		};
		
		if(hasData)
		{
			generateMatGraph(container, validMonths.map(month => prettyMonthName(month)), data, ticker, metric, fullScreen)
		}
	})();
}

function generateTopProdGraph(container, prodData, month, metric, fullScreen)
{
	if(fullScreen){setFullscreen(container);}
	const titles = {
		'profit': 'Profit Materials',
		'volume': 'Production Volumes',
		'deficit': 'Deficits'
	}
	// Convert the data object into an array of [ticker, volume] pairs
	const volumeArray = Object.entries(prodData).map(([ticker, info]) => ({
		ticker,
		volume: info[metric]
	}));

	// Sort the array by volume in descending order
	if(metric == 'deficit')
	{
		volumeArray.sort((a, b) => a.volume - b.volume);
	}
	else
	{
		volumeArray.sort((a, b) => b.volume - a.volume);
	}
	
	
	// Extract tickers and volumes into separate arrays
	const tickers = volumeArray.map(item => item.ticker);
	const volumes = volumeArray.map(item => item.volume);
	Plotly.newPlot(container, {
        data: [{ x: tickers, y: volumes, type: 'bar' , marker: {color: 'rgb(247, 166, 0)'}, hovertemplate: '%{x}: %{y:,.3~s}<extra></extra>'}],
        layout: {width: fullScreen ? undefined : 800, height: fullScreen ? undefined : 400, autosize: fullScreen, ...(fullScreen ? {margin: {
					l: 60,  // left
					r: 10,  // right
					t: 40,  // top
					b: 60   // bottom
				}} : {}),
			title: {text: 'Top ' + titles[metric] + ' - ' + prettyMonthName(month),
					font: {color: '#eee', family: '"Droid Sans", sans-serif'},
			},
			xaxis: {
				title: {
					text: 'Ticker',
					font: {color: '#bbb', family: '"Droid Sans", sans-serif'}
				},
				tickfont: {color: '#666', family: '"Droid Sans", sans-serif'},
				range: [-0.5, 29.5],
				tickangle: -45
			},
			yaxis: {
				title: {
					text: prettyModeNames[metric] + ' [$/day]',
					font: {color: '#bbb', family: '"Droid Sans", sans-serif'}
				},
				tickfont: {color: '#666', family: '"Droid Sans", sans-serif'},
				range: [(metric == 'deficit' ? null : 0), (metric == 'deficit' ? 0 : null)],
				gridcolor: '#323232'
			},
			plot_bgcolor: '#252525',
			paper_bgcolor: '#252525',
			dragmode: 'pan'
		},
		config: {
			displayModeBar: true,
			modeBarButtonsToRemove: ['lasso2d'],  // Remove unwanted buttons
			displaylogo: false,
			scrollZoom: true,
			responsive: true
		}
    });
}

function generateTopCompanyGraph(container, companyData, knownCompanies, month, metric, fullScreen)
{
	if(fullScreen){setFullscreen(container);}
	
	// Convert the data object into an array of [companyID, volume] pairs
	const volumeArray = Object.entries(companyData.totals).map(([companyID, info]) => ({
		companyID,
		volume: info[metric]
	}));

	// Sort the array by volume in descending order
	volumeArray.sort((a, b) => b.volume - a.volume);

	// Extract tickers and volumes into separate arrays
	const companyIDs = volumeArray.map(item => item.companyID);
	const volumes = volumeArray.map(item => item.volume);
	
	const companyNames = [];
	
	// Print unknown top 40 companies
	companyIDs.slice(0,40).forEach(id => {
		if(!knownCompanies[id])
		{
			console.log(id)
		}
	});
	
	companyIDs.forEach(id => {
		companyNames.push(knownCompanies[id] || (id.slice(0, 5) + "..."));
	});
	Plotly.newPlot(container, {
        data: [{ x: companyNames, y: volumes, type: 'bar' , marker: {color: 'rgb(247, 166, 0)'}, hovertemplate: '%{x}: %{y:,.3~s}<extra></extra>'}],
        layout: { width: fullScreen ? undefined : 800, height: fullScreen ? undefined : 400, autosize: fullScreen, ...(fullScreen ? {margin: {
					l: 60,  // left
					r: 10,  // right
					t: 40,  // top
					b: 100   // bottom
				}} : {}),
			title: {text: 'Top Companies (' + prettyModeNames[metric] + ') - ' + prettyMonthName(month),
					font: {color: '#eee', family: '"Droid Sans", sans-serif'},
			},
			xaxis: {
				title: {
					text: 'Player',
					font: {color: '#bbb', family: '"Droid Sans", sans-serif'}
				},
				tickfont: {color: '#666', family: '"Droid Sans", sans-serif'},
				range: [-0.5, 29.5],
				tickangle: -45
			},
			yaxis: {
				title: {
					text: prettyModeNames[metric] + ' [$/day]',
					font: {color: '#bbb', family: '"Droid Sans", sans-serif'}
				},
				tickfont: {color: '#666', family: '"Droid Sans", sans-serif'},
				range: [0, null],
				gridcolor: '#323232'
			},
			plot_bgcolor: '#252525',
			paper_bgcolor: '#252525',
			dragmode: 'pan'
		},
		config: {
			displayModeBar: true,
			modeBarButtonsToRemove: ['lasso2d'],  // Remove unwanted buttons
			displaylogo: false,
			scrollZoom: true,
			responsive: true
		}
    });
}

function generateMatGraph(container, months, data, ticker, metric, fullScreen)
{
	console.log(fullScreen);
	if(fullScreen){setFullscreen(container);}
	
	const titles = {
		'profit': 'Production Profit History of ',
		'volume': 'Production Volume History of ',
		'amount': 'Production Amount History of ',
		'price': 'Price History of ',
		'consumed': 'Consumption History of ',
		'surplus': 'Surplus Production History of '
	}
	const yAxis = {
		'profit': 'Daily Profit [$/day]',
		'volume': 'Daily Volume [$/day]',
		'amount': 'Daily Production [per day]',
		'price': 'Price [$]',
		'consumed': 'Daily Consumption [per day]',
		'surplus': 'Daily Surplus [per day]'
	}
	
	Plotly.newPlot(container, {
        data: [{ x: months, y: data, type: 'bar' , marker: {color: 'rgb(247, 166, 0)'}, hovertemplate: '%{x}: %{y:,.3~s}<extra></extra>'}],
        layout: { width: fullScreen ? undefined : 800, height: fullScreen ? undefined : 400, autosize: fullScreen, ...(fullScreen ? {margin: {
					l: 60,  // left
					r: 10,  // right
					t: 40,  // top
					b: 60   // bottom
				}} : {}),
			title: {text: titles[metric] + ticker,
					font: {color: '#eee', family: '"Droid Sans", sans-serif'},
			},
			xaxis: {
				title: {
					text: 'Month',
					font: {color: '#bbb', family: '"Droid Sans", sans-serif'}
				},
				tickfont: {color: '#666', family: '"Droid Sans", sans-serif'},
				tickangle: -45
			},
			yaxis: {
				title: {
					text: yAxis[metric],
					font: {color: '#bbb', family: '"Droid Sans", sans-serif'}
				},
				tickfont: {color: '#666', family: '"Droid Sans", sans-serif'},
				gridcolor: '#323232'
			},
			plot_bgcolor: '#252525',
			paper_bgcolor: '#252525',
			dragmode: 'pan'
		},
		config: {
			displayModeBar: true,
			modeBarButtonsToRemove: ['lasso2d'],  // Remove unwanted buttons
			displaylogo: false,
			scrollZoom: true,
			responsive: true
		}
    });
}

function generateCompanyGraph(container, chartType, data, companyName, month, metric, fullScreen)
{
	if(fullScreen){setFullscreen(container);}
	
	if(!data){return;}
	
	const titles = {
		'profit': 'Production Profit Breakdown of ',
		'volume': 'Production Volume Breakdown of ',
	}
	
	var mats = Object.keys(data);
	var values = mats.map(ticker => data[ticker][metric]);
	
	var indices = values.map((_, i) => i).sort((a, b) => values[b] - values[a]);
	mats = indices.map(i => mats[i]);
	values = indices.map(i => values[i]);
	
	if(chartType == 'treemap' || chartType == 'treemap-categories')
	{
		// Filter out negative values
		indices = values
			.map((v, i) => i)
			.filter(i => values[i] >= 0);
		mats = indices.map(i => mats[i]);
		values = indices.map(i => values[i]);

		var colors = mats.map(m => materialsToColors[m] || '#000000');
		var parents = chartType == 'treemap-categories'
			? mats.map(m => materialsToCategories[m] || 'Other')
			: mats.map(m => 'Total');

		var totalValue = 0;
		var categoryValues = {};
		for (const i of indices) {
			totalValue += values[i];
			const category = parents[i];
			categoryValues[category] = (categoryValues[category] || 0) + values[i];
		}

		if (chartType == 'treemap-categories') {
			for (const category in categoryValues) {
				mats.push(category);
				values.push(categoryValues[category]);
				colors.push(materialCategoryColors[category] || '#000000');
				parents.push('Total');
			}
		}

		values.push(totalValue);
		mats.push('Total');
		parents.push('');
		colors.push('#252525');

		Plotly.newPlot(container, {
			data: [
				{
					type: 'treemap',
					labels: mats,
					parents: parents,
					values: values,
					maxdepth: 2,
					branchvalues: 'total',
					marker: {
						colors: colors,
					},
					tiling: {
						pad: 0,
					},
					textposition: 'middle center',
					hovertemplate: '%{label}<br>$%{value:,.3~s}/day<br>%{percentEntry:.2%}<extra></extra>'
				}
			],
			layout: { width: fullScreen ? undefined : 800, height: fullScreen ? undefined : 400, autosize: fullScreen, ...(fullScreen ? {margin: {
					l: 10,  // left
					r: 10,  // right
					t: 40,  // top
					b: 10   // bottom
				}} : {}),
				title: {text: titles[metric] + companyName + ' - ' + prettyMonthName(month),
					font: {color: '#eee', family: '"Droid Sans", sans-serif'},
				},
				plot_bgcolor: '#252525',
				paper_bgcolor: '#252525',
			},
			config: {
				displaylogo: false,
				responsive: true
			}
		});
	}
	else if(chartType == 'pie')
	{
		// Filter out negative values
		indices = values
			.map((v, i) => i)
			.filter(i => values[i] >= 0);
		mats = indices.map(i => mats[i]);
		values = indices.map(i => values[i]);
		
		Plotly.newPlot(container, {
			data: [{ labels: mats, values: values, type: 'pie', textinfo: 'label',textposition: 'inside', insidetextorientation: 'none', automargin: false, hovertemplate: '%{label}<br>$%{value:,.3~s}/day<br>%{percent}<extra></extra>'}],
			layout: { width: fullScreen ? undefined : 800, height: fullScreen ? undefined : 400, autosize: fullScreen, ...(fullScreen ? {margin: {
					l: 10,  // left
					r: 10,  // right
					t: 40,  // top
					b: 10   // bottom
				}} : {}),
				title: {text: titles[metric] + companyName + ' - ' + prettyMonthName(month),
						font: {color: '#eee', family: '"Droid Sans", sans-serif'},
				},
				plot_bgcolor: '#252525',
				paper_bgcolor: '#252525',
			},
			config: {
				displayModeBar: true,
				modeBarButtonsToRemove: ['lasso2d'],  // Remove unwanted buttons
				displaylogo: false,
				scrollZoom: true,
				responsive: true
			}
		});
	}
	else
	{
		Plotly.newPlot(container, {
			data: [{ x: mats, y: values, type: 'bar' , marker: {color: 'rgb(247, 166, 0)'}, hovertemplate: '%{x}: %{y:,.3~s}<extra></extra>'}],
			layout: { width: fullScreen ? undefined : 800, height: fullScreen ? undefined : 400, autosize: fullScreen, ...(fullScreen ? {margin: {
					l: 60,  // left
					r: 10,  // right
					t: 40,  // top
					b: 60   // bottom
				}} : {}),
				title: {text: titles[metric] + companyName + ' - ' + prettyMonthName(month),
						font: {color: '#eee', family: '"Droid Sans", sans-serif'},
				},
				xaxis: {
					title: {
						text: 'Ticker',
						font: {color: '#bbb', family: '"Droid Sans", sans-serif'}
					},
					tickfont: {color: '#666', family: '"Droid Sans", sans-serif'},
					range: [-0.5, Math.min(mats.length, 30) - 0.5],
					tickangle: -45
				},
				yaxis: {
					title: {
						text: prettyModeNames[metric] + ' [$/day]',
						font: {color: '#bbb', family: '"Droid Sans", sans-serif'}
					},
					tickfont: {color: '#666', family: '"Droid Sans", sans-serif'},
					range: [0, null],
					gridcolor: '#323232'
				},
				plot_bgcolor: '#252525',
				paper_bgcolor: '#252525',
				dragmode: 'pan'
			},
			config: {
				displayModeBar: true,
				modeBarButtonsToRemove: ['lasso2d'],  // Remove unwanted buttons
				displaylogo: false,
				scrollZoom: true,
				responsive: true
			}
		});
	}
}

function generateCompanyHistoryGraph(container, months, data, companyName, metric, fullScreen)
{
	if(fullScreen){setFullscreen(container);}
	
	const titles = {
		'profit': 'Production Profit History of ',
		'volume': 'Production Volume History of ',
	}
	const yAxis = {
		'profit': 'Daily Profit [$/day]',
		'volume': 'Daily Volume [$/day]'
	}
	Plotly.newPlot(container, {
        data: [{ x: months, y: data, type: 'bar' , marker: {color: 'rgb(247, 166, 0)'}, hovertemplate: '%{x}: %{y:,.3~s}<extra></extra>'}],
        layout: { width: fullScreen ? undefined : 800, height: fullScreen ? undefined : 400, autosize: fullScreen, ...(fullScreen ? {margin: {
					l: 60,  // left
					r: 10,  // right
					t: 40,  // top
					b: 60   // bottom
				}} : {}),
			title: {text: titles[metric] + companyName,
					font: {color: '#eee', family: '"Droid Sans", sans-serif'},
			},
			xaxis: {
				title: {
					text: 'Month',
					font: {color: '#bbb', family: '"Droid Sans", sans-serif'}
				},
				tickfont: {color: '#666', family: '"Droid Sans", sans-serif'},
				tickangle: -45
			},
			yaxis: {
				title: {
					text: yAxis[metric],
					font: {color: '#bbb', family: '"Droid Sans", sans-serif'}
				},
				tickfont: {color: '#666', family: '"Droid Sans", sans-serif'},
				gridcolor: '#323232'
			},
			plot_bgcolor: '#252525',
			paper_bgcolor: '#252525',
			dragmode: 'pan'
		},
		config: {
			displayModeBar: true,
			modeBarButtonsToRemove: ['lasso2d'],  // Remove unwanted buttons
			displaylogo: false,
			scrollZoom: true,
			responsive: true
		}
    });
}

function generateRankChart(containerID, currentData, prevData, companyName, currentMonth, fullScreen)
{
	if(fullScreen){setFullscreen(containerID);}
	
	if(!currentData){return;}
		
	const container = document.getElementById(containerID);
	
	const tickers = Object.keys(currentData);
	const currentRanks = tickers.map(ticker => ({'ticker': ticker, 'currentRank': currentData[ticker].rank, 'data': currentData[ticker]}));
	
	currentRanks.forEach(mat => {
		if(prevData && prevData[mat.ticker])
		{
			mat.prevRank = prevData[mat.ticker].rank;
		}
	});
	
	currentRanks.sort((x, y) => x.currentRank - y.currentRank);
	
	// Create title
	const title = document.createElement("div");
	title.textContent = "Production Ranking of " + companyName + " - " + prettyMonthName(currentMonth);
	title.classList.add("title");
	container.appendChild(title);
	
	// Start creating table
	const table = document.createElement("table");
	container.appendChild(table);
	
	// Table header
	const header = document.createElement("thead");
	table.appendChild(header);
	const headRow = document.createElement("tr");
	header.appendChild(headRow);
	
	const headers = ["Rank", "Ticker", "Amount [/day]", "Volume [$/day]", "Profit [$/day]"]
	headers.forEach(label => {
		const headerColumn = document.createElement("th");
		headerColumn.textContent = label;
		headRow.appendChild(headerColumn);
	});
	
	const body = document.createElement("tbody");
	table.appendChild(body);
	
	currentRanks.forEach(mat =>
	{
		const row = document.createElement("tr");
		body.appendChild(row);
		
		const rankColumn = document.createElement("td");
		const rankWrapper = document.createElement("div");
		rankWrapper.style.display = "flex";
		rankColumn.appendChild(rankWrapper);
		
		if(prevData)
		{
			const rankSymbol = document.createElement("div");
			rankSymbol.style.width = "14px";
			rankSymbol.style.minWidth = "14px";
			rankSymbol.style.marginRight = "2px";
			if(mat.prevRank && mat.prevRank != mat.currentRank)
			{
				const increasing = mat.prevRank && mat.prevRank < mat.currentRank;
				rankSymbol.textContent = increasing ? "▼" : "▲";
				rankSymbol.style.color = increasing ? "#d9534f" : "#5cb85c";
			}
			rankWrapper.appendChild(rankSymbol);
		}
		
		const rankNum = document.createElement("div");
		rankNum.textContent = mat.currentRank;
		rankWrapper.appendChild(rankNum);
		
		row.appendChild(rankColumn);
		
		const tickerColumn = document.createElement("td")
		tickerColumn.textContent = mat.ticker;
		row.appendChild(tickerColumn);
		
		const amountColumn = document.createElement("td")
		amountColumn.textContent = mat.data.amount.toLocaleString(undefined, {maximumFractionDigits: 1});
		row.appendChild(amountColumn);
		
		const volumeColumn = document.createElement("td")
		volumeColumn.textContent = "$" + mat.data.volume.toLocaleString(undefined, {notation: 'compact', maxixmumSignificantDigits: 3});
		row.appendChild(volumeColumn);
		
		const profitColumn = document.createElement("td")
		profitColumn.textContent = "$" + mat.data.profit.toLocaleString(undefined, {notation: 'compact', maxixmumSignificantDigits: 3});
		row.appendChild(profitColumn);
	});
}

// Util functions
function prettyMonthName(monthStr)
{
	const monthAbv = monthStr.substring(0,3);
	const monthNum = monthStr.substring(3);
	
	return fullMonthNames[monthAbv] + " 30" + monthNum;
}

// Remove all the children of a given element
function clearChildren(elem)
{
	elem.textContent = "";
	while(elem.children[0])
	{
		elem.removeChild(elem.children[0]);
	}
	return;
}

// Add options to a selector
function addOptions(selector, options, values)
{
	for(var i = 0; i < options.length; i++)
	{
		const optionElem = document.createElement("option");
		optionElem.textContent = options[i];
		optionElem.value = values ? values[i] : options[i];
		selector.appendChild(optionElem);
	}
}

function wrapInDiv(elem)	// Wrap selector element in a div to center it and give it margin
{
	const div = document.createElement('div');
	
	div.appendChild(elem);
	
	return div;
}

function addInput(inputType, id, label, values, defaultValue)
{
	const labelElem = document.createElement('label');
	labelElem.textContent = label;
	
	const inputElem = document.createElement(inputType);
	inputElem.id = id;
	inputElem.classList.add("plotSelector");
	if(inputType == 'select')
	{
		addOptions(inputElem, values[0], values[1]);
	}
	
	if(defaultValue)
	{
		inputElem.value = defaultValue;
	}
	
	inputElem.addEventListener("change", function() {
		switchPlot();
	});
	
	labelElem.appendChild(inputElem);
	
	return wrapInDiv(labelElem);
}

async function getCompanyInfo()
{
	const usernameInput = document.getElementById('username');
	var companyID;
	var companyName;
	
	if(!usernameInput.value){return;}
	
	(async () => {
		if(!loadedData['known-companies'])
		{
			loadedData['known-companies'] = await fetch('data/knownCompanies2.json?cb=' + Date.now()).then(response => response.json())
		}
		
		const match = Object.entries(loadedData['known-companies']).find(([id, username]) => username && (username.toLowerCase() === usernameInput.value.toLowerCase()));
		
		if(match)
		{
			[companyID, companyName] = match;
		}
		else
		{
			const fioResult = fetch('https://rest.fnar.net/user/' + usernameInput.value).then(response => response.json()).catch(error => {alert('Bad Response: Check Username'); console.error(error)});
			companyID = fioResult.CompanyId;
			companyName = fioResult.UserName;
		}
		
		if(!companyID || !companyName){return;}
		
		const companyIDInput = document.getElementById('companyID');
		companyIDInput.value = companyID;
		
		const companyNameInput = document.getElementById('companyName');
		companyNameInput.value = companyName;
		
		switchPlot();
	})();
}

function setFullscreen(container)
{
	const elem = document.getElementById(container);
	if(!elem){return;}
	elem.classList.add("fullScreen");
}

const fullMonthNames = {
	"jan": "January",
	"feb": "February",
	"mar": "March",
	"apr": "April",
	"may": "May",
	"jun": "June",
	"jul": "July",
	"aug": "August",
	"sep": "September",
	"oct": "October",
	"nov": "November",
	"dec": "December"
}

const prettyModeNames = {
	"amount": "Amount",
	"profit": "Profit",
	"volume": "Volume",
	"price": "Price",
	"deficit": "Deficit"
}
