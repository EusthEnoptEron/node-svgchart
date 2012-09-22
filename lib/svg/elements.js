var core = require("./index").core
  , execSync = require("exec-sync");
require("./interfaces");


var namespace = 'http://www.w3.org/2000/svg';


core.Document.prototype._elementBuildersNS = {};
core.Document.prototype._elementBuildersNS[namespace] = {};


core.Document.prototype.createElementNS = function(namespaceURI, qualifiedName) {
	var parts   = qualifiedName.split(':'),
	lower   = qualifiedName.toLowerCase(),
	element, prefix;

	if (parts.length > 1 && !namespaceURI) {
		throw new core.DOMException(core.NAMESPACE_ERR);
	}

	if(this._elementBuildersNS[namespaceURI][lower]) {
		element = (this._elementBuildersNS[namespaceURI][lower])(this, qualifiedName);
	} else {
		element = this.createElement(qualifiedName);
	}

	element._created = false;

	element._namespaceURI = namespaceURI;
	element._nodeName = qualifiedName;
	element._localName = parts.pop();

	if (parts.length > 0) {
		prefix = parts.pop();
		element.prefix = prefix;
	}

	element._created = true;
	return element;
}

function define(elementClass, def) {
	var tagName = def.tagName,
	tagNames = def.tagNames || (tagName? [tagName] : []),
	parentClass = def.parentClass || core.HTMLElement,
	attrs = def.attributes || [],
	proto = def.proto || {};

	var elem = core[elementClass] = function(document, name) {
		parentClass.call(this, document, name || tagName.toUpperCase());
		if (elem._init) {
			elem._init.call(this);
		}
	};
	elem._init = def.init;

	elem.prototype = proto;
	elem.prototype.__proto__ = parentClass.prototype;

	attrs.forEach(function(n) {
		var prop = n.prop || n,
		attr = n.attr || prop.toLowerCase();

		if (!n.prop || n.read !== false) {
			elem.prototype.__defineGetter__(prop, function() {
				var s = this.getAttribute(attr);
				if (n.type && n.type === 'boolean') {
					return !!s;
				}
				if (n.type && n.type === 'long') {
					return +s;
				}
				if (n.normalize) {
					return n.normalize(s);
				}
				return s;
			});
		}

		if (!n.prop || n.write !== false) {
			elem.prototype.__defineSetter__(prop, function(val) {
				if (!val) {
					this.removeAttribute(attr);
				}
				else {
					var s = val.toString();
					if (n.normalize) {
						s = n.normalize(s);
					}
					if(n.type && core[n.type]) {
						s = new core[n.type](val);	
					}

					this.setAttribute(attr, s);
				}
			});
		}
	});

	var creation = function(doc, s) {
		var el = new elem(doc, s);
		return el;
	};
	tagNames.forEach(function(tag) {
		var ns = def.namespace || [''];

		ns.forEach(function(n) {
			if(n) {
				core.Document.prototype._elementBuilders[tag.toLowerCase()] = creation;
			} else {
				core.Document.prototype._elementBuildersNS[namespace][tag.toLowerCase()] = creation;
			}

		});

	});
}


var originalSetAttribute = core.Element.prototype.setAttribute;
//http://www.w3.org/2000/svg

