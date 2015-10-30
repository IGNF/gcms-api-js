
/**
 * GeoCodeur basique invoquant les services du géoportail
 */
GCMS.SimpleGeocoder = function( apiKey ){
	this.urls = {
		ols : location.protocol+"//wxs.ign.fr/"+apiKey+"/geoportail/ols",
		autocomplete: location.protocol+"//wxs.ign.fr/"+apiKey+"/ols/apis/completion"
	} ;


	this.geocode = function( queryString, callback ){
				
		var xls = '<xls:XLS xmlns:xls="http://www.opengis.net/xls" version="1.2"><xls:RequestHeader sessionID=""/>' ;
		xls    += '<xls:Request methodName="GeocodeRequest" version="1.2" requestID="" maximumResponses="100">' ;
		xls    += '<xls:GeocodeRequest>' ;
		xls    += '	<xls:Address countryCode="StreetAddress">' ;
		xls    += '		<xls:StreetAddress>' ;
		// TODO escape address (caractère XML potentiel dedans)
		xls    += '			<xls:Street>'+queryString+'</xls:Street>' ;
		xls    += '		</xls:StreetAddress>' ;
		xls    += '	<xls:Place type="Municipality"/>' ;
		xls    += '	<xls:PostalCode/>' ;
		xls    += '	</xls:Address>' ;
		xls    += '</xls:GeocodeRequest>' ;
		xls    += '</xls:Request>' ;
		xls    += '</xls:XLS>' ;
		
		$.ajax({
			url: this.urls.ols,
			dataType: "jsonp",
			jsonpCallback: "requestSuccess",
			data: {
				output: 'json',
				xls: xls
			},
			context: this,
			success: function( response ){
				var result = [] ;
				
				var format = new OpenLayers.Format.XLS();
				var output = format.read(response.xml);

				var bodies = output.getBodies() ;
				for ( var i in bodies ){
					var geocodeResponses = bodies[i].getResponseParameters().geocodeResponses;
					for ( var j in geocodeResponses ){
						var geocodedAddresses = geocodeResponses[j].geocodedAddresses ;
						for ( var k in geocodedAddresses ){
							var geocodedAddress = geocodedAddresses[k] ;
							result.push( geocodedAddress ) ;
						}
					}
				}
				
				console.log(result);
				callback( result );
			}
		});
	} ;
	
	this.reverseGeocode = function( lon, lat, callback ){
		
		var xls='<?xml version="1.0" encoding="UTF-8"?>';
		xls    += '<XLS version="1.2"';
		xls    += '  xmlns="http://www.opengis.net/xls"';
		xls    += '  xmlns:gml="http://www.opengis.net/gml"';
		xls    += '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"';
		xls    += '  xsi:schemaLocation="http://www.opengis.net/xls http://schemas.opengis.net/ols/1.2/olsAll.xsd">';
		xls    += '  <RequestHeader/>';
		xls    += '  <Request';
		xls    += '    methodName="ReverseGeocodeRequest"';
		xls    += '    maximumResponses="10"';
		xls    += '    requestID="abc"';
		xls    += '    version="1.2">';
		xls    += '   <ReverseGeocodeRequest>';
		xls    += '    <ReverseGeocodePreference>StreetAddress</ReverseGeocodePreference>';
		xls    += '    <Position>';
		xls    += '     <gml:Point>';
		xls    += '      <gml:pos>'+lat+' '+lon+'</gml:pos>';
		xls    += '     </gml:Point>';
		xls    += '    </Position>';
		xls    += '   </ReverseGeocodeRequest>';
		xls    += '</Request>';
		xls    += '</XLS>';
		
		$.ajax({
			url: this.urls.ols,
			dataType: "jsonp",
			jsonpCallback: "requestSuccess",
			data: {
				output: 'json',
				xls: xls
			},
			context: this,
			success: function( response ){
				var result = [] ;
				
				var format = new OpenLayers.Format.XLS();
				var output = format.read(response.xml);
				var bodies = output.getBodies() ;
				
				for ( var i in bodies ){
					var reverseGeocodedLocations = bodies[i].getResponseParameters().reverseGeocodedLocations;
					for ( var j in reverseGeocodedLocations ){
						var address = reverseGeocodedLocations[j];
						result.push( address ) ;
					}
				}
				callback( result );
			}
		});
		
	} ;
	
	
	this.autocomplete = function( term, callback ){
		$.ajax({
			url : this.urls.autocomplete,
			dataType : "jsonp",
			data : {
            	text : term,
            	terr: 'METROPOLE',
            	type: 'PositionOfInterest',
            	maximumResponses: '10'
            },
            context: this,
			success: function( response ){
				callback(response);
				
			}
		});
	} ;
};

