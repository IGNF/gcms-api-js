/**
 * patch to support Z in GeoJSON reader
 */
OpenLayers.Format.GeoJSON.prototype.parseCoords.point = function(a) {
	if (a.length >= 3 && !this.ignoreExtraDims) {
		return new OpenLayers.Geometry.Point(a[0], a[1], a[2]);
	} else if (a.length >= 2) {
		return new OpenLayers.Geometry.Point(a[0], a[1]);
	} else {
		throw "Bad coordinate dimension: " + a;
	}
};

/** Patch to rotate text
*/
OpenLayers.Renderer.Elements.prototype.LABEL_OUTLINE_SUFFIX =  "_outline";

OpenLayers.Renderer.SVG.prototype.removeText = function(featureId) 
{	var label = document.getElementById(featureId + this.LABEL_ID_SUFFIX);
	if (label) {
		this.textRoot.removeChild(label);
	}
	var outline = document.getElementById(featureId + this.LABEL_OUTLINE_SUFFIX);
	if (outline) {
		this.textRoot.removeChild(outline);
	}
};




OpenLayers.Renderer.SVG.prototype.drawText = function(featureId, style, location) 
{		
	// add label outline  ----------------------------------------	
    var drawOutline = (!!style.labelOutlineWidth);
    // First draw text in halo color and size and overlay the
    // normal text afterwards
    if (drawOutline) {
        var outlineStyle = OpenLayers.Util.extend({}, style);
        outlineStyle.fontColor = outlineStyle.labelOutlineColor;
        outlineStyle.fontStrokeColor = outlineStyle.labelOutlineColor;
        outlineStyle.fontStrokeWidth = style.labelOutlineWidth;
        delete outlineStyle.labelOutlineWidth;
        this.drawText(featureId, outlineStyle, location);
    }
	/////////////////////////----------------------------------------

	var resolution = this.getResolution();

    var x = (location.x / resolution + this.left);
    var y = (location.y / resolution - this.top);

    // add label outline  ----------------------------------------	
    var suffix = (!drawOutline)? this.LABEL_ID_SUFFIX : this.LABEL_OUTLINE_SUFFIX;
    var label = this.nodeFactory(featureId + suffix, "text");
    
	if (style.fontStrokeColor) {
        label.setAttributeNS(null, "stroke", style.fontStrokeColor);
    }
    if (style.fontStrokeWidth) {
        label.setAttributeNS(null, "stroke-width", style.fontStrokeWidth);
    }
	/////////////////////////----------------------------------------
	//var label = this.nodeFactory(featureId + this.LABEL_ID_SUFFIX, "text");

    label.setAttributeNS(null, "x", x);
    label.setAttributeNS(null, "y", -y);

	// add label rotation ----------------------------------------	
	if (style.labelRotation || style.labelRotation == 0) 
	{	var rotate = 'rotate(' + style.labelRotation + ',' + x + "," + -y + ')';
		label.setAttributeNS(null, "transform", rotate);
	}
	/////////////////////////----------------------------------------        

	if (style.fontColor) {
        label.setAttributeNS(null, "fill", style.fontColor);
    }
    if (style.fontOpacity) {
        label.setAttributeNS(null, "opacity", style.fontOpacity);
    }
    if (style.fontFamily) {
        label.setAttributeNS(null, "font-family", style.fontFamily);
    }
    if (style.fontSize) {
        label.setAttributeNS(null, "font-size", style.fontSize);
    }
    if (style.fontWeight) {
        label.setAttributeNS(null, "font-weight", style.fontWeight);
    }
    if (style.fontStyle) {
        label.setAttributeNS(null, "font-style", style.fontStyle);
    }
    if (style.labelSelect === true) {
        label.setAttributeNS(null, "pointer-events", "visible");
        label._featureId = featureId;
    } else {
        label.setAttributeNS(null, "pointer-events", "none");
    }
    var align = style.labelAlign || "cm";
    label.setAttributeNS(null, "text-anchor",
        OpenLayers.Renderer.SVG.LABEL_ALIGN[align[0]] || "middle");

    if (OpenLayers.IS_GECKO === true) {
        label.setAttributeNS(null, "dominant-baseline",
            OpenLayers.Renderer.SVG.LABEL_ALIGN[align[1]] || "central");
    }

    var labelRows = style.label.split('\n');
    var numRows = labelRows.length;
    while (label.childNodes.length > numRows) {
        label.removeChild(label.lastChild);
    }
    for (var i = 0; i < numRows; i++) {
	// add label outline  ----------------------------------------	
	// var tspan = this.nodeFactory(featureId + this.LABEL_ID_SUFFIX + "_tspan_" + i, "tspan");
        var tspan = this.nodeFactory(featureId + suffix + "_tspan_" + i, "tspan");
        if (style.labelSelect === true) {
            tspan._featureId = featureId;
            tspan._geometry = location;
            tspan._geometryClass = location.CLASS_NAME;
        }
        if (OpenLayers.IS_GECKO === false) {
            tspan.setAttributeNS(null, "baseline-shift",
                OpenLayers.Renderer.SVG.LABEL_VSHIFT[align[1]] || "-35%");
        }
        tspan.setAttribute("x", x);
        if (i == 0) {
            var vfactor = OpenLayers.Renderer.SVG.LABEL_VFACTOR[align[1]];
            if (vfactor == null) {
                 vfactor = -.5;
            }
            tspan.setAttribute("dy", (vfactor*(numRows-1)) + "em");
        } else {
            tspan.setAttribute("dy", "1em");
        }
        tspan.textContent = (labelRows[i] === '') ? ' ' : labelRows[i];
        if (!tspan.parentNode) {
            label.appendChild(tspan);
        }
    }

    if (!label.parentNode) {
        this.textRoot.appendChild(label);
    }
};

