/** 
 * Fonctions utile pour faire des styles
 */
GCMS.Util = {
   /*
    * Convertir un point en pixel
	*/
	pt2Pixel: function (feature, pt)
	{	return feature.layer.map.getPixelFromLonLat(new OpenLayers.LonLat (pt.x, pt.y));
	},

	/** Decalage au centre d'une ligne
	*/
	dCenterLine: function (feature)
	{	if (feature.geometry.CLASS_NAME == "OpenLayers.Geometry.LineString")
		{	var l = Math.floor ((feature.geometry.components.length-1) /2);
			// Sur le point central
			if (l!=0)
			{	var p0 = this.pt2Pixel(feature,feature.geometry.components[0]);
				var p1 = this.pt2Pixel(feature,feature.geometry.components[l]);
				return { dx:p1.x-p0.x, dy:p0.y-p1.y };
			}
			// au milieu du segment
			else
			{	var p0 = this.pt2Pixel(feature,feature.geometry.components[0]);
				var p1 = this.pt2Pixel(feature,feature.geometry.components[1]);
				return { dx:(p1.x-p0.x)/2, dy:(p0.y-p1.y)/2 };
			}
		}
		else return { dx:0, dy:0 }
	},

	/** Calcul de l'angle sur une lineString
	*/
	angle: function (feature, pos, lisible)
	{	if (feature.geometry.CLASS_NAME == "OpenLayers.Geometry.LineString")
		{	var geom = feature.geometry.components;
			if (geom)
			{	var l;
				switch (pos)
				{	case 'center': 
						l = Math.floor((geom.length-1) /2);
						break;
					case 'end':
						l = geom.length-2;
						break;
					default: l = 0;
				}
				var dy = geom[l].y - geom[l+1].y;
				var dx = geom[l+1].x - geom[l].x;
				var d = Math.sqrt(dx*dx+dy*dy);
				var angle;
				if (dx==0) angle = (dy<0 ? 180:0);
				else angle = Math.atan(dy/dx) / (Math.PI/180); //convert to degrees 
				if (dx<0) angle += 180;
				angle = Math.round(angle);
				if (!lisible) return angle;
				// Toujours lisible
				if (angle>90 && angle<270) return 180+angle;
				else return angle;

			}
		}
		return 0;
	}
};
