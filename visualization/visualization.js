let colorHexes = ['#fef0e0','#fee0d0','#fcbba1','#fc9272','#fb6a4a','#ef3b2c','#cb181d','#a50f15','#67000d'];
// let noDataColor = '#fff5f0';
let noDataColor = '#f3f3f3';

// County Data
let countyDataMap = d3.map();
let countyForeclosureData = d3.map();
let topoCountyIdMap = d3.map();
let countyAffordabilityMap = d3.map();

// County Bollinger Bands Data
let countyUpperBandDetails = d3.map();
let countyMidBandDetails = d3.map();
let countyLowerBandDetails = d3.map();

// State Data
let stateDataMap = d3.map();
let stateForeclosureData = d3.map();
let topoStateIdMap = d3.map();
let statePredictions = d3.map();
let stateAffordabilityMap = d3.map();

// State Bollinger Bands Data
let stateUpperBandDetails = d3.map();
let stateMidBandDetails = d3.map();
let stateLowerBandDetails = d3.map();

let dataDateList = [];
let currentDateSelected = '2018-01';

// map data displayed
let map = d3.map();

let topologyData;
let latestDate;

// median scale
let colorScale = createColorScale(0, 900000);
// foreclosure scale
let colorForeclosureScale = createColorScale(0, 10);
// affordability scale
let colorAffordabilityScale = createColorScale(0, 10);

const MODES = {STATE: 0, COUNTY:1};
const DATA_SOURCES = {FORECLOSURES:0, MEDIAN:1, AFFORDABILITY:2};

let MODE = MODES.STATE;
let DATA_SOURCE = DATA_SOURCES.MEDIAN;

var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];

let stateAbbreviations = {
  'AL':'Alabama',
  'AK':'Alaska',
  'AZ':'Arizona',
  'AR':'Arkansas',
  'CA':'California',
  'CO':'Colorado',
  'CT':'Connecticut',
  'DE':'Delaware',
  'FL':'Florida',
  'GA':'Georgia',
  'HI':'Hawaii',
  'ID':'Idaho',
  'IL':'Illinois',
  'IN':'Indiana',
  'IA':'Iowa',
  'KS':'Kansas',
  'KY':'Kentucky',
  'LA':'Louisiana',
  'ME':'Maine',
  'MD':'Maryland',
  'MA':'Massachusetts',
  'MI':'Michigan',
  'MN':'Minnesota',
  'MS':'Mississippi',
  'MO':'Missouri',
  'MT':'Montana',
  'NE':'Nebraska',
  'NV':'Nevada',
  'NH':'New Hampshire',
  'NJ':'New Jersey',
  'NM':'New Mexico',
  'NY':'New York',
  'NC':'North Carolina',
  'ND':'North Dakota',
  'OH':'Ohio',
  'OK':'Oklahoma',
  'OR':'Oregon',
  'PA':'Pennsylvania',
  'RI':'Rhode Island',
  'SC':'South Carolina',
  'SD':'South Dakota',
  'TN':'Tennessee',
  'TX':'Texas',
  'UT':'Utah',
  'VT':'Vermont',
  'VA':'Virginia',
  'WA':'Washington',
  'WV':'West Virginia',
  'WI':'Wisconsin',
  'WY':'Wyoming',
  'AS':'American Samoa',
  'DC':'District of Columbia',
  'FM':'Federated States of Micronesia',
  'GU':'Guam',
  'MH':'Marshall Islands',
  'MP':'Northern Mariana Islands',
  'PW':'Palau',
  'PR':'Puerto Rico',
  'VI':'Virgin Islands'
};

let usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
});

let q = d3.queue();

// County Data
q.defer(d3.csv, '../data/county/median_prices.csv');
q.defer(d3.csv, '../data/county/bollinger_bands_upper_output.csv');
q.defer(d3.csv, '../data/county/bollinger_bands_mid_output.csv');
q.defer(d3.csv, '../data/county/bollinger_bands_lower_output.csv');
q.defer(d3.csv, '../data/county/foreclosure_rates.csv');
q.defer(d3.csv, '../data/topojson_county_mapping.csv');

