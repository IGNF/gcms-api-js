/**
 * A GCMS Layer extending OpenLayers.Layer.Vector and owning a FeatureType
 */
GCMS.Layer.VectorLayer = OpenLayers.Class(
	OpenLayers.Layer.Vector,
	{
		/**
		 * Object representing the data structure (Set at creation)
		 */
		featureType: null,
		/**
		 * Filter on features (MongoDB syntax)
		 * ex :
		 * 
		 * id == 5454 <=> {"id":"5454"}
		 */
		featureFilter: {},
		/**
		 * Creer le layer
		 */
		initialize : function(featureType, options) {
			var self = this ;
			
			if (!options)
				options = {};

			if (featureType) {
				
				/**
				 * projection
				 */
				var crs = featureType.attributes[featureType.geometryName].crs;
				var srsName  = ( crs != null ) ? crs : "EPSG:4326" ;
				
				featureType.projection = new OpenLayers.Projection(srsName);

				/**
				 * basic options
				 */
				var layerOptions = OpenLayers.Util.extend({
					displayInLayerSwitcher : true,
					minZoomLevel : featureType.minZoomLevel,
					maxZoomLevel : featureType.maxZoomLevel,
					title : featureType.title,
					projection : featureType.projection
				}, options);
				
				if ( featureType.style != null ){
					layerOptions.styleMap = this.createStyleMap( featureType );
				}

				// Options non surchargeables
				if( options.strategies ){
					layerOptions.strategies = options.strategies;
				}
				else{
					layerOptions.strategies = [ 
					     new OpenLayers.Strategy.BBOX({ratio: 1.2,resFactor: 2})
                    ];
				}
				
	
				// Protocol HTTP + gestion des erreurs => ajouter un callback pour recuperer l'erreur
				OpenLayers.Protocol.HTTPErr = OpenLayers.Class(OpenLayers.Protocol.HTTP, 
				{	handleResponse : function(resp, options) 
					{	// Faire ce qu'on a a faire
						OpenLayers.Protocol.HTTP.prototype.handleResponse.apply(this, arguments);
						// Envoyer la reponse au callback
						this.options.callback.call(this.options.scope ? this.options.scope : this, resp.priv.status!=200 || this.format.lastError, resp.priv.status, resp);
					}
				});
				// Gestion des erreurs JSON
				OpenLayers.Format.GeoJSONErr = OpenLayers.Class(OpenLayers.Format.GeoJSON, 
				{	read: function(json, type, filter)
					{	var results = null;
						try 
						{	results = OpenLayers.Format.GeoJSON.prototype.read.apply(this, arguments);
							this.lastError = null;
						} catch(e) 
						{	this.lastError = "JSON";
						}
						return results;
					}
				});

				layerOptions.protocol = new OpenLayers.Protocol.HTTPErr(
						{
							url : featureType.wfs,
							//callbackKey : "callback",
							//callbackPrefix : "callback:",
							format: new OpenLayers.Format.GeoJSONErr(),
							// Gestion des erreurs
							callback : function(error, status, resp) 
								{	// => Fonction onError du layer
									if (self.options.onError) self.options.onError.call (self, error, status, resp);
									else 
									{	// Erreur reseau
										if (error) console.log ('ERREUR : '+error+" ("+status+")");
										// Pas d'erreur => else console.log ("REPONSE : "+resp.features.length);
									}
								},
							params : {
								service : "WFS",
								version : "1.1.0",
								srsName : srsName, // "EPSG:4326"
								request : "GetFeature",
								typeName : featureType.name, // "state"
								outputFormat : "GeoJSON",
								maxFeatures : (options.maxFeatures ? options.maxFeatures : null)
							},
							filterToParams : function(filter,params) { 
								// BBOX serialization
								if (filter.type === OpenLayers.Filter.Spatial.BBOX) {
									params.bbox = filter.value.toArray();
								}
								params.filter = OpenLayers.Format.JSON.prototype.write( self.featureFilter ) ;
								return params;
							}
						});

				OpenLayers.Layer.Vector.prototype.initialize.apply( this, [ featureType.fullName, layerOptions ]);
				this.featureType = featureType ;
				// Cloner la styleMap car on va la modifier
				this.styleMap = this.styleMap.clone();
			} else{
				OpenLayers.Layer.Vector.prototype.initialize.apply( this, [ "inconnu", options ] );
			}
		},
		
		/**
		 * Créé un style à partir du style définit sur le FeatureType
		 */
		createStyleMap: function(featureType){
			var context = {} ;
			
			/* 
			 * allows labelMinZoomLevel
			 */
			if ( featureType.style.label ){
				context.getLabel = function( feature ){
					var featureType = feature.layer.featureType ;
					if ( 
						featureType.style.labelMinZoomLevel == null 
					 || ( feature.layer.map.zoom >= featureType.style.labelMinZoomLevel )
					){
						return OpenLayers.String.format(
							featureType.style.labelName,
							feature.attributes
						);
					}else{
						return "" ;
					}
				} ;
				
				featureType.style.labelName = featureType.style.label ;
				featureType.style.label = "${getLabel}";
			}
			
			return new OpenLayers.StyleMap( 
				new OpenLayers.Style( 
					featureType.style, 
					{context: context} 
				)
			);	
		},		
		
		/**
		 * Renvoie le type de colonne géométrique
		 */
		getGeometryType: function(){
			var geometryAttribute = this.featureType.attributes[ this.featureType.geometryName ] ;
			return geometryAttribute.type ;
		},
		
		/**
		 * Test si la colonne geometrique est une collection 
		 * (MultiPoint, MultiLineString, MultiPolygon, GeometryCollection)
		 */
		hasMultiGeometry: function(){
			var geometryType = this.getGeometryType() ;
			return ( geometryType.indexOf( "Multi" ) !== -1 ) 
			     || ( geometryType == "GeometryCollection" ) ;
		},
		
		/**
		 * Récupérer les modifications sur la couche
		 */
		getSaveActions: function(){
			var actions = [] ;
			for ( var i in this.features ){
				var feature = this.features[i] ;
				if ( feature.state != null ){
					var action = {} ;
					action[ "state" ] = feature.state ;
					action[ "typeName" ]     = this.featureType.name ;
					action["feature"] = this.getFeatureData( feature ) ;
					actions.push( action );
				}
			}
			return actions ;
		},
		
		/**
		 * Récupérer les modifications sur la couche
		 */
		getFeatureData: function(feature){
			var geometryName = this.featureType.geometryName ;
			
			var format = new OpenLayers.Format.WKT(
				{
					internalProjection: this.map.getProjectionObject(),
					externalProjection: this.featureType.projection
				}
			) ;
		
			var featureData = {} ;
			for ( var i in feature.attributes ){
				var attributeValue = feature.attributes[i] ;
				if ( attributeValue === "" ){
					featureData[i] = null ;
				}else{
					featureData[i] = attributeValue ;
				}
			}
			featureData[ geometryName ] = format.write( feature ) ;
			return featureData ;
		},		
		
		/**
		 * Sauvegarder les objets créé, modifié et détruit features 
		 */
		save: function(){
			var actions = this.getSaveActions();
			if ( actions.length == 0 ){
				return ;
			}
			
			var self = this ;
			var request = OpenLayers.Request.POST({
			    url: this.featureType.wfs+"transaction/",
			    data: OpenLayers.Util.getParameterString({"actions":JSON.stringify(actions)}),
			    headers: {
			    	"Content-Type": "application/x-www-form-urlencoded"
			    },
			    callback: function(request){
			    	if ( 200 != request.status ){
			    		alert( request.responseText );
			    	}else{
			    		// ok, refresh
			    		self.refresh( { force: true } );
			    	}
			    }
			});
		},

		/** Modifier le filtre de chargement
		*/
		setFeatureFilter : function (filter, options)
		{	this.featureFilter = {};
			this.addFeatureFilter (filter, options);
		},

		/** Ajouter un filtre de chargement
		*/
		addFeatureFilter : function (filter, options)
		{	
			this.featureFilter = OpenLayers.Util.extend ( this.featureFilter, filter );
			this.refresh({force:true});
		},
			
	   /** 
		* Modifier le style d'affichage
		*/
		setDefaultStyle : function (style, context)
		{	
			var defaultStyle = {} ;
			if ( this.featureType.styles && typeof style == 'undefined' ){
				this.styleMap = new OpenLayers.StyleMap( this.featureType.styles );
			}else{
				this.styleMap = new OpenLayers.StyleMap(OpenLayers.Util.applyDefaults(
					defaultStyle,
			        OpenLayers.Feature.Vector.style["default"])
			    );
			}
			this.addDefaultStyle(style, context);
		},

	   /** 
		* Ajouter un style d'affichage
		*/
		addDefaultStyle : function (style, context)
		{	// Modifier le style
			if (this.featureType.styles && this.featureType.styles['default'] && !this.featureType.stylesDone) 
			{	style = OpenLayers.Util.extend( 
					OpenLayers.Util.extend({},this.featureType.styles['default']), style 
				);
				// Supprimer les valeurs nulles
				for (var i in style) if (!style[i]) delete(style[i]);
				this.featureType.stylesDone = true;
			}
			// Ajouter au style
			if (this.styleMap) 
			{	style = OpenLayers.Util.extend (this.styleMap.styles['default'].defaultStyle, style);
				context = OpenLayers.Util.extend (this.styleMap.styles['default'].context, context);
			}
			// Afficher
			this.styleMap.styles['default'] = new OpenLayers.Style( style, { context: context });
			this.refresh({force:true});
		},

		/** La classe
		*/
		CLASS_NAME : "GCMS.Layer.VectorLayer"
});
