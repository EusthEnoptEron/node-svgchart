var html = require("jsdom").level(3, "html");
var define = require("jsdom/lib/jsdom/level2/html").define;



//Also contains definition of SVGLocatable  and SVGTransformable
define("SVGElement", {
	proto: {
		getCTM: function() {
			var matrices = [];
			var match = null;
			var transforms = this.transform.split(")");

			transforms.forEach(function(transform) {
				transform += ')';

				//Translation
				if(match = transform.match(/translate\(\s*([\d-.]+)(?:[\s,]+([\d-.]+))?\s*\)/)) {
					matrices.push(
						new SVGMatrix(
							[1, 0, match[1]     ],
							[0, 1, match[2] || 0],
							[0, 0, 1            ]
						)
					);
				}

				//Scaling 
				else if(match = transform.match(/scale\(\s*([\d-.]+)(?:[\s,]+([\d-.]+))?\s*\)/)) {
					matrices.push(
						new SVGMatrix(
							[match[1], 0                   , 0],
							[0       , match[2] || match[1], 0],
							[0       , 0                   , 1]
						)
					);
				}

				//Rotation
				else if(match = transform.match(/rotate\(\s*([\d-.]+)(?:[\s,]+([\d-.]+)[\s,]+([\d-.]))?\s*\)/)) {
					if(match[2]) {
						matrices.push(
							new SVGMatrix(
								[1, 0, match[2]],
								[0, 1, match[3]],
								[0, 0, 1       ]
							)
						);
					}
					match[1] = match[1] * Math.PI / 180;
					matrices.push(
						new SVGMatrix(
							[Math.cos(match[1]), -Math.sin(match[1]), 0],
							[Math.sin(match[1]), Math.cos(match[1]) , 0],
							[0                 , 0                  , 1]
						)

					);

					if(match[2]) {
						matrices.push(
							new SVGMatrix(
								[1, 0, -match[2]],
								[0, 1, -match[3]],
								[0, 0, 1       ]
							)
						);
					}
				}

				//Skew X
				else if(match = transform.match(/skewX\(\s*([\d-.]+)\s*\)/)) {
					match[1] = match[1] * Math.PI / 180;
					matrices.push(
						new SVGMatrix(
							[1, Math.tan(match[1]), 0],
							[0, 1                 , 0],
							[0, 0                 , 1]
						)
					);
				}


				//Skew Y
				else if(match = transform.match(/skewY\(\s*([\d-.]+)\s*\)/)) {
					match[1] = match[1] * Math.PI / 180;
					matrices.push(
						new SVGMatrix(
							[1, 0                 , 0],
							[Math.tan(match[1]), 1, 0],
							[0, 0                 , 1]
						)
					);
				}


			});

			var matrix = matrices.shift();
			matrices.forEach(function(m) {
				matrix = matrix.multiply(m);
			});

			if(!matrix) {
				matrix = new SVGMatrix([1,0,0],
									   [0,1,0],
									   [0,0,1]);
			}
			return matrix;
		},
		getScreenCTM: function() {

		},
		getTransformToElement: function(target) {

		},
		getBBox: function() {
			return new SVGRect(0,0,0,0);
		}

	},
	parentClass: html.Element,
	attributes: [
		'transform'
	]
});


var SVGRect = html.SVGRect = function(x,y,width,height) {
	this._x = x;
	this._y = y;
	this._width = width;
	this._height = height;
};


html.SVGRect.prototype = {
	get x() {
		return this._x;
	},
	get y() {
		return this._y;
	},
	get width() {
		return this._width;
	},
	get height() {
		return this._height;
	},
	toString: function() {
		return '{'+this.x+', '+this.y+', '+this.width+', '+this.height+'}';
	},
	get editable() {
		return {x: this.x, y: this.y, width: this.width, height: this.height};
	}
};

var SVGMatrix = html.SVGMatrix = function(r1, r2, r3) {
	this.push(r1,r2,r3);
}


