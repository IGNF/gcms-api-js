var GCMS = {} ;


/**
 * Generate a random Global Unique IDdentifier
 * source : <http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript>
 */
GCMS.guid = function(){
	function s4() {
	  return Math.floor((1 + Math.random()) * 0x10000)
	             .toString(16)
	             .substring(1);
	};
	
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
		s4() + '-' + s4() + s4() + s4();
}


/**
 * Chargement des featureType
 *  * 
 * En cas d'échec, appel le callback avec featureTypes à vide
 */
GCMS.loadFeatureTypes = function(urlServer,callback) {
	var loader = {
		onComplete : function(response) {
			var parser = new OpenLayers.Format.JSON();
			var data = response.responseText ;
			
			var featureTypes = {} ;
			if ( data ){
				featureTypes = parser.read(response.responseText);
			}
			if (typeof (callback) == "function"){
				callback( featureTypes );
			}
		},
		onFailure : function() {
			callback( {} );
		}
	};
	OpenLayers.loadURL(urlServer, "", loader, loader.onComplete, loader.onFailure);
	return false;
};