//Also contains definition of SVGLocatable  and SVGTransformable
define("SVGElement", {
	proto: {
		get nodeName() {
			//Return the case-senstive string.
			return this._nodeName;
		},
		/**
		 * [getCTM description]
		 * @return {core.SVGMatrix} [description]
		 */
		 getCTM: function() {
			var matrices = [];
			var match = null;
			var transforms = this.transform.split(")");
			var matrix = new core.SVGMatrix([1,0,0],
				[0,1,0],
				[0,0,1])


			transforms.forEach(function(transform) {
				transform += ')';

				//Translation
				if(match = transform.match(/translate\(\s*([\d-.]+)(?:[\s,]+([\d-.]+))?\s*\)/)) {
					matrix = matrix.translate(match[1], match[2] || 0);
				}

				//Scaling 
				else if(match = transform.match(/scale\(\s*([\d-.]+)(?:[\s,]+([\d-.]+))?\s*\)/)) {
					matrix = matrix.multiply(
						new core.SVGMatrix(
							[match[1], 0                   , 0],
							[0       , match[2] || match[1], 0],
							[0       , 0                   , 1]
							)
						);
				}

				//Rotation
				else if(match = transform.match(/rotate\(\s*([\d-.]+)(?:[\s,]+([\d-.]+)[\s,]+([\d-.]))?\s*\)/)) {
					//Apply a translate 
					if(match[2]) {
						matrix = matrix.translate(+match[2], +match[3])
						.rotate(+match[1])
						.translate(-match[2], -match[3]);
					} else {
						matrix.rotate(+match[1]);
					}
				}

				//Skew X
				else if(match = transform.match(/skewX\(\s*([\d-.]+)\s*\)/)) {
					match[1] = match[1] * Math.PI / 180;
					matrix = matrix.multiply(
						new core.SVGMatrix(
							[1, Math.tan(match[1]), 0],
							[0, 1                 , 0],
							[0, 0                 , 1]
							)
						);
				}


				//Skew Y
				else if(match = transform.match(/skewY\(\s*([\d-.]+)\s*\)/)) {
					match[1] = match[1] * Math.PI / 180;
					matrix = matrix.multiply(
						new SVGMatrix(
							[1, 0                 , 0],
							[Math.tan(match[1]), 1, 0],
							[0, 0                 , 1]
							)
						);
				}

			});

			return matrix;
		},
		/**
		 * Returns the transformation matrix from current user units to the initial viewport coordinate system
		 * @return {SVGMatrix} [description]
		 */
		 getScreenCTM: function() {

		 },
		/**
		 * [getTransformToElement description]
		 * @param  {[type]} target [description]
		 * @return {[type]}        [description]
		 */
		 getTransformToElement: function(target) {

		 },
		/**
		 * Returns the bounding box of the element.
		 * @return {SVGRect} [description]
		 */
		 getBBox: function() {
			return new core.SVGRect(0,0,0,0);
		},
		/**
		 * Returns the bounding box of the element in screen coordinate space
		 * @return {SVGRect} [description]
		 */
		 getScreenBBox: function() {

		 },
		 setAttribute: function(attr, val) {
		 	if(val !== '') {
		 		originalSetAttribute.call(this, attr, val);
		 	} else {
		 		this.removeAttribute();
		 	}
		 },

		// Add default event behavior (click link to navigate, click button to submit
		// form, etc). We start by wrapping dispatchEvent so we can forward events to
		// the element's _eventDefault function (only events that did not incur
		// preventDefault).
		dispatchEvent : function (event) {
			var outcome = core.Node.prototype.dispatchEvent.call(this, event)

			if (!event._preventDefault     &&
				event.target._eventDefaults[event.type] &&
				typeof event.target._eventDefaults[event.type] === 'function')
			{
				event.target._eventDefaults[event.type](event)
			}
			return outcome;
		},
		_eventDefaults : {}
	},
	parentClass: core.HTMLElement,
	attributes: [
		'transform',
		'id',
		'title',
		'lang',
		'dir',
		{prop: 'className', attr: 'class', normalize: function(s) { return s || ''; }}
	]
});


define("SVGShapeElement", {
	parentClass: core.SVGElement,
	attributes: [
		{prop: 'stroke-width', type: "long"}
	]
});

define("SVGRectElement", {
	tagName: "RECT",
	parentClass: core.SVGShapeElement,
	proto: {
		getBBox: function() {
			return new core.SVGRect(this.x, this.y, this.width, this.height);
		}
	},
	attributes: [
	{prop: 'x', type: 'long'}
	,{prop: 'y', type: 'long'}
	,{prop: 'width', type: 'long'}
	,{prop: 'height', type: 'long'}
	,{prop: 'rx', type: 'long'}
	,{prop: 'ry', type: 'long'}
	],
	namespace: ['', namespace]
});


