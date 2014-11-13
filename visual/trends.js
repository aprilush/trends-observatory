// Various accessors that specify the four dimensions of data to visualize.
function x(d) { return d.bar; }
function y(d) { return d.rank ; }
function radius(d) { return d.rank; }
function color(d) { return d.topic; }
function key(d) { return d.label; }

  // function interpolateTime(start, end) {
  //   return function(t) {
  //     var intervals = Math.ceil(Math.abs(end.getTime() - start.getTime()) / 1000); 
  //     var ms = start.getTime() + (1000 * ((1-t) + t*intervals));
  //     return new Date(ms);
  //   };
  // }

  // console.log(interpolateTime(new Date("2014-10-01"), new Date())(0.499));
  // console.log(new Date(d3.interpolateNumber(new Date("2014-10-01"), new Date())(0.499)));


// Chart dimensions.
var margin = {top: 19.5, right: 19.5, bottom: 19.5, left: 39.5},
    width = 960 - margin.right,
    height = 500 - margin.top - margin.bottom;

// Various scales. These domains make assumptions of data, naturally.
var xScale = d3.scale.linear().domain([1, 10]).range([0, width]),
    yScale = d3.scale.linear().domain([1, 10]).range([height, 0]),
    radiusScale = d3.scale.sqrt().domain([0, 100]).range([0, 100]),
    colorScale = d3.scale.category10();

// The x & y axes.
var xAxis = d3.svg.axis().orient("bottom").scale(xScale).ticks(12, d3.format(",d")),
    yAxis = d3.svg.axis().scale(yScale).orient("left");

// Create the SVG container and set the origin.
var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Add the x-axis.
svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

// Add the y-axis.
svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

// Add an x-axis label.
svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height - 6)
    .text("System (and location)");

// Add a y-axis label.
svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Rank");

// Add the year label; the value is set on transition.
var label = svg.append("text")
    .attr("class", "year label")
    .attr("text-anchor", "end")
    .attr("y", height - 24)
    .attr("x", width)
    .text(2014);

// Load the data.
d3.json("trends.json", function(trends) {

  // A bisector since many nation's data is sparsely-defined.
  // var bisect = d3.bisector(function(d) { return d[0]; });

  // Add a dot per nation. Initialize the data at 1800, and set the colors.
  var dot = svg.append("g")
      .attr("class", "dots")
      .selectAll(".dot")
      .data(interpolateData(new Date("2014-10-16")))
      .enter().append("circle")
      .attr("class", "dot")
      .style("fill", function(d) { return colorScale(color(d)); })
      .call(position)
      .sort(order);

  // Add a title.
  dot.append("title")
      .text(function(d) { return d.name; });

  // Add an overlay for the year label.
  var box = label.node().getBBox();

  var overlay = svg.append("rect")
        .attr("class", "overlay")
        .attr("x", box.x)
        .attr("y", box.y)
        .attr("width", box.width)
        .attr("height", box.height)
        .on("mouseover", enableInteraction);

  // Start a transition that interpolates the data based on year.
  svg.transition()
      .duration(30000)
      .ease("linear")
      .tween("year", tweenInterval)
      .each("end", enableInteraction);

  // Positions the dots based on data.
  function position(dot) {
    dot .attr("cx", function(d) { return xScale(x(d)); })
        .attr("cy", function(d) { return yScale(y(d)); })
        .attr("r", function(d) { return radiusScale(radius(d)); });
  }

  // Defines a sort order so that the smallest dots are drawn on top.
  function order(a, b) {
    return radius(b) - radius(a);
  }

  // After the transition finishes, you can mouseover to change the year.
  function enableInteraction() {
    var yearScale = d3.scale.linear()
        .domain([new Date("2014-10-16"), new Date()])
        .range([box.x + 10, box.x + box.width - 10])
        .clamp(true);

    // Cancel the current transition, if any.
    svg.transition().duration(0);

    overlay
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)
        .on("mousemove", mousemove)
        .on("touchmove", mousemove);

    function mouseover() {
      label.classed("active", true);
    }

    function mouseout() {
      label.classed("active", false);
    }

    function mousemove() {
      displayInterval(yearScale.invert(d3.mouse(this)[0]));
    }
  }

  // Tweens thetrends entire chart by first tweening the year, and then the data.
  // For the interpolated data, the dots and label are redrawn.
  function tweenInterval() {
    var time = d3.interpolateNumber(new Date("2014-10-16"), new Date());
    return function(t) { displayInterval(new Date(time(t))); };
  }

  // Updates the display to show the specified year.
  function displayInterval(time) {
    console.log(time);
    dot.data(interpolateData(time), key).call(position).sort(order);
    label.text(new Date(time));
  }

  // Interpolates the dataset for the given timestamp's 5min interval.
  function interpolateData(time) {
    // get the interval
    return trends.map(function(d) {
      return {
        bar: barId(d.source, d.location),
        rank: 5, //d.rank,
        label: d.label,  //interpolateValues(d.income, year),
        topic: findTopic(d.label),
      };
    });
  }

  function barId(source, location) {
    switch(source) {
      case "Twitter": 
        switch(location) {
          case "Worldwide":
            return 1;
          case "United Kingdom":
            return 2;
          case "United States":
            return 3;
          case "London, United Kingdom":
            return 4;
          case "Washington, United States":
            return 5;
        }
      case "Yahoo":
        switch(location) {
          case "United Kingdom":
            return 6;
          case "United States":
            return 7;
        }
      case "Google":
        switch(location) {
          case "United Kingdom":
            return 8;
          case "United States":
            return 9;
        }
      default:
        return 0;
    }
  }

  function findTopic(label) {
    // for now this is the default, no topic detection 
    return label;
  } 

  // Finds (and possibly interpolates) the value for the specified year.
  function interpolateValues(values, year) {
    var i = bisect.left(values, year, 0, values.length - 1),
        a = values[i];
    if (i > 0) {
      var b = values[i - 1],
          t = (year - a[0]) / (b[0] - a[0]);
      return a[1] * (1 - t) + b[1] * t;
    }
    return a[1];
  }
});