// State Data
q.defer(d3.csv, '../data/state/median_prices.csv');
q.defer(d3.csv, '../data/state/bollinger_bands_upper_output.csv');
q.defer(d3.csv, '../data/state/bollinger_bands_mid_output.csv');
q.defer(d3.csv, '../data/state/bollinger_bands_lower_output.csv');
q.defer(d3.csv, '../data/state/foreclosure_rates.csv');
q.defer(d3.csv, '../data/state/state_predictions.csv');
q.defer(d3.csv, '../data/topojson_state_mapping.csv');

// TopoJson United States Map
q.defer(d3.json, 'libs/us.json');

// Load files
q.await(loadDataFiles);

function loadDataFiles(
  error,
  countyMedianData, countyUpperBand, countyMidBand, countyLowerBand, countyForeclosureDataInput, countyTopoMapping,
  stateMedianData, stateUpperBand, stateMidBand, stateLowerBand, stateForeclosureDataInput, statePredictionsInput, stateTopoMapping,
  us
){
  latestDate = Object.keys(countyMedianData[0]).pop();

  topologyData = us;

  countyMedianData.forEach(function (d) {
    map.set(d.topo_id, +d[latestDate])
    countyDataMap.set(d.topo_id, d);
  });

  stateMedianData.forEach(function (d) {
    stateDataMap.set(d.topo_id, d);
  });

  statePredictionsInput.forEach(function (d) {
    statePredictions.set(d.topo_id, d);
  });

  countyTopoMapping.forEach(function (d) {
    topoCountyIdMap.set(d.id, d);
  });

  /* not currently used
  stateTopoMapping.forEach(function (d) {
    topoStateIdMap.set(d.id, d);
  });
  */

  // Grab data date range (use Orange, California)
  let CA = countyDataMap.get(6059);
  CA = Object.keys(CA).slice(3);
  CA.forEach(function(date) {
    dataDateList.push(date);
  });
  currentDateSelected = dataDateList[0];

  //Foreclosure Data
  countyForeclosureDataInput.forEach(function (d) {
    countyForeclosureData.set(d.topo_id, d);
  });

  stateForeclosureDataInput.forEach(function (d) {
    stateForeclosureData.set(d.topo_id, d);
  });

  // Bollinger Band Data
  countyUpperBand.forEach(function (d) {
    countyUpperBandDetails.set(d.topo_id, d);
  });

  countyMidBand.forEach(function (d) {
    countyMidBandDetails.set(d.topo_id, d);
  });

  countyLowerBand.forEach(function (d) {
    countyLowerBandDetails.set(d.topo_id, d);
  });

  stateUpperBand.forEach(function (d) {
    stateUpperBandDetails.set(d.topo_id, d);
  });

  stateMidBand.forEach(function (d) {
    stateMidBandDetails.set(d.topo_id, d);
  });

  stateLowerBand.forEach(function (d) {
    stateLowerBandDetails.set(d.topo_id, d);
  });

  colorScale = d3.scale.quantile()
    .domain([0, 900000])
    .range([0, 1, 2, 3, 4, 5, 6, 7, 8]);

  // create slider
  createTimeSlider();

  if (MODE == MODES.COUNTY) {
    drawCountyMap();
  } else {
    drawStateMap();
    drawForeclosureGraph(6);
    drawBollingerBandGraph(6);
    drawPredictionGraph(6);
  }

  hideLoadSpinner();
  showUIButtons();
}

function createColorScale(min, max) {
  let colorScale = d3.scale.quantile()
    .domain([min, max])
    .range([0, 1, 2, 3, 4, 5, 6, 7, 8]);

  return colorScale;
}

function removeMainMap() {
  if (d3.select('#main-map')[0][0] !== null) {
    d3.select('#main-map')[0][0].remove();
  }

  // Remove mini graphs associated with previous map
  // removeForeclosureGraph();
  // removeBollingerBandGraph();
  // removePredictionGraph();
}

