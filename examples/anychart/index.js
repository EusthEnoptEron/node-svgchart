var chart = require("../lib/node-svgchart")
	,fs   = require("fs");


fs.readDir('xml', function(err, files) {
	if(err) {
		console.log("Something went wrong.", err);
		return;
	}
	var chartData;

	chart
		.require(["AnyChart.js", "AnyChartHTML5.js"])
		.setup(function() {
			window.AnyChart.renderingType = window.anychart.RenderingType.SVG_ONLY;
		 	var chart = new window.AnyChart();
			//Open XML file
			chart.setData(chartData);
			chart.write('chart');
		})
		.on("svg", function(e) {
			fs.writeFile("svg/" + e.job + ".svg", e.svg);
		})
		.on("image", function(e) {
			e.stream.pipe(fs.createWriteStream("png/"+e.job+".png"));
		});

	files.forEach(function(file) {
		fs.readFile("xml/" + file, function() {
			chart.create(file.replace(/\.\w+$/, '')
						, {width: 500});
		});
	});
	


});