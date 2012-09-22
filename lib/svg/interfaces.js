var core = require("./index").core;


var SVGRect = core.SVGRect = function(x,y,width,height) {
	this._x = x;
	this._y = y;
	this._width = width;
	this._height = height;
};


core.SVGRect.prototype = {
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

var SVGMatrix = core.SVGMatrix = function(r1, r2, r3) {
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
		[1,0,0],
		[0,1,0],
		[0,0,1]
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

SVGMatrix.prototype.translate = function(x, y) {
	return this.multiply(new SVGMatrix(
		[1, 0, x],
		[0, 1, y],
		[0, 0, 1]
		));
}

SVGMatrix.prototype.scale = function(s) {
	return this.multiply(new SVGMatrix(
		[s, 0, 0],
		[0, s, 0],
		[0, 0, 1]
		));
}

SVGMatrix.prototype.rotate = function(r) {
	r = r * Math.PI / 180
	return this.multiply(new SVGMatrix(
		[Math.cos(r), -Math.sin(r), 0],
		[Math.sin(r), Math.cos(r) , 0],
		[0          , 0           , 1]
		));
}
