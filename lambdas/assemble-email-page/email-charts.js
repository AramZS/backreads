const jsdom = require('jsdom')
const { JSDOM } = jsdom;
const d3Actual = Object.assign({},
	require('d3'),
	// require('d3-time'),
	// require('d3-time-format'),
	require('d3-fetch'),
	// require('d3')
);

exports.generateChartOntoHTML = (data, jsdomObj, selector) => {
	const styles = `
.line {
    fill: none;
    stroke: #ffab00;
    stroke-width: 3;
}

.overlay {
  fill: none;
  pointer-events: all;
}

/* Style the dots by assigning a fill and stroke */
.dot {
    fill: #ffab00;
    stroke: #fff;
}

.focus circle {
  fill: none;
  stroke: steelblue;
}`;

	console.log('Generate chart on ', selector)
  const options = {
    selector: selector,
    // container: html,
    styles: styles,
    d3Module: d3Actual
  };
  //const d3n = new D3Node(options);
  // const d3 = d3n.d3;
  const d3 = d3Actual;
  var weekOfEmails = data;
  var margin = {top: 80, right: 20, bottom: 50, left: 50},
    width = 350 - margin.left - margin.right,
    height = 275 - margin.top - margin.bottom;
  // https://github.com/d3/d3-time-format
  // var parseDate = d3.timeFormat("%Y-%m-%d").parse;
  var parseTime = d3.timeParse("%Y-%m-%d");
  // Set the ranges
  var x = d3.scaleTime().range([0, width]);
  var y = d3.scaleLinear().range([height, 0]);
  const aDom = jsdomObj
  var svg = d3
     .select(aDom.window.document).select(selector)
	 .append("svg")
	 .attr("width", width + margin.left + margin.right)
	 .attr("height", height + margin.top + margin.bottom)
	 .attr("padding-bottom", margin.bottom)
	//var svg = d3n.createSVG(width + margin.left + margin.right, height + margin.top + margin.bottom, {"padding-bottom": margin.bottom})
		.append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top/2 + ")");

  weekOfEmails.forEach(function(d){
    d.date = parseTime(d.date);
  })

  // Load Object Data - https://stackoverflow.com/questions/35910649/how-to-load-a-json-object-instead-of-json-file
  // x.domain(weekOfEmails.map(function(d) { return parseDate(d.date) }));
  // y.domain(weekOfEmails.map(function(d) { return d.emailCount }));

  x.domain(d3.extent(weekOfEmails, function(d) { return d.date; }));
  y.domain([0, d3.max(weekOfEmails, function(d) { return d.count; })]);

  // Define the line
  var valueline = d3.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.count); })
    .curve(d3.curveMonotoneX);

  // Add the valueline path.
  svg.append("path")
      .attr("class", "line")
      .attr("d", valueline(weekOfEmails));

  // Add the X Axis
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x)
              .tickFormat(d3.timeFormat("%Y-%m-%d"))
              .ticks(7)
           ).selectAll("text")
        .style("text-anchor", "end")
        .attr("transform", "translate(-10,10)rotate(-45)");

  // Add the Y Axis
  svg.append("g")
      .attr("class", "y axis")
      .call(d3.axisLeft(y));


  svg.selectAll(".dot")
    .data(weekOfEmails)
    .enter().append("circle") // Uses the enter().append() method
    .attr("class", "dot") // Assign a class for styling
    .attr("cx", function(d, i) { return x(d.date) })
    .attr("cy", function(d) { return y(d.count) })
    .attr("r", 5)

  // d3-node is supposed to do this, but it doesn't seem to be
  svg.append('defs')
      .append('style')
      .attr('type', 'text/css')
      .text(`<![CDATA[ ${styles} ]]>`)

  return aDom;
}
