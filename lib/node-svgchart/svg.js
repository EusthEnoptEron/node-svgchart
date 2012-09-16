/**
 * Adds VERY basic SVG support to jsdom's simulated browser environment.
 * Font information is taken from metrics.json -- so for new fonts, put
 * them into ../fonts and run build_metrics.php.
 */


//Load libs
var fs = require("fs")
	, _  = require("underscore")
	, execSync = require("exec-sync");
		 
/*
//Fetch font data
var fontData = fs.readFileSync(__dirname + "/../metrics.json");
				fontData = eval('('+fontData+')');
 */
var fontCache = {};

/*##############
 *# FUNCTIONS
 *##############*/

var metricsRegex = /\s*(.+?):\s*(.*?)[;:]/g;

/**
 * [getTextMetrics description]
 * @param  {string} text     Text to be measured.
 * @param  {string} font     Font face.
 * @param  {int}    fontSize Font size. Probably points, but pixels should work well enough, too.
 * @param  {object} styles   Object with style options. Not implemented yet.
 * @return {object}          An object that contains the font metrics of the text.
 *                           You will want to access the properties "width" and "height."
 * @todo Implement styles.
 */
var getTextMetrics = function(text, font, fontSize, styles) {

	//Normalize values.
	text     = text || '';
	font     = font || "Arial";
	fontSize = fontSize || 12;
	

	if(!fontCache[font])
		fontCache[font] = {};
	if(!fontCache[font][fontSize])
		fontCache[font][fontSize] = {};
	if(fontCache[font][fontSize][text]) {
		return fontCache[font][fontSize][text];
	}

	//Make command
	var command = "convert xc: -font '"
					+ font
				   + "' -pointsize "
				    + fontSize
				   + " -debug annotate -annotate 0 '"
				    + text
				   + "' null: 2>&1 | grep Metrics: | fmt -w80";
	
	var metricsRaw = execSync(command)
	, metrics = {}
	, m = null;
	
	//Remove unneeded information
	metricsRaw = metricsRaw.replace(/^\s*Metrics: /, '')
						   .replace(text, '');

	//Convert string > object
	while(m = metricsRegex.exec(metricsRaw)) {
		metrics[m[1]] = isNaN(m[2]) 
						? m[2]
						: m[2] * 1;
	}
	fontCache[font][fontSize][text] = metrics;
	// console.log("(" + font  + "@"+fontSize+") " + text + " : " + metrics.width);
	// console.log(command);
	return metrics;
}

/**
 * Get width of the text of an element. Font, font size, etc. will be determined from its css styles
 */
var getTextMetricsByElement = function(el, text) {
	text = text || el.textContent;

	//No text at all?
	if(!text) return 0;

	//console.log(el.counter);
	//console.log("    " + el.childNodes[0].nodeName);
	var font =  el.getAttribute("font-family");
	var fontSize = el.getAttribute("font-size");
	var fontWeight = el.getAttribute("font-weight"); 

	if(el.getAttribute("font")) {
		var f = el.getAttribute("font");
		fontSize = f.replace(/^.*?(\d+?)px.*$/, "$1");
		font     = f.replace(/^.*?([A-Z-]{3,}).*$/i, "$1");

		if(font) {
			el.setAttribute("font-family", font);
			el.setAttribute("font-size", fontSize);
		}
	}

	return getTextMetrics(text, font, fontSize, {} );
};


/**
 * Simulate the SVGRect object.
 */
var SVGRect = function (el) {

	this.x = el.getAttribute("x") * 1 || 0;
	this.y = el.getAttribute("y") * 1 || 0;

	//el.test();
	if(el.tagName == 'TEXT') {

		var metrics = getTextMetricsByElement(el);
		this.width = metrics.width;
		this.height = metrics.height
		this.y -= this.height;
		switch(el.getAttribute("text-anchor")) {
			case 'middle':
				this.x += metrics.width / 2;
				break;
		}
	}
}

	

/**
 * Assemble a minimal subset of the SVG specs 
 */
var svgEl = {
	getBBox: function() {
		return new SVGRect(this);
	},
	
	getNumberOfChars: function() {
		return this.textContent ? this.textContent.length : 0;
	},
	
	getComputedTextLength: function() {
		return this.getBBox().width;
	},
	
	getSubStringLength: function(charnum, nchars) {
		return this.textContent 
			? getTextMetricsByElement(this, this.textContent.substr(charnum, nchars)).width
			: 0
	},
	
	getExtentOfChar: function(charnum) {
		var metrics = getTextMetricsByElement(this, this.textContent.substr(charnum, 1));
		return {
			width: metrics.width
			, height: metrics.height
		};
	},
	createSVGMatrix: function() {
		return {};	
	},
	setAttributeNS: function(ns, name, value) {
		this.setAttribute(name, value);
	}
};

var i = 0;
//Regex to find a font family
var familyRegex = new RegExp(/font-?family:([^;]*)/i);
//Regex to find a font size
var sizeRegex = new RegExp(/font-?size:([^;]*)/i);


var els = {};

/**
 * Applies our SVG patch to a jsdom-generated window object
 */
exports.patch = function(window) {
	//Act as though we implemented the SVG specs
	window.SVGAngle = true;
	
	//Simulate createElementNS() which is used to create SVG nodes
	window.document.createElementNS = function(ns, name) {
		//In fact, we create an element the same way as always...
		var el = window.document.createElement(name);

		//...but we extend the object with the bundle of SVG functions we have defined.
		_.extend(el, svgEl);
		
		//Set some dummy values to make AnyChart happy
		el.clientX = 0;
		el.clientY = 0;

		el._setAttribute = el.setAttribute;
		//the original setAttribute is somewhat buggy, therefore we have to make some adjustments
		el.setAttribute = function(attr, val) {

			//Bugfix for AnyChart v6.0 -- it requires you to have clientWidth and Height set.
			if(name == 'svg') {
				if(attr == 'width') {
					this.clientWidth = val;
				}
				if(attr == 'height') {
					this.clientHeight = val;
				}
			}
		
			
			this._setAttribute(attr, val);
		}
		return el;
	};
	
	return window;
};

exports.clean = function(svg) {

	/*##########################
	*# XML SANITATION
	*########################*/	
	//# Step 1, pull up weeds using jQuery
	// var svgEl = $container.children('svg');
	// svgEl.find("[visibility=hidden]").remove();
	
	//Activate this if you want to have correct clipping (but note that labels will be cut off when they're outside the borders)
	/*//Puts the defs to the right place
	var defs = svgEl.find("defs:first");
	svgEl.find("clippath").appendTo(defs);*/
	

	//# Step 2, correct some tags using RegEx
	var svg = svg.replace(/fill: ;/g, '');
					
	return svg;
}