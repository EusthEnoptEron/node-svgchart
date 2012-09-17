var chart = require("../../lib/node-svgchart")
,fs   = require("fs");


var serie1 = [31, 5, 1, +5, 15, 33, 20, 25, 1, 12, 25, +3];
var serie2 = [18, +1, +7, 17, 15, 21, 1, 25, 3, 21, 16, 4];
var serie3 = [18, -1, -9, 17, 15, 21, 1, 25, 3, 21, 16, 4];
var serie5 = [null, 4, null, null, 17, 15, -2, null, 3, 7, null, -2];
var long_months =
['January', 'February', 'March', 'April', 'May', 'June',
'July', 'August', 'September', 'October', 'November', 'December'
]
;
Array.prototype.rotate = function( n ) {
	this.unshift.apply( this, this.splice( n, this.length ) )
	return this;
}

var months = long_months.map( function( month ) {
	return month.substring( 0, 3 );
});

var min_max = min = max = serie4 = null;


chart
.require(["lib/raphael-2.0.1.js", "lib/ico.js"])
.on("svg", function(e) {
	fs.writeFile("svg/" + e.job + ".svg", e.svg);
})
.on("image", function(e) {
	e.stream.pipe(fs.createWriteStream("png/"+e.job+".png"));
})
.setup(function(e, callback) {
	this.document.getElementById("chart").width = 480;
	this.document.getElementById("chart").height = 260;
	// Make two dependent graphs on a line sharing the same value labels minimum and maximum
	
	serie4 = this.Ico.moving_average( serie3, 5, { previous_values: serie1 }  ); // 5 months moving average
	min_max = this.Ico.series_min_max( [serie1, serie2, serie3, serie4, serie5] );
	min = min_max[0];
	max = min_max[1];
	var labels = {
		values: months
		, long_values: long_months
		, add_padding: false
		, grid: false
	};




	var g10 = new this.Ico.LineGraph( "chart",
		[serie1, serie2, serie5],
		{   min: min, max: max
			, font_size: 12
			, labels: labels
			, series_names: ['This Year', 'Last Year', 'Intermitent']
			, value_labels: { add_padding: false }
			, units: '$', units_position: 0
			, x_padding_right: 15
			, colors: ['#228899', '#339933', '#CCC']
			, curve_amount: 10
			, grid: true
		}
		);
	callback();
})
.create("line", {width: 480})
.setup(function(e, callback) {

	var start_month = ( new Date ).getMonth() + 1;
	months.rotate( start_month ); // set current month as last month
	long_months.rotate( start_month )

	var every_other_month = months.map( function( m, i ) { if ( i % 2 ) return m } );

	console.log(months);
	new this.Ico.BarGraph( "chart",
		[ [31, 5, 1, -5, 15, 33, 20, 25, 1, 12, 25, -3],
		[18, -1, -7, 17, 15, 21, 1, 25, 3, 21, 16, 4]
		],
		{   font_size: 16
			, labels: months
			, bars_overlap: 2/3
			, font: {
				'font-size': 16,
				'fill' : '#000',
				stroke: 'none'
			}
			, colors: ['#228899', '#F85']
			, background: { color: '#ccf', corners: 5 }
			, meanline: true
			, grid: true
		}
		);

	callback();
})
.create("bar", {width: 480});
