var chart = require("../../lib/node-svgchart")
,fs   = require("fs");



chart
.require(["lib/amcharts.js"])
.on("svg", function(e) {
	fs.writeFile("svg/" + e.job + ".svg", e.svg);
})
.on("image", function(e) {
	fs.writeFile("png/" + e.job + ".png", e.buffer);
})
.setSize(600, 400)
.setup(function(e, callback) {
	var chart;

	var chartData = [{
		year: 2005,
		income: 23.5
	}, {
		year: 2006,
		income: 26.2
	}, {
		year: 2007,
		income: 30.1
	}, {
		year: 2008,
		income: 29.5
	}, {
		year: 2009,
		income: 24.6
	}];

	var amchart;
	// SERIAL CHART
	amchart = new this.AmCharts.AmSerialChart();
	amchart.dataProvider = chartData;
	amchart.categoryField = "year";
	// this single line makes the chart a bar chart, 
	// try to set it to false - your bars will turn to columns                
	amchart.rotate = true;
	// the following two lines makes chart 3D
	amchart.depth3D = 20;
	amchart.angle = 30;

	// AXES
	// Category
	var categoryAxis = amchart.categoryAxis;
	categoryAxis.gridPosition = "start";
	categoryAxis.axisColor = "#DADADA";
	categoryAxis.fillAlpha = 1;
	categoryAxis.gridAlpha = 0;
	categoryAxis.fillColor = "#FAFAFA";

	// value
	var valueAxis = new this.AmCharts.ValueAxis();
	valueAxis.axisColor = "#DADADA";
	valueAxis.title = "Income in millions, USD";
	valueAxis.gridAlpha = 0.1;
	amchart.addValueAxis(valueAxis);

	// GRAPH
	var graph = new this.AmCharts.AmGraph();
	graph.title = "Income";
	graph.valueField = "income";
	graph.type = "column";
	graph.balloonText = "Income in [[category]]:[[value]]";
	graph.lineAlpha = 0;
	graph.fillColors = "#bf1c25";
	graph.fillAlphas = 1;
	amchart.addGraph(graph);

	// WRITE
	amchart.write("chart");
	callback();
})
.create("bar", {width: 600});