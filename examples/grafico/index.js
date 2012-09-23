var svgc = require("../../lib/node-svgchart")
,fs   = require("fs");

//Using prototype 1.6 because https://github.com/tmpvar/jsdom/issues/445
svgc
.require(["lib/raphael-2.0.1.js", "lib/prototype.js", "lib/grafico.base.js", "lib/grafico.line.js", "lib/grafico.spark.js", "lib/grafico.bar.js"])
.setAutoClean(true)
.setSize(480, 240)
.setSafeMode(true)
.on("svg", function(e) {
	fs.writeFile("svg/" + e.job + ".svg", e.svg);
})
.on("image", function(e) {
	fs.writeFile("png/" + e.job + ".png", e.buffer);
})
.setup(function(e, callback) {
	var streamgraph = new this.Grafico.StreamGraph(this.$('chart'),
	{
	  movie1: this.Array(30, 33, 20, 10,  5,  3,  2,  1,  0,  0,  0,  0,  0,  0,  0,  0),
	  movie2: this.Array(10, 15, 25, 28, 29, 26, 20, 10,  3,  1,  1,  0,  0,  0,  0,  0),
	  movie3: this.Array( 0,  4,  6,  8, 11, 13, 11,  9,  3,  0,  0,  0,  0,  0,  0,  0),
	  movie4: this.Array( 0,  0,  0,  1,  4,  9, 19, 28, 35, 44, 45, 45, 35, 18,  6,  3),
	  movie5: this.Array( 0,  0,  0,  0,  0,  0,  0,  1,  2,  2,  8, 20, 26, 29, 30, 31)
	},
	{
	  stream_line_smoothing: 'simple',
	  stream_smart_insertion: true,
	  stream_label_threshold: 20,
	  datalabels: {
	    movie1: "James Bond",
	    movie2: "Bourne Ultimatum",
	    movie3: "Harry Potter",
	    movie4: "Kill Bill",
	    movie5: "Return of the Mummie"
	  }
	}
	);
	callback();
})
.create("streamgraph", {width: 480})
.setup(function(e, callback) {
	var linegraph3 = new this.Grafico.LineGraph(this.$('chart'),
	{
	  workload:       this.Array(8, 10, 6, 12,7, 6, 9),
	  your_workload:  this.Array(6, 8,  4, 8, 12,6, 2),
	  his_workload:   this.Array(2, 9,  12,7, 8, 9, 8)
	},
	{
	  markers:            "circle",
	  hover_color:        "#000",
	  hover_text_color:   "#fff",
	  draw_hovers:        true,
	  datalabels: {
	    workload:         "My workload",
	    your_workload:    "Your workload",
	    his_workload:     "His workload"
	  }
	});
	callback();
})
.create("line", {width: 480});