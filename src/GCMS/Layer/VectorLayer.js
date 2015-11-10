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
					     new OpenLayers.Strategy.BBOX({ratio: 1.05,resFactor: 2}),
					     new GCMS.Strategy.KeepChanges()
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
				

				layerOptions.protocol = new OpenLayers.Protocol.HTTPErr(
						{
							url : featureType.wfs,
							//callbackKey : "callback",
							//callbackPrefix : "callback:",
							format: new GCMS.Format.JSON(
							    {
							        idName: featureType.idName, 
							        geometryName: featureType.geometryName
							    }
							),
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
								outputFormat : "JSON",
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
		 * Recherche des features par tableau d'attributs (clause &&)
		 * @param {attributes} object
		 * Exemple : {'field1':'value1', 'field2':'value2'}
		 */
		getFeaturesByAttributes: function(attributes)	{
			var i, feature, len = this.features.length,
			foundFeatures = [];
			
			if ( typeof(attributes) !== 'object' )	{
				return foundFeatures;
			}
			
			for(i = 0; i < len; i++) {
				feature = this.features[i];
				
				if(feature && feature.attributes) {
					for (var prop in attributes) {
						if (feature.attributes[prop] === attributes[prop])	{
							foundFeatures.push(feature);
							break;
						} 
					}
				}
			}
	
			return foundFeatures;
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
			if ( geometryType.indexOf( "Multi" ) !== -1 ){
			    return true ;
			}
			if ( geometryType == "GeometryCollection" ){
			    return true ;
			}
			return false ;
		},
		
		/**
		 * Test si la colonne géométrique supporte les Point
		 */
		hasPoint: function(){
		    var geometryType = this.getGeometryType() ;
            if ( geometryType.indexOf( "Point" ) !== -1 ){
                return true ;
            }
            if ( geometryType == "GeometryCollection" ){
                return true ;
            }
            return false ;
		},
		
	    /**
         * Test si la colonne géométrique supporte les LineString
         */
        hasLineString: function(){
            var geometryType = this.getGeometryType() ;
            if ( geometryType.indexOf( "LineString" ) !== -1 ){
                return true ;
            }
            if ( geometryType == "GeometryCollection" ){
                return true ;
            }
            return false ;
        },
        
        /**
         * Test si la colonne géométrique supporte les Polygon
         */
        hasPolygon: function(){
            var geometryType = this.getGeometryType() ;
            if ( geometryType.indexOf( "Polygon" ) !== -1 ){
                return true ;
            }
            if ( geometryType == "GeometryCollection" ){
                return true ;
            }
            return false ;
        },
        
        /**
         * Renvoie la liste des objets modifiés et les tags avec un état 
         */
        getModifiedFeatures: function(){
            var modifiedFeatures = [] ;
            
            for ( var i in this.features ){
                var feature = this.features[i] ;
                if ( feature.state != null ){
                     feature.attributes['_client_feature_id'] = GCMS.guid();
                    feature.attributes['_state'] = feature.state ;
                    modifiedFeatures.push( feature ) ;
                }
            }
            return modifiedFeatures ;
        },
		

        /**
         * Récupérer les modifications sur la couche
         */
        getSaveActions: function(){
            var format = new GCMS.Format.JSON(
                {
                    idName: this.featureType.idName, 
                    geometryName: this.featureType.geometryName,
                    internalProjection: this.map.getProjectionObject(),
                    externalProjection: this.featureType.projection
                }
            ) ;
            
            return format.write( this.getModifiedFeatures() ) ; 
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