define("SVGCircleElement", {
	tagName: "CIRCLE",
	parentClass: core.SVGShapeElement,
	proto: {
		getBBox: function() {
			return new core.SVGRect(this.cx - this.r, 
				this.cy - this.r,
				this.r * 2,
				this.r * 2);
		}
	},
	attributes: [
	{prop:'cx', type: 'long'}
	,{prop:'cy', type: 'long'}
	,{prop:'r', type: 'long'}
	],
	namespace: ['', namespace]
});



define("SVGEllipseElement", {
	tagName: "ELLIPSE",
	parentClass: core.SVGShapeElement,
	proto: {
		getBBox: function() {
			return new core.SVGRect(this.cx - this.rx, 
				this.cy - this.ry,
				this.rx * 2,
				this.ry * 2);
		}
	},
	attributes: [
	{prop: 'cx', type: 'long'}
	,{prop: 'cy', type: 'long'}
	,{prop: 'rx', type: 'long'}
	,{prop: 'ry', type: 'long'}
	],
	namespace: ['', namespace]
});


define("SVGLineElement", {
	tagName: 'LINE',
	parentClass: core.SVGShapeElement,
	proto: {
		getBBox: function() {
			return new core.SVGRect(
				Math.min(this.x1, this.x2),
				Math.min(this.y1, this.y2),

				//Determine differences
				Math.abs(this.x2 - this.x1),
				Math.abs(this.y2 - this.y1)
				);
		}
	},
	attributes: [
	{prop: 'x1', type: 'long'}
	,{prop: 'y1', type: 'long'}
	,{prop: 'x2', type: 'long'}
	,{prop: 'y2', type: 'long'}
	],
	namespace: ['', namespace]
});

function genericGetBBox() {
	//Okay, this one is a bit tricky.

	//Set up a default bbox
	var box = {x: 0xFFFF, y: 0xFFFF, width: 0, height: 0, x2: 0, y2: 0};
	var i = 0;
	var self = this;
	this.childNodes.forEach(function(node) {
		if(node.getBBox) {
			i++;

			//Get BBox and transformation matrix
			var cbox = node.getBBox();
			var cmat = node.getCTM();

			//Apply transformations.
			function calc(tx, ty) {
				return {
					x: tx * cmat.a
					 + ty * cmat.c
					 + cmat.e,
					y: tx * cmat.b
					 + ty * cmat.d
					 + cmat.f 
				};
			}

			var p = [
				calc(cbox.x, cbox.y),
				calc(cbox.x + cbox.width, cbox.y),
				calc(cbox.x + cbox.width, cbox.y + cbox.height),
				calc(cbox.x, cbox.y + cbox.height),
			];


			//Find smallest coords
			var x1 = Math.min(p[0].x, p[1].x, p[2].x, p[3].x);
			var y1 = Math.min(p[0].y, p[1].y, p[2].y, p[3].y);
			//Find largest coords
			var x2 = Math.max(p[0].x, p[1].x, p[2].x, p[3].x);
			var y2 = Math.max(p[0].y, p[1].y, p[2].y, p[3].y);

			//Set new boundaries
			box.x = Math.min(box.x, x1);
			box.y = Math.min(box.y, y1);

			box.x2 =Math.max(box.x2, x2);
			box.y2 =Math.max(box.y2, y2);
		}
	});
	if(!i) {
		box.x = 0;
		box.y = 0;
	}
	return new core.SVGRect(box.x, box.y, Math.abs(box.x2 - box.x), Math.abs(box.y2 - box.y));

}

define("SVGGElement", {
	tagName: 'G',
	parentClass: core.SVGElement,
	proto: {
		getBBox: genericGetBBox
	},
	namespace: ['', namespace],
	attributes: ['debug']
});

define("SVGDefsElement", {
	tagName: 'DEFS',
	parentClass: core.SVGGElement,
	namespace: ['', namespace]
});