function removeForeclosureGraph() {
  if (d3.select('#foreclosure-graph')[0][0] !== null) {
    d3.select('#foreclosure-graph')[0][0].remove();
  }
}


function removePredictionGraph() {
  if (d3.select('#prediction-graph')[0][0] !== null) {
    d3.select('#prediction-graph')[0][0].remove();
  }
}

function removeBollingerBandGraph() {
  if (d3.select('#bollingerband-graph')[0][0] !== null) {
    d3.select('#bollingerband-graph')[0][0].remove();
  }
}

function drawCountyMap(monthYear) {
  if (monthYear == undefined) {
    monthYear = currentDateSelected;
  }

  removeMainMap();

  let path = d3.geo.path();
  let svg = d3.select('#map-container').append('svg').attr('id', 'main-map').attr('width', 960).attr('height', 525);

  let countyTip = d3.tip().attr('class', 'd3-tip').html(createCountyTooltip).offset([0, 0]);
  svg.call(countyTip);

  let data;
  let cScale;
  if (DATA_SOURCE == DATA_SOURCES.MEDIAN) {
    data = countyDataMap;
    cScale = colorScale;
  } else if (DATA_SOURCE == DATA_SOURCES.AFFORDABILITY) {
    data = countyAffordabilityMap;
    cScale = colorAffordabilityScale;
  } else if (DATA_SOURCE == DATA_SOURCES.FORECLOSURES) {
    data = countyForeclosureData;
    cScale = colorForeclosureScale;
  }

  svg.append('g')
    .attr('class', 'counties')
    .selectAll('path')
    .data(topojson.feature(topologyData, topologyData.objects.counties).features)
    .enter().append('path')
    .attr('fill', function(d) {
      let county = data.get(d.id);
      if (county !== undefined) {
        let val = DATA_SOURCE == DATA_SOURCES.AFFORDABILITY ? +county : +county[monthYear];
        return colorHexes[cScale(val)];
      }
      return noDataColor;
    })
    .attr('d', path)
    .on('mouseover', countyTip.show)
    .on('mouseout', countyTip.hide);

  svg.append('path')
    .datum(topojson.mesh(topologyData, topologyData.objects.states, function(a, b) { return a !== b; }))
    .attr('class', 'states')
    .attr('d', path);

  createLegend(svg, colorScale);
}

function drawStateMap(monthYear) {
  removeMainMap();

  if (monthYear == undefined) {
    monthYear = currentDateSelected;
  }

  let path = d3.geo.path();
  let svg = d3.select('#map-container').append('svg').attr('id', 'main-map').attr('width', 960).attr('height', 525);

  let stateTip = d3.tip().attr('class', 'd3-tip').html(createStateTooltip).offset([-5, 50]);
  svg.call(stateTip);

  let data;
  let cScale = colorScale;
  if (DATA_SOURCE == DATA_SOURCES.MEDIAN) {
    data = stateDataMap;
    cScale = colorScale;
  } else if (DATA_SOURCE == DATA_SOURCES.AFFORDABILITY) {
    data = stateAffordabilityMap;
    cScale = colorAffordabilityScale;
  } else if (DATA_SOURCE == DATA_SOURCES.FORECLOSURES) {
    data = stateForeclosureData;
    cScale = colorForeclosureScale;
  }

  svg.append('g')
  .attr('class', 'states')
  .selectAll('path')
  .data(topojson.feature(topologyData, topologyData.objects.states).features)
  .enter().append('path')
  .attr('fill', function(d) {
    let state = data.get(d.id);
    if (state !== undefined) {
      let val = DATA_SOURCE == DATA_SOURCES.AFFORDABILITY ? state : state[monthYear];
      return colorHexes[cScale(val)];
    }
    return noDataColor;
  })
  .attr('d', path)
  .on('mouseover', stateTip.show)
  .on('mouseout', stateTip.hide);

  createLegend(svg, colorScale);
}

