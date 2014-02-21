(function() {
	var jsFiles = [
		'OpenLayers-patch.js',
		'GCMS.js',
		
		'GCMS/Util.js',
		'GCMS/SimpleGeocoder.js',
		
		'GCMS/Control.js',
		'GCMS/Control/DeleteFeature.js',
		
		'GCMS/Layer.js',
		'GCMS/Layer/BDUni.js',
		'GCMS/Layer/VectorLayer.js'
	];
	
	function getScriptLocation(){
		var scripts= document.getElementsByTagName('script');
		var path= scripts[scripts.length-1].src.split('?')[0]; // remove any ?query
		var location= path.split('/').slice(0, -1).join('/')+'/';
		return location ;
	}
		
	function loadScripts(){
		if ( typeof GCMS === "undefined" ){		
			var scriptTags = new Array(jsFiles.length);
			var host = getScriptLocation() + "/";
			for (var i=0, len=jsFiles.length; i<len; i++) {
				scriptTags[i] = "<script src='" + host + jsFiles[i] + "'></script>";
			}
			if (scriptTags.length > 0) {
				document.write(scriptTags.join(""));
			}
		}
	}
	
	loadScripts() ;
})() ;
