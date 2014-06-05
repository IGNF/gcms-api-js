/**
 * @requires OpenLayers/Strategy.js
 */

/**
 * Class: GCMS.Strategy.KeepChanges
 * A strategy that protect features whose state is Insert/Delete/Update from deletion on reload
 *
 * Inherits from:
 *  - <OpenLayers.Strategy>
 */
GCMS.Strategy.KeepChanges = OpenLayers.Class(OpenLayers.Strategy, {
 
    /** 
     * Property: trackedFeatures
     * 
     * Warning : Doesn't store feature if there is no refresh
     * 
     * {<OpenLayers.Feature.Vector>} Tracked feature during refresh
     */
    trackedFeatures: null,
    
    /**
     * Constructor: OpenLayers.Strategy.Save
     * Create a new Save strategy.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     */
    initialize: function(options) {
        OpenLayers.Strategy.prototype.initialize.apply(this, [options]);
        this.trackedFeatures = [] ;
    },
   
    /**
     * APIMethod: activate
     * Activate the strategy.  Register any listeners, do appropriate setup.
     * 
     * Returns:
     * {Boolean} The strategy was successfully activated.
     */
    activate: function() {
        var activated = OpenLayers.Strategy.prototype.activate.call(this);
        if(activated) {
        	this.layer.events.on({
                "loadstart": this.handleBackup,
                "loadend": this.handleRestore,
                scope: this
            });
        }
        return activated;
    },
    
    /**
     * APIMethod: deactivate
     * Deactivate the strategy.  Unregister any listeners, do appropriate
     *     tear-down.
     * 
     * Returns:
     * {Boolean} The strategy was successfully deactivated.
     */
    deactivate: function() {
        var deactivated = OpenLayers.Strategy.prototype.deactivate.call(this);
        if(deactivated) {
        	this.layer.events.un({
        		"loadstart": this.handleBackup,
                "loadend": this.handleRestore,
                scope: this
            });
        }
        return deactivated;
    },
    
    /**
     * Method: reset
     * Clear tracked features
     */
    reset: function(){
    	this.layer.destroyFeatures( this.trackedFeatures ) ;
    	this.trackedFeatures = [] ;
    	
    	this.layer.destroyFeatures( this.layer.features );
    	
    	this.layer.refresh({force: true}) ;
    },
    
    
    /**
     * Method: handleBackup
     * Registered as a listener. Save all feature with state in insert, update or delete.
     *
     * Parameters:
     * event - {Object} The event this function is listening for.
     */
    handleBackup: function(event) {
    	this.trackedFeatures = [] ;
    	for ( var i in this.layer.features ){
    		var feature = this.layer.features[i];
    		if ( feature.state !== null ){
    			//style deselectionne
    			feature.renderIntent = null;
    			this.trackedFeatures.push(feature);
    		}
    	}
    	// remove feature from layer to avoid "destroy"
    	this.layer.removeFeatures(this.layer.features); 
    },
    
    
    /**
     * Method: handleRestore
     * Registered as a listener. Save all feature with state in insert, update or delete.
     *
     * Parameters:
     * event - {Object} The event this function is listening for.
     */
    handleRestore: function(event) {
    	var duplicatedFeatures = []; 
    	for ( var i in this.trackedFeatures ){
    		var feature = this.layer.getFeatureByFid( this.trackedFeatures[i].fid ) ;
    		if ( feature != null ){
    			duplicatedFeatures.push(feature);
    		}
    	}
    	this.layer.destroyFeatures( duplicatedFeatures ) ;
    	
    	this.layer.addFeatures( this.trackedFeatures );
    },
    
   
    CLASS_NAME: "GCMS.Strategy.KeepChanges" 
});