define("SVGSVGElement", {
	tagName: 'SVG',
	parentClass: core.SVGGElement,
	proto: {
		createSVGMatrix: function() {
			return new core.SVGMatrix([0,0,0],[0,0,0],[0,0,0]);
		},
		createSVGRect: function() {
			return new core.SVGRect(0,0,0,0);
		}
	},
	namespace: ['', namespace]
});


define("SVGUseElement", {
	tagName: 'USE',
	parentClass: core.SVGGElement,
	proto: {
		getBBox: function() {
			//TODO: implement
		}
	},
	namespace: ['', namespace],
	attributes: [
		'x',
		'y',
		'width',
		'height',
		'viewBox',
		'preserveAspectRatio',
		'zoomAndPan',
		'version',
		'baseProfile',
		'contentScriptType',
		'contentStyleType'
	]
});

define("SVGAElement", {
	tagName: "A",
	parentClass: core.SVGGElement,
	namespace: [namespace],
	attributes: ['xlink:href', 'xlink:show', 'xlink:actuate', 'target']
});


//TODO: implement
//http://www.w3.org/TR/SVG11/masking.html#ClipPathElement
define("SVGClipPathElement", {
	tagName: 'CLIPPATH',
	parentClass: core.SVGGElement,
	namespace: ['', namespace]
});

//TODO: implement
//http://www.w3.org/TR/SVG11/struct.html#SwitchElement
define("SVGSwitchElement", {
	tagName: 'SWITCH',
	parentClass: core.SVGGElement,
	namespace: ['', namespace]
});

//TODO: implement
//http://www.w3.org/TR/SVG11/struct.html#ImageElement
define("SVGImageElement", {
	tagName: 'IMAGE',
	parentClass: core.SVGElement,
	namespace: ['', namespace]
});


