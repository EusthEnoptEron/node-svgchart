Introduction
============
node-svgchart aims to provide a general interface to generate charts on the server side without any need for an x-server or anything of the like.

It's useful if you want to put dynamic charts on the frontend, yet play with them on the backend. E.g. to create reports, to let users with outdated browsers download it, etc.

Requirements
============
To get it up and running, there are some requirements to fulfill.

* ImageMagick

Compatibility
=============
* AnyChart 6.0.10
* gRaphaël (somewhat)
* ico
* Highcharts (somewhat, be sure to disable animations)

Usage
=====
```javascript
var chart = require("node-svgchart");

chart
    .require("path/to/my/chart/lib.js")
    .setup(function(e, callback) {
    	//Setup chart using your library. Write to #chart.
    	//Note: The global object is still "global", so explicitly access "e.window".
        //IMPORTANT: You have to call the callback to make it continue. 
    })
    .create({
    	//Options that will be passed to rsvg
    	width: 500
    }, function(err, image) {
    	//image is a buffer.
    });
```

API
===

setSafeMode(bool on)
--------------------
Turn safe mode on / off. If safe mode is off, the script code of your libraries will be rewritten to refrain from using "instanceof Array" because of context issues.

If that causes problems, you can disable that behavior. However, you will then have to use "window.Array" to create your arrays.