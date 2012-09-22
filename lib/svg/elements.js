var core = require("./index").core;

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

	ns.validate(qualifiedName, namespaceURI);
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



//http://www.w3.org/2000/svg

//Also contains definition of SVGLocatable  and SVGTransformable
define("SVGElement", {
	proto: {
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

		 }

		},
		parentClass: core.Element,
		attributes: [
		'transform'
		]
	});



define("SVGRectElement", {
	tagName: "RECT",
	parentClass: core.SVGElement,
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
	parentClass: core.SVGElement,
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
	parentClass: core.SVGElement,
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
	parentClass: core.SVGElement,
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

define("SVGSVGElement", {
	tagName: 'G',
	parentClass: core.SVGElement,
	proto: {
		getBBox: function() {
			//Okay, this one is a bit tricky.

			//Set up a default bbox
			var box = {x: 0xFFFF, y: 0xFFFF, width: 0, height: 0, x2: 0, y2: 0};
			var i = 0;


			this.childNodes.forEach(function(node) {
				if(node.getBBox) {
					i++;

					//Get BBox and transformation matrix
					var cbox = node.getBBox();
					var cmat = node.getCTM();

					//Apply transformations.
					var x = cbox.x * cmat.a
					+ cbox.y * cmat.c
					+ cmat.e;

					var y = cbox.x * cmat.b
					+ cbox.y * cmat.d
					+ cmat.f;

					//TODO: Make a proper transformaion
					var x2 =  cbox.width * cmat.a
					+ cbox.height * cmat.c
					+ x;
					var y2 =  cbox.width * cmat.b
					+ cbox.height * cmat.d
					+ y;

					//Set new boundaries
					box.x = Math.min(box.x, x);
					box.y = Math.min(box.y, y);

					box.x2  = Math.max(x2, box.x2);
					box.y2 = Math.max(y2, box.y2);
				}
			});
			if(!i) {
				box.x = 0;
				box.y = 0;
			}
			return new core.SVGRect(box.x, box.y, Math.abs(box.x2 - box.x), Math.abs(box.y2 - box.y));
		}
	},
	namespace: ['', namespace]
});

exports.core = core;