var metricsCache = {};
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
function getTextMetrics(text, opt) {
	//Normalize values.
	text     = text || '';
	font     = opt.font || "Arial";
	fontSize = opt.size || 12;
	
	if(!text) {
		return {width: 0, height: 0};
	}

	if(!metricsCache[font])
		metricsCache[font] = {};
	if(!metricsCache[font][fontSize])
		metricsCache[font][fontSize] = {};
	if(metricsCache[font][fontSize][text]) {
		return metricsCache[font][fontSize][text];
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
	metricsCache[font][fontSize][text] = metrics;
	// console.log("(" + font  + "@"+fontSize+") " + text + " : " + metrics.width);
	// console.log(command);
	return metrics;

}

define("SVGTextElement", {
	tagNames: ["TEXT", "TSPAN"],
	parentClass: core.SVGShapeElement,
	namespace: ['', namespace],
	proto: {
		getAttribute: function(prop) {
			if((prop == 'x' || prop == 'y') && this.nodeName == 'tspan' && this.parentNode) {
				if(core.SVGElement.prototype.getAttribute.call(this, prop)
					===
				   this.parentNode.getAttribute(prop)) {
				   	this.removeAttribute(prop);
					return null;
				} else {
					return core.SVGElement.prototype.getAttribute.call(this, prop);
				}
			} else {
				return core.SVGElement.prototype.getAttribute.call(this, prop);
			}
		},
		setAttribute: function(prop, val) {
			if(!isNaN(val)) {
				val = new core.SVGAnimatedLengthList(val);
			} 

			core.SVGElement.prototype.setAttribute.call(this, prop, val);

		},
		getBBox: function() {
			return this.__getBBox(0, this.getNumberOfChars());
		},
		__getBBox: function(charnum, nchars) {
			var text = (this.textContent || '').substr(0, nchars);

			var font =  this.getAttribute("font-family");
			var fontSize = this.getAttribute("font-size");
			var fontWeight = this.getAttribute("font-weight"); 

			if(this.getAttribute("font")) {
				var f = this.getAttribute("font");
				fontSize = f.replace(/^.*?(\d+?)px.*$/, "$1");
				font     = f.replace(/^.*?([A-Z-]{3,}).*$/i, "$1");

				if(font) {
					this.setAttribute("font-family", font);
					this.setAttribute("font-size", fontSize);
				}
			}
			var metrics = getTextMetrics(text, {font: font, size: fontSize});

			var x = this.x;
			var y = this.y;

			y -= (metrics.height + (metrics["underline position"] || 0) );
	
			//Correct bounding box.
			switch(this.getAttribute("text-anchor")) {
				case 'middle':
					x -= metrics.width / 2;
					break;
				case 'end':
					x -= metrics.width;
			}

			this.debug = new core.SVGRect(x, y
									, metrics.width
									, metrics.height).toString();
			return new core.SVGRect(x, y
									, metrics.width
									, metrics.height);

		},

		/**
		 * Returns the total number of characters available for rendering within the current element, 
		 * which includes referenced characters from ‘tref’ reference, regardless of whether they will
		 * be rendered.
		 * @return {[type]} [description]
		 */
		getNumberOfChars: function() {
			return (this.textContent || '').length;
		},
		/**
		 * The total sum of all of the advance values from rendering the specified substring of the characters
		 * @return {[type]} [description]
		 */
		getSubStringLength: function(charnum, nchars) {
			return this.__getBBox(charnum, nchars).width;
		},
		/**
		 * The total sum of all of the advance values from rendering the specified substring of the characters
		 * @return {[type]} [description]
		 */
		getComputedTextLength: function() {
			return this.getBBox().width;
		},
		/**
		 * Returns the current text position before rendering the character in the user 
		 * coordinate system for rendering the glyph(s) that correspond to the specified character
		 * @return {SVGPoint} [description]
		 */
		getStartPositionOfChar: function(charnum) {
			var bbox = this.getBBox();
			var subbox = this.__getBBox(charnum);
			return {
				x: bbox.width - subbox.width,
				y: 0
			};
		},
		/**
		 * Returns the current text position after rendering the character in the user coordinate 
		 * system for rendering the glyph(s) that correspond to the specified character
		 */
		getEndPositionOfChar: function(charnum) {
			var bbox = this.getBBox();
			var subbox = this.__getBBox(charnum);
			return {
				x: (bbox.width - subbox.width) + this.x,
				y: this.y
			};
		},
		/**
		 * Returns a tightest rectangle which defines the minimum and maximum X and Y values in the 
		 * user coordinate system for rendering the glyph(s) that correspond to the specified character
		 * @return {[type]} [description]
		 */
		getExtentOfChar: function(charnum) {
			return this.getBBox();
		},
		/**
		 * Returns the rotation value relative to the current user coordinate system
		 * used to render the glyph(s) corresponding to the specified character. 
		 * @return {[type]} [description]
		 */
		getRotationOfChar: function(charnum) {
			return 0;
		},
		/**
		 * Returns the index of the character whose corresponding glyph cell bounding box contains the specified point.
		 * @return {SVGPoint} [description]
		 * @todo Not inmplemented.
		 */
		getCharNumAtPosition: function(point) {
			return '';
		},
		selectSubString: function(charnum, nchars) {}
	},
	attributes: [
		,{prop:'x', type: 'long'}
		,{prop:'y', type: 'long'}
		,{prop:'dx', type: 'long'}
	    ,{prop:'dy', type: 'long'}
	    , 'debug'
		, 'rotate', 'textLength', 'textAdjust'
	]
});

/**
 * @todo http://www.w3.org/TR/SVG11/paths.html#PathElement
 */
define("SVGPathElement", {
	tagName: 'PATH',
	parentClass: core.SVGShapeElement,
	attributes: [
	'pathLength', 'd'
	]
});

/**
 * @todo http://www.w3.org/TR/SVG11/paths.html#PathElement
 */
define("SVGPolylineElement", {
	tagName: 'POLYLINE',
	parentClass: core.SVGShapeElement,
	attributes: [
	'points'
	]
});

/**
 * @todo http://www.w3.org/TR/SVG11/paths.html#PathElement
 */
define("SVGPolygonElement", {
	tagName: 'POLYGON',
	parentClass: core.SVGShapeElement,
	attributes: [
	'points'
	]
});