function drawForeclosureGraph(topo_id) {
  let data;
  if (MODE === MODES.COUNTY) {
    data = countyForeclosureData.get(topo_id);
  } else {
    data = stateForeclosureData.get(topo_id);
  }

  removeForeclosureGraph();

  if (data === undefined) {
    data = {'topo_id': topo_id, 'state': '', 'county': ''};
    dataDateList.forEach(function(date) {
      data[date] = 0.0;
    });
  }

  let dates = Object.keys(data).slice(3);
  let foreclosures = [];

  let numTicks = 0;

  dates.forEach(function(date) {
    let value = +data[date];
    if (value !== 0.0) {
      let temp = {};
      temp['date'] = Date.parse(date);
      temp['value'] = value;
      foreclosures.push(temp);
      numTicks++;
    }
  });

  let xMin = d3.min(foreclosures, function(d){return d.date;});
  let xMax = d3.max(foreclosures, function(d){return d.date;});
  let xScale = d3.scale.linear().domain([xMin, xMax]).range([0, 300]);

  let yMin = d3.min(foreclosures, function(d){return d.value;});
  let yMax = d3.max(foreclosures, function(d){return d.value;});
  let yScale = d3.scale.linear().domain([yMax, yMin]).range([0, 150]);

  let noData = false;
  if (yMin == undefined && yMax == undefined) {
    noData = true;
  }

  let yearTick = null;
  let xAxis = d3.svg.axis()
        .scale(xScale)
        .ticks(numTicks)
        .tickFormat(function(d) {
          let dateTick = new Date(d).getFullYear();
          if (yearTick != dateTick) {
            yearTick = dateTick;
            return dateTick;
          }
          return '';
        })
        .orient('bottom');

  let yAxis = d3.svg.axis()
    .scale(yScale)
    .ticks(10)
    .tickFormat(function(d) { return d; })
    .orient('left');

  let graphLine = d3.svg.line()
    .x(function(d) { return xScale(d.date); })
    .y(function(d) { return yScale(d.value); });

  let svg = d3.select('#mini-graph-container').append('svg').attr('id', 'foreclosure-graph');
  svg.attr('width', 350).attr('height', 200);
  let miniGraph = svg.append('g').attr('class', 'mini-graph').attr('transform', 'translate(50, 30)')

  let name = MODE == MODES.STATE ? data.state : data.county;
  miniGraph.append('text').text(`${name} Foreclosure Rate (per 10K homes)`).attr('class', 'mini-graph-title').attr('transform', 'translate(30, -10)');
  miniGraph.append('text').text('Pct %').attr('class', 'mini-graph-text').attr('transform', 'translate(-30, -5)');

  miniGraph.append("path")
    .datum(foreclosures)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("stroke-width", 1.5)
    .attr("d", graphLine);

  miniGraph.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0, 150)`)
    .call(xAxis);

  miniGraph.append('g')
    .attr('class', 'axis')
    .call(yAxis);

  if (noData) {
    miniGraph.append('text')
      .text(`No Foreclosure Data`)
      .attr('class', 'mini-graph-title')
      .attr('transform', 'translate(75, 75)');
  }
}

function drawBollingerBandGraph(topo_id) {
  let upper, mid, lower;
  if (MODE === MODES.COUNTY) {
    upper = countyUpperBandDetails.get(topo_id);
    mid = countyMidBandDetails.get(topo_id);
    lower = countyLowerBandDetails.get(topo_id);
  } else {
    upper = stateUpperBandDetails.get(topo_id);
    mid = stateMidBandDetails.get(topo_id);
    lower = stateLowerBandDetails.get(topo_id);
  }

  if (upper === undefined) {
    upper = mid = lower = [];
    upper = {'topo_id': topo_id, 'state': '', 'county': ''};
    dataDateList.forEach(function(date) {
      upper[date] = 0.0;
      mid[date] = 0.0;
      lower[date] = 0.0;
    });
  }

  let dates = Object.keys(upper).slice(3);
  let uppers = [];
  let mids = [];
  let lowers = [];

  let numTicks = 0;

  dates.forEach(function(date) {
    let upperPt = +upper[date];
    let midPt = +mid[date];
    let lowerPt = +lower[date];

    if (upperPt !== 0.0 && midPt !== 0.0 && lowerPt !== 0.0) {
      uppers.push({'date': Date.parse(date), 'value':upperPt});
      mids.push({'date': Date.parse(date), 'value':midPt});
      lowers.push({'date': Date.parse(date), 'value':lowerPt});

      numTicks++;
    }
  });

  let xMin = d3.min(mids, function(d){return d.date;});
  let xMax = d3.max(mids, function(d){return d.date;});
  let xScale = d3.scale.linear().domain([xMin, xMax]).range([0, 300]);

  let yMin = d3.min(lowers, function(d){return d.value;});
  let yMax = d3.max(uppers, function(d){return d.value;});
  let yScale = d3.scale.linear().domain([yMax, yMin]).range([0, 150]);

  let yearTick = null;
  let xAxis = d3.svg.axis()
        .scale(xScale)
        .ticks(numTicks)
        .tickFormat(function(d) {
          let dateTick = new Date(d).getFullYear();
          if (yearTick != dateTick) {
            yearTick = dateTick;
            return dateTick;
          }
          return '';
        })
        .orient('bottom');

  let yAxis = d3.svg.axis()
    .scale(yScale)
    .ticks(10)
    .tickFormat(function(d) {
      return usdFormatter.format(d);
    })
    .orient('left');

  let upperBandLine = d3.svg.line()
    .x(function(d) { return xScale(d.date); })
    .y(function(d) { return yScale(d.value); });

  let midBandLine = d3.svg.line()
    .x(function(d) { return xScale(d.date); })
    .y(function(d) { return yScale(d.value); });

  let lowerBandLine = d3.svg.line()
    .x(function(d) { return xScale(d.date); })
    .y(function(d) { return yScale(d.value); });

  removeBollingerBandGraph();

  let svg = d3.select('#mini-graph-container').append('svg').attr('id', 'bollingerband-graph');
  svg.attr('width', 400).attr('height', 200);
  let miniGraph = svg.append('g').attr('class', 'mini-graph').attr('transform', 'translate(55, 30)')

  let name = MODE == MODES.STATE ? upper.state : upper.county;
  miniGraph.append('text').text(`${name} BollingerBand (20 month SMA)`).attr('class', 'mini-graph-title').attr('transform', 'translate(30, -10)');
  miniGraph.append('text').text('USD ($)').attr('class', 'mini-graph-text').attr('transform', 'translate(-30, -5)');

  // Upper Band
  miniGraph.append("path")
    .datum(uppers)
    .attr("fill", "none")
    .attr("stroke", "green")
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("stroke-width", 1.5)
    .attr("d", upperBandLine);

  // Mid Band
  miniGraph.append("path")
    .datum(mids)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("stroke-width", 1.5)
    .attr("d", midBandLine);

  // Lower Band
  miniGraph.append("path")
    .datum(lowers)
    .attr("fill", "none")
    .attr("stroke", "red")
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("stroke-width", 1.5)
    .attr("d", lowerBandLine);

  miniGraph.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0, 150)`)
    .call(xAxis);

  miniGraph.append('g')
    .attr('class', 'axis')
    .call(yAxis);
}