SVGMatrix.prototype = Object.create(new Array(), {
	a: { 
		get: function() {
			return +this[0][0];
		}
	},
	b: {
		get: function() {
			return +this[1][0];
		}
	},
	c: {
		get: function() {
			return +this[0][1];
		}
	},
	d: {
		get: function() {
			return +this[1][1];
		}
	},
	e: {
		get: function() {
			return +this[0][2];
		}
	},
	f: {
		get: function() {
			return +this[1][2];
		}
	}
});

SVGMatrix.prototype.multiply = function (matrix) {
	var z = new SVGMatrix(
		[0,0,0],
		[0,0,0],
		[0,0,0]
	);

	//For-Each row
	for(var i = 0; i < z.length; i++) {
		for(var j = 0; j < z[i].length; j++) {
			z[i][j] = this[i][0] * matrix[0][j] 
					+ this[i][1] * matrix[1][j]
					+ this[i][2] * matrix[2][j];
		}
	};

	return z;
};



define("SVGRectElement", {
	tagName: "RECT",
	parentClass: html.SVGElement,
	proto: {
		getBBox: function() {
			return new SVGRect(this.x, this.y, this.width, this.height);
		}
	},
	attributes: [
		{prop: 'x', type: 'long'}
		,{prop: 'y', type: 'long'}
		,{prop: 'width', type: 'long'}
		,{prop: 'height', type: 'long'}
		,{prop: 'rx', type: 'long'}
		,{prop: 'ry', type: 'long'}
	]
});


define("SVGCircleElement", {
	tagName: "CIRCLE",
	parentClass: html.SVGElement,
	proto: {
		getBBox: function() {
			return new SVGRect(this.cx - this.r, 
							   this.cy - this.r,
							   this.r * 2,
							   this.r * 2);
		}
	},
	attributes: [
		{prop:'cx', type: 'long'}
		,{prop:'cy', type: 'long'}
		,{prop:'r', type: 'long'}
	]
});



define("SVGEllipseElement", {
	tagName: "ELLIPSE",
	parentClass: html.SVGElement,
	proto: {
		getBBox: function() {
			return new SVGRect(this.cx - this.r.x, 
							   this.cy - this.r.y,
							   this.r.x * 2,
							   this.r.y * 2);
		}
	},
	attributes: [
		{prop: 'cx', type: 'long'}
		,{prop: 'cy', type: 'long'}
		,{prop: 'rx', type: 'long'}
		,{prop: 'ry', type: 'long'}
	]
});


define("SVGLineElement", {
	tagName: 'LINE',
	parentClass: html.SVGElement,
	proto: {
		getBBox: function() {
			return new SVGRect(
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
	]
});

define("SVGSVGElement", {
	tagName: 'G',
	parentClass: html.SVGElement,
	proto: {
		getBBox: function() {
			//Okay, this one is a bit tricky.
			var box = {x: 0xFFFF, y: 0xFFFF, width: 0, height: 0};
			var i = 0;
			this.childNodes.forEach(function(node) {
				if(node.getBBox) {
					i++;
					var cbox = node.getBBox();
					var cmat = node.getCTM();

					//Apply affine transformations.
					var x = cbox.x * cmat.a
						  + cbox.y * cmat.c
						  + cmat.e;

					var y = cbox.x * cmat.b
						  + cbox.y * cmat.d
						  + cmat.f;

					var width =  cbox.width * cmat.a
						 	   + cbox.height * cmat.c;
					var height =  cbox.width * cmat.b
						 	   + cbox.height * cmat.d;

					box.x = Math.min(box.x, x);
					box.y = Math.min(box.x, y);
					box.width  = Math.max(Math.abs(box.width - box.x),  width);
					box.height = Math.max(Math.abs(box.height - box.y), height);
				}
			});
			if(!i) {
				box.x = 0;
				box.y = 0;
			}
			return new SVGRect(box.x, box.y, box.width, box.height);
		}
	}
});

exports.html = html;