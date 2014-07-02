/**
 * JSON/WKT format
 * 
 * [
 * {"id":"1254","geometry":"POINT(12.0 53.0)"},
 * {"id":"145","geometry":"POINT(255.0 144.0)"}
 * ]
 * 
 * 
 */
GCMS.Format.JSON = OpenLayers.Class(OpenLayers.Format, {
    initialize: function(options) {
        options = options || {} ;
        
        options = OpenLayers.Util.extend({
            idName: "id",
            geometryName: "geometry"
        }, options);
        
        OpenLayers.Format.prototype.initialize.apply(this, [options]);
        this.json = new OpenLayers.Format.JSON();
        this.wkt  = new OpenLayers.Format.WKT();
    },
    
    /**
     * read a set of features
     */
    read: function(data) {
        var features = [];
        
        var rows = this.json.read( data ) ; 
        
        for ( var i in rows ){
            var row = rows[i] ;
            
            // parse geometry
            //var id = null ;
            
            var feature = null ;
            if ( row[ this.geometryName ] ){
                feature = this.wkt.read( row[ this.geometryName ] ) ; 
            }else{
                throw "missing geometry attribute '"+this.geometryName+"' in JSON row" ;
            }

            if ( row[ this.idName ] ){
                feature.fid = row[ this.idName ] ;
            }else{
                throw "missing id attribute '"+this.idName+"' in JSON row" ;
            }
            
            delete row[ this.geometryName ] ;
            feature.attributes = row ;
            
            
            
            features.push( feature ) ;
        }
        return features ;
    },
    
    /**
     * conversion en texte d'un tableau d'objet
     */
    write: function(features) {
        var rows = [] ;
        for ( var i in features ){
            var feature = features[i] ;
            var row = feature.attributes ;
            row[ this.geometryName ] = this.wkt.write( feature ) ;
            rows.push( row ) ;
        }
        return this.json.write( rows ) ;
    },
    CLASS_NAME: "GCMS.Format.JSON" 
});
