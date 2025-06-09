window.onload = function() {
	const graphTypeSelector = document.getElementById("graphType");
	const selectorSubtypes = document.getElementById("selectorSubtypes");
	
	graphTypeSelector.addEventListener("change", function() {
		updateSelectors(graphTypeSelector, selectorSubtypes);
		switchPlot(graphTypeSelector);
	});
	
	updateSelectors(graphTypeSelector, selectorSubtypes);
	switchPlot(graphTypeSelector);
};

// Update selectors based on graph type
function updateSelectors(graphTypeSelector, selectorSubtypes)
{
	clearChildren(selectorSubtypes);
	
	if(graphTypeSelector.value == "topProduction" || graphTypeSelector.value == "topCompanies")
	{
		selectorSubtypes.appendChild(addInput(graphTypeSelector, 'select', 'metric', 'Metric: ', [['Volume', 'Profit'], ['volume', 'profit']]));
		
		selectorSubtypes.appendChild(addInput(graphTypeSelector, 'select', 'month', 'Month: ', [["March 3025", "April 3025", "May 3025"], ["mar25", "apr25", "may25"]]));
	}
	else if(graphTypeSelector.value == "matHistory")
	{
		selectorSubtypes.appendChild(addInput(graphTypeSelector, 'select', 'metric', 'Metric: ', [['Volume', 'Profit', 'Amount', 'Price'], ['volume', 'profit', 'amount', 'price']]));
		
		selectorSubtypes.appendChild(addInput(graphTypeSelector, 'input', 'mat', 'Ticker: '));
	}
}

function switchPlot(typeElem)
{
	var monthElem;
	var metricElem;
	var matElem;
	
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
			promiseGenerateTopProdGraph("mainPlot", monthElem.value, metricElem.value);
			break;
		case "topCompanies":
			metricElem = document.getElementById("metric");
			monthElem = document.getElementById("month");
			promiseGenerateTopCompanyGraph("mainPlot", monthElem.value, metricElem.value);
			break;
		case "matHistory":
			metricElem = document.getElementById("metric");
			matElem = document.getElementById("mat");
			promiseGenerateMatGraph("mainPlot", matElem.value, metricElem.value);
			break;
	}
}

function promiseGenerateTopCompanyGraph(container, month, metric)	// Metric is either 'profit' or 'volume'
{
	fetch('data/company-data-' + month + '.json?cb=' + Date.now())
    .then(response => response.json())  // Parse JSON data
    .then(data => {
		fetch('data/knownCompanies2.json?cb=' + Date.now())
		.then(response => response.json())
		.then(knownCompanies => {
			generateTopCompanyGraph(container, data, knownCompanies, month, metric);  // Use the JSON data
		});
    });
}

function promiseGenerateTopProdGraph(container, month, metric)	// Metric is either 'profit' or 'volume'
{
	fetch('data/prod-data-' + month + '.json?cb=' + Date.now())
    .then(response => response.json())  // Parse JSON data
    .then(data => {
		generateTopProdGraph(container, data, month, metric);  // Use the JSON data
    });
}

function promiseGenerateMatGraph(container, ticker, metric)	// Metric is either 'profit', 'volume', or 'amount'
{
	// Validation/sanitizing
	if(!ticker){return;}
	ticker = ticker.toUpperCase();
	
	// Get data
	const months = ['mar25', 'apr25', 'may25']
	const fetches = months.map(month => 
		fetch('data/prod-data-' + month + '.json?cb=' + Date.now()).then(res => res.json())
	);
	
	Promise.all(fetches).then(rawData => {
		const data = []
		var hasData = false;
		rawData.forEach(monthData => {
			const dataPoint = monthData[ticker]
			if(dataPoint)
			{
				if(metric == 'price')
				{
					data.push(dataPoint['amount'] == 0 ? 0 : dataPoint['volume'] / dataPoint['amount']);
				}
				else
				{
					data.push(dataPoint[metric])
				}
				hasData = true;
			}
		});
		
		if(hasData)
		{
			generateMatGraph(container, months.map(month => prettyMonthName(month)), data, ticker, metric)
		}
	});
}

function generateTopProdGraph(container, prodData, month, metric)
{
	// Convert the data object into an array of [ticker, volume] pairs
	const volumeArray = Object.entries(prodData).map(([ticker, info]) => ({
		ticker,
		volume: info[metric]
	}));

	// Sort the array by volume in descending order
	volumeArray.sort((a, b) => b.volume - a.volume);
	
	// Extract tickers and volumes into separate arrays
	const tickers = volumeArray.map(item => item.ticker);
	const volumes = volumeArray.map(item => item.volume);
	
	Plotly.newPlot(container, {
        data: [{ x: tickers, y: volumes, type: 'bar' , marker: {color: 'rgb(247, 166, 0)'}, hovertemplate: '%{x}: %{y:,.3~s}<extra></extra>'}],
        layout: { width: 800, height: 400, 
			title: {text: 'Top ' + (metric == 'profit' ? 'Profit Materials - ' : 'Production Volumes - ') + prettyMonthName(month),
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
			scrollZoom: true
		}
    });
}

function generateTopCompanyGraph(container, companyData, knownCompanies, month, metric)
{
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
        layout: { width: 800, height: 400, 
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
			dragmode: 'pan',
			margin: {b: 120}
		},
		config: {
			displayModeBar: true,
			modeBarButtonsToRemove: ['lasso2d'],  // Remove unwanted buttons
			displaylogo: false,
			scrollZoom: true
		}
    });
}

function generateMatGraph(container, months, data, ticker, metric)
{
	const titles = {
		'profit': 'Production Profit History of ',
		'volume': 'Production Volume History of ',
		'amount': 'Production Amount History of ',
		'price': 'Price History of '
	}
	const yAxis = {
		'profit': 'Daily Profit [$/day]',
		'volume': 'Daily Volume [$/day]',
		'amount': 'Daily Production [per day]',
		'price': 'Price [$]'
	}
	
	Plotly.newPlot(container, {
        data: [{ x: months, y: data, type: 'bar' , marker: {color: 'rgb(247, 166, 0)'}, hovertemplate: '%{x}: %{y:,.3~s}<extra></extra>'}],
        layout: { width: 800, height: 400, 
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
			scrollZoom: true
		}
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

function addInput(graphTypeSelector, inputType, id, label, values)
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
	
	inputElem.addEventListener("change", function() {
		switchPlot(graphTypeSelector);
	});
	
	labelElem.appendChild(inputElem);
	
	return wrapInDiv(labelElem);
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
	"price": "Price"
}