function drawPredictionGraph(topo_id) {

  if (MODE !== MODES.STATE) {
    return;
  }

  let data = statePredictions.get(topo_id);

  removePredictionGraph();

  if (data === undefined) {
    data = {'topo_id': topo_id, 'state': '', 'county': ''};
    dataDateList.forEach(function(date) {
      data[date] = 0.0;
    });
  }

  let length = Object.keys(data).length - 6;
  let dates = Object.keys(data).slice(length);
  let predictions = [];

  let numTicks = 0;
  dates.forEach(function(date) {
    let value = +data[date];
    if (value !== 0.0) {
      let temp = {};
      temp['date'] = moment(date).utc();
      temp['value'] = value;
      predictions.push(temp);
      numTicks++;
    }
  });

  let xMin = d3.min(predictions, function(d){return d.date;});
  let xMax = d3.max(predictions, function(d){return d.date;});
  let xScale = d3.scale.linear().domain([xMin, xMax]).range([0, 300]);

  let yMin = d3.min(predictions, function(d){return d.value;});
  let yMax = d3.max(predictions, function(d){return d.value;});
  let yScale = d3.scale.linear().domain([yMax, yMin]).range([0, 150]);

  let monthTick = moment(dates[0]).month();
  let xAxis = d3.svg.axis()
        .scale(xScale)
        .ticks(numTicks)
        .tickFormat(function(d) {
          let tick = months[monthTick];
          monthTick++;
          monthTick %= 12;
          return tick;
        })
        .orient('bottom');

  let yAxis = d3.svg.axis()
    .scale(yScale)
    .ticks(10)
    .tickFormat(function(d) {
      return usdFormatter.format(d);
    })
    .orient('left');

  let graphLine = d3.svg.line()
    .x(function(d) { return xScale(d.date); })
    .y(function(d) { return yScale(d.value); });

  let svg = d3.select('#mini-graph-container').append('svg').attr('id', 'prediction-graph');
  svg.attr('width', 400).attr('height', 200);
  let miniGraph = svg.append('g').attr('class', 'mini-graph').attr('transform', 'translate(55, 30)')

  let name = data.state;
  miniGraph.append('text').text(`${name} Price Prediction`).attr('class', 'mini-graph-title').attr('transform', 'translate(30, -10)');
  miniGraph.append('text').text('USD ($)').attr('class', 'mini-graph-text').attr('transform', 'translate(-30, -5)');

  miniGraph.append("path")
    .datum(predictions)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("stroke-width", 1.5)
    .attr("d", graphLine);

  miniGraph.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0, 150)`)
    .call(xAxis);

  miniGraph.append('g')
    .attr('class', 'axis')
    .call(yAxis);
}

function removeLegend() {
  if (d3.select('#legend')[0][0] !== null) {
    d3.select('#legend')[0][0].remove();
  }
}

function createLegend(svg, colorScale) {
  removeLegend();

  let legend = svg.append('g').attr('id', 'legend').attr('class', 'legend').attr('transform', 'translate(875, 100)');

  let yStep = 20;

  if (DATA_SOURCE == DATA_SOURCES.MEDIAN) {
    createMedianLegend(legend, yStep);
  } else if(DATA_SOURCE == DATA_SOURCES.FORECLOSURES) {
    createForeclosureLegend(legend, yStep);
  } else if (DATA_SOURCE == DATA_SOURCES.AFFORDABILITY) {
    createAffordabilityLegend(legend, yStep);
  }
}

function createMedianLegend(legend, yStep) {
  let y = 0;

  let i = 0;
  for (i = 0; i < 10; i++) {
    let pctText = i * 100;
    pctText = usdFormatter.format(pctText);
    pctText += 'K';
    legend.append('text').text(pctText).attr('x', 35).attr('y', y+5);
    legend.append('rect').attr('fill', colorHexes[i]).attr('y', y).attr('height', yStep).attr('width', yStep+10);
    y += yStep;
  }
}

function createAffordabilityLegend(legend, yStep) {
  let y = 0;

  legend.append('text').text('Salary Years').attr('x', 5).attr('y', -15);

  let i = 0;
  for (i = 0; i < 10; i++) {
    let pctText = i;
    pctText += '+ years';
    legend.append('text').text(pctText).attr('x', 35).attr('y', y+5);
    legend.append('rect').attr('fill', colorHexes[i]).attr('y', y).attr('height', yStep).attr('width', yStep+10);
    y += yStep;
  }
}

function createForeclosureLegend(legend, yStep) {
  let y = 0;

  let i = 0;

  for (i = 0; i < 10; i++) {
    let pctText = i;
    pctText += '%';
    legend.append('text').text(pctText).attr('x', 35).attr('y', y+5);
    legend.append('rect').attr('fill', colorHexes[i]).attr('y', y).attr('height', yStep).attr('width', yStep+10);
    y += yStep;
  }
}

function createCountyTooltip(data) {
  let county = countyDataMap.get(data.id);

  let tooltip;
  if (county !== undefined) {
    let medianPrice = +county[currentDateSelected];
    medianPrice = medianPrice.toFixed(0);
    medianPrice = usdFormatter.format(medianPrice);
    tooltip = `County: ${county.county} <br />`
    + `State: ${county.state} <br />`
    + `Median Price: ${medianPrice}`;
  } else {
    let topo = topoCountyIdMap.get(data.id);
    let state = stateAbbreviations[topo.state];
    tooltip = `No housing data for ${topo.name}, ${state}`;
  }

  let countyFC = countyForeclosureData.get(data.id);
  if (countyFC !== undefined && +countyFC[currentDateSelected] != 0.0) {
    let fc = +countyFC[currentDateSelected];
    fc = fc.toFixed(1);
    tooltip += `<br />`
      + `Foreclosure Rate ${fc}%`;
  }

  if (county !== undefined && DATA_SOURCE == DATA_SOURCES.AFFORDABILITY ) {
    let countyAff = countyAffordabilityMap.get(data.id);
    tooltip = `County: ${county.county} <br />`
      + `State: ${county.state} <br />`
      + `Salary Years: ${countyAff.toFixed(1)}`;
  }

  // todo: move this outside tooltip function into generic on hover function that calls the proper functions
  if (county !== undefined) {
    drawForeclosureGraph(data.id);
    drawBollingerBandGraph(data.id);
  }

  return tooltip;
}

function createStateTooltip(data) {
  let state = stateDataMap.get(data.id);

  let medianPrice = +state[currentDateSelected];
  medianPrice = medianPrice.toFixed(0);
  medianPrice = usdFormatter.format(medianPrice);

  let tooltip = `${state.state} <br />`
  + `Median Price: ${medianPrice}`;

  let stateFC = stateForeclosureData.get(data.id);
  if (stateFC !== undefined && +stateFC[currentDateSelected] != 0.0) {
    let fc = +stateFC[currentDateSelected];
    fc = fc.toFixed(1);
    tooltip += `<br />`
      + `Foreclosure Rate: ${fc}%`;
  }

  if (state !== undefined && DATA_SOURCE == DATA_SOURCES.AFFORDABILITY ) {
    let stateAff = stateAffordabilityMap.get(data.id);
    tooltip = `${state.state} <br />`
      + `Salary Years: ${stateAff.toFixed(1)}`;
  }

  // todo: move this outside tooltip function into generic on hover function that calls the proper functions
  drawForeclosureGraph(data.id);
  drawBollingerBandGraph(data.id);
  drawPredictionGraph(data.id);

  return tooltip;
}

function createTimeSlider() {
  let formatTick = d3.time.format.utc("%Y");

  // parameters
  let margin = {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50
    },
    width = 960 - margin.left - margin.right,
    height = 300 - margin.bottom - margin.top;

  let sliderDates = [];
  let sliderRange = []
  let c = 0;
  let spacer = width / dataDateList.length;
  dataDateList.forEach(function (date) {
    let temp = new Date(new Date(date).toUTCString());
    sliderDates.push(temp);
    sliderRange.push(spacer * c);
    c++;
  });

  // scale function
  let timeScale = d3.time.scale()
    .domain(sliderDates)
    .range(sliderRange)
    .clamp(true);

  let startingValue = sliderDates[0];

  let brush = d3.svg.brush()
    .x(timeScale)
    .extent([startingValue, startingValue])
    .on("brush", brushed);

  let svg = d3.select("#slider-container").append("svg")
    .attr('id', 'time-slider')
    .attr("width", width + margin.left + margin.right)
    .attr("height", 125)
    .append("g")
    .attr("transform", "translate(" + margin.left + ",0)");

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height / 3 + ")")
    .call(d3.svg.axis()
      .scale(timeScale)
      .orient("bottom")
      .tickFormat(function(d) {
        if (d.getUTCMonth() == 0) {
          return formatTick(d);
        }
      })
      .tickSize(0)
      .tickPadding(12)
      .tickValues(sliderDates))
      .select(".domain")
      .select(function() {
        return this.parentNode.appendChild(this.cloneNode(true));
      })
      .attr("class", "halo");

  let slider = svg.append("g")
    .attr("class", "slider")
    .call(brush);

  slider.selectAll(".extent,.resize")
    .remove();

  slider.select(".background")
    .attr("height", height);

  let handle = slider.append("g")
    .attr("class", "handle")

  handle.append("path")
    .attr("transform", "translate(0," + height / 3 + ")")
    .attr("d", "M 0 -20 V 20")

  handle.append('text')
    .text(startingValue)
    .attr("transform", "translate(" + (-40) + " ," + (height / 3 - 25) + ")");

  slider
    .call(brush.event);

  function brushed() {
    let formatDate = d3.time.format.utc("%b %Y");

    let value = brush.extent()[0];

    if (d3.event.sourceEvent) { // not a programmatic event
      value = timeScale.invert(d3.mouse(this)[0]);
      brush.extent([value, value]);
    }

    handle.attr("transform", "translate(" + timeScale(value) + ",0)");
    handle.select('text').text(formatDate(value));

    let month = value.getUTCMonth() + 1;
    if (month < 10) {
      month = '0' + month;
    }

    let monthYear = `${value.getUTCFullYear()}-${month}`;
    currentDateSelected = monthYear;
    if (MODE == MODES.STATE) {
      drawStateMap(monthYear);
    } else {
      drawCountyMap(monthYear);
    }
  }
}

function onStateButtonClick() {
  MODE = MODES.STATE;
  drawStateMap();
}

function onCountyButtonClick() {
  MODE = MODES.COUNTY;
  removePredictionGraph();
  drawCountyMap();
}

function onForeclosureRateButtonClick() {
  showTimeSlider();
  hideAffordabilityField();

  DATA_SOURCE = DATA_SOURCES.FORECLOSURES;

  if (MODE == MODES.COUNTY) {
    drawCountyMap();
  } else {
    drawStateMap();
  }
}

function onMedianPricesButtonClick() {
  showTimeSlider();
  hideAffordabilityField();

  DATA_SOURCE = DATA_SOURCES.MEDIAN;

  if (MODE == MODES.COUNTY) {
    drawCountyMap();
  } else {
    drawStateMap();
  }
}

function onAffordabilityButtonClick() {
  currentDateSelected = latestDate;

  hideTimeSlider();
  showAffordabilityField();

  DATA_SOURCE = DATA_SOURCES.AFFORDABILITY;

  let netIncome = 75000.0;

  calculateAffordability(netIncome)
}

function onNetIncomeChange() {
  let netIncome = +document.getElementById('netIncome').value;
  calculateAffordability(netIncome);
}

function calculateAffordability(netIncome) {
  countyDataMap.keys().forEach(function(key) {
    let dataPt = countyDataMap.get(key)[latestDate] / netIncome;

    countyAffordabilityMap.set(key, dataPt);
  });

  stateDataMap.keys().forEach(function(key) {
    let dataPt = stateDataMap.get(key)[latestDate] / netIncome;

    stateAffordabilityMap.set(key, dataPt);
  });

  if (MODE == MODES.COUNTY) {
    drawCountyMap();
  } else {
    drawStateMap();
  }
}

function hideTimeSlider() {
  d3.select('#time-slider').attr('display', 'none');
}

function showTimeSlider() {
  d3.select('#time-slider').attr('display', 'initial');
}

function hideAffordabilityField() {
  d3.select('#affordability-income').attr('class', 'affordability-hidden');
}

function showAffordabilityField() {
  d3.select('#affordability-income').attr('class', 'affordability-shown');
}

function showUIButtons() {
  d3.select('#ui-buttons').attr('class', 'row obj-shown');
}

function hideLoadSpinner() {
  d3.select('#load-spinner').attr('class', 'obj-hidden');
}