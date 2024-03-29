var GCMS = GCMS || {} ;

/**
 * GCMS version
 */
GCMS.version = "1.0.0" ;

/**
 * Loader for the non minified version
 */
(function() {
	
	/**
	 * The list of all the JS files
	 */
	var jsFiles = [
		'OpenLayers-patch.js',
		
		'GCMS/guid.js',
		
		'GCMS/Util.js',
		'GCMS/SimpleGeocoder.js',
		
		'GCMS/Control.js',
		'GCMS/Control/DeleteFeature.js',
		
		'GCMS/Layer.js',
		'GCMS/Layer/BDUni.js',
		'GCMS/Layer/VectorLayer.js'
	];
	
	/**
	 * Get current script location
	 */
	function getScriptLocation(){
		var scripts= document.getElementsByTagName('script');
		var path= scripts[scripts.length-1].src.split('?')[0]; // remove any ?query
		var location= path.split('/').slice(0, -1).join('/')+'/';
		return location ;
	}
	
	/**
	 * Load scripts is GCMS is not minimified
	 */
	if ( ! GCMS.minimified ){
		var scriptLocation = getScriptLocation() ;
		var scriptTags = new Array(jsFiles.length);
		var host = scriptLocation + "/";
		for (var i=0, len=jsFiles.length; i<len; i++) {
			scriptTags[i] = "<script src='" + host + jsFiles[i] + "'></script>";
		}
		if (scriptTags.length > 0) {
			document.write(scriptTags.join(""));
		}
	}
})() ;


