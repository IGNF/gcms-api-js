/**
 * BDUni layer
 */
GCMS.Layer.BDUni = OpenLayers.Class ( GCMS.Layer.VectorLayer,
{
	/**
	 * Ajouter un filtre de chargement
	 */
	addFeatureFilter : function (filterName, options)
	{	
		var filter = {} ;
		
		// Styles predefinis
		if ( GCMS.Layer.BDUni.defaultFilter[filterName] )
		{	
			filter = GCMS.Layer.BDUni.defaultFilter[filterName](options);
		}
		
		if ( typeof(filter) != "object" ){
			filter = {} ;
		}
				
		GCMS.Layer.VectorLayer.prototype.addFeatureFilter.apply( this, [ filter, options ] );
	},
		
	/** 
	* Modifier le style d'affichage
	*/
	addDefaultStyle : function (style, options)
	{	var context;

		// Styles predefinis
		if (GCMS.Layer.BDUni.defaultStyle[style])
		{	var s = GCMS.Layer.BDUni.defaultStyle[style](options);
			style = s.style;
			context = s.context;
		}
		else if (typeof(style) != "object") style = {};
		
		GCMS.Layer.VectorLayer.prototype.addDefaultStyle.apply( this, [ style, context ] );
	},

	/** La classe
	*/
	CLASS_NAME : "GCMS.Layer.BDUni"
});

/**	Filtre predefinis
*/
GCMS.Layer.BDUni.defaultFilter = 
{
	'detruit': function(options){
		return { "detruit": true } ;		
	},
	'vivant': function(options){
		return { "detruit": false } ;		
	},
	'depuis': function(options){
		return { "daterec": {"$gt" : String(options) } } ;		
	},
	'jusqua': function(options){
		return { "daterec": {"$lt" : String(options) } } ;		
	}
} ;


/**	Styles predefinis
*/
GCMS.Layer.BDUni.defaultStyle = 
{	// Objets mort-vivant
	'zombie': function(options)
	{	return {	style : {	
						strokeColor: "${fcolor}",
						fillColor: "${fcolor}",
						fillOpacity:0.5
					},
					context : 
					{	fcolor: function(feature) { return (feature.attributes.detruit)? "#F00" : "#00F"; } 
					}
				}
	},
	// Objets detruits
	'detruit': function(options)
	{	return	{	style : {	display: "${living}" },
					context : 
					{	living: function(feature) { return (feature.attributes.detruit)? true : "none"; } 
					}
				}
	},
	// Objets vivants
	'vivant': function(options)
	{	return {	style : {	display: "${living}" },
					context : 
					{	living: function(feature) { return (feature.attributes.detruit)? "none" : true ; } 
					}
				}
	},
	// Coloriage suivant un interval (en jour)
	// [ { age:30, color:'#F00' }, { age:60, color:'#0F0' }, { age:120, color:'#00F' } ]
	'interval': function(options)
	{	var today = new Date();
		today = today.getTime();
		var interval = new Array();
		for (var i=0; i<options.length; i++)
		{	if (typeof (options[i].age) != 'undefined') 
			{	var d = new Date(); 
				d.setTime ( today - (24*3600000 * options[i].age) );
				interval.push (
					{	color: options[i].color,
						date: d.getFullYear()+"-"+(d.getMonth()<9 ? '0':'')+(d.getMonth()+1)+"-"+(d.getDate()<10 ? '0':'')+d.getDate()
					});
			}
			else if (options[i].date) interval.push ({ color: options[i].color, date: options[i].date });
		}
		interval.sort (function(a,b) { a.date > b.date });
		var style = 
			{	strokeColor: "${fcolor}",
				fillColor: "${fcolor}",
				fillOpacity: 0.5
			};
		var context = 
			{	fcolor: function(feature) 
				{	var d = feature.attributes.daterec ;
					var col = "#369";
					for (var i=0; i<interval.length; i++) 
					{	if (d < interval[i].date) col = interval[i].color;
						else break;
					}
					return col; 
				}
			};

		return {style:style, context: context };
	},
	// Affichage de la graphie principale, secondaire
	'graphie': function(options)
	{	return {	style :
					{	label: "${nom}",
						fontColor: "${fcolor}",
						fontFamily: "Verdana,Tahoma,Arial,sans-serif",
						fontWeight:"bold",
						labelSelect:true,
						labelOutlineColor:"#fff",
						labelOutlineWidth:2,
						fill:false,
						stroke:false,
						labelYOffset:0
					},
					context :
					{	nom: function(feature) 
						{	var nom = (feature.attributes.graphie_principale ? feature.attributes.graphie_principale :feature.attributes.nom_d_usage_local );
							if (!nom) return "xXx";
							nom = nom.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); }); 
							return nom;
						},
						fcolor: function(feature) 
						{	return (feature.attributes.graphie_principale) ? "#000" : "#500" ;
						}
					}
			}
	},
	// Affichage du routier
	'route': function(options)
	{	return	{	style :
					{	// label: "${fid}",
						// labelColor: "#f00",
						// labelXOffset:"${lox}", labelYOffset:"${loy}",
						strokeColor: "${fcolor}",
						strokeWidth: "${swidth}",
						strokeDashstyle: "${dstyle}",
						strokeLinecap: "${lcap}",
						graphicZIndex: "${zindex}"
					},
					context :
					{	fid: function(feature)
						{	if (feature.fid)
								return feature.fid.substr(-4);
							else return "";
						},
						lox: function (feature) 
						{	return GCMS.Util.dCenterLine(feature).dx; 
						},
						loy: function (feature) 
						{	return GCMS.Util.dCenterLine(feature).dy; 
						},
						fcolor: function(feature) 
						{	if (options && options.vert && feature.attributes.itineraire_vert=="Appartient") 
							{	if (feature.attributes.position_par_rapport_au_sol != "0") return "#006400";
								else return "green";
							}
							if (!feature.attributes.importance) return "magenta";
							if (feature.attributes.position_par_rapport_au_sol != "0")
							{	switch(feature.attributes.importance)
								{	case "1": return "#B11BB1"; 
									case "2": return "#B11B1B"; 
									case "3": return "#D97700"; 
									case "4": return "#FFE100"; 
									case "5": return "#CCCCCC"; 
									default: return "#D3D3D3";
								}
							}
							else 
							{	switch(feature.attributes.importance)
								{	case "1": return "#FF00FF"; 
									case "2": return "red"; 
									case "3": return "#FFA500"; 
									case "4": return "yellow"; 
									case "5": return "white"; 
									default: return "#D3D3D3";
								}
							}
							return "#808080";
						},
						zindex: function(feature) 
						{	if (!feature.attributes.position_par_rapport_au_sol) return 100;
							var pos = Number(feature.attributes.position_par_rapport_au_sol);
							if (pos>0) return 10 + Number(feature.attributes.position_par_rapport_au_sol);
							else if (pos<0) return Math.max(4 + Number(feature.attributes.position_par_rapport_au_sol), 0);
							else return 10 - Number(feature.attributes.importance);
							return 0;
						},
						swidth: function(feature) 
						{	if (feature.attributes.largeur_de_chaussee) return Math.max (Number(feature.attributes.largeur_de_chaussee),2);
							return 2;
						},
						dstyle: function(feature) 
						{	if (feature.attributes.nature == "Sentier") return 'dash';
							if (Number(feature.attributes.position_par_rapport_au_sol)<0) return 'dash';
							if (feature.attributes.fictif == "1") return 'dot';
							else return 'solid';
						},
						lcap: function(feature) 
						{	if (feature.attributes.nature == "Sentier") return 'butt';
							if (Number(feature.attributes.position_par_rapport_au_sol)<0) return 'butt';
							return 'round';
						}
					}
			}
	},
	// Sens de parcourt
	'sens': function(options)
	{	return {	style : 
					{	label:"${fleche}", fontWeight:"bold", 
						labelOutlineColor:"#fff", labelOutlineWidth:1,
						labelRotation: "${lrot}", labelXOffset:"${lox}", labelYOffset:"${loy}" 
					},
					context :
					{	fleche: function (feature)
						{	if (feature.attributes.sens_de_circulation == 'Sens direct') return '>';
							else if (feature.attributes.sens_de_circulation == 'Sens inverse') return '<';
							return '';
						},
						lrot: function (feature) 
						{	if (feature.attributes.sens_de_circulation != 'Sens direct' && feature.attributes.sens_de_circulation != 'Sens inverse') return 0;
							return GCMS.Util.angle (feature, 'center'); 
						},
						lox: function (feature) 
						{	if (feature.attributes.sens_de_circulation != 'Sens direct' && feature.attributes.sens_de_circulation != 'Sens inverse') return 0;
							return GCMS.Util.dCenterLine(feature).dx; 
						},
						loy: function (feature) 
						{	if (feature.attributes.sens_de_circulation != 'Sens direct' && feature.attributes.sens_de_circulation != 'Sens inverse') return 0;
							return GCMS.Util.dCenterLine(feature).dy; 
						}
					}
			}
	},
	// Affichage d'un label
	'label': function(options)
	{	if (options) return { style: { label: "${"+options+"}", fontColor:"#000", labelOutlineColor:"#fff", labelOutlineWidth:3 } };
		else return { style : {} };
	},
	// Affichage des adresses
	'adresses': function(options)
	{	return {	style : 
					{	label: "${getNum}", 
						fontColor: "${color}" ,
						pointRadius:4,
						labelSelect:true,
						labelOutlineColor:"#fff",
						labelOutlineWidth:2,
						labelAlign:"lb",
						fontSize:10,
						fontFamily:"Verdana,Tahoma,Arial,sans-serif",
						strokeColor:"White",
						strokeWidth:1,
						fillColor:"Black",
						labelXOffset:2,
						labelYOffset:2,
						fontWeight:"bold",
						graphicName:"cross"
					},
					context :
					{	getNum: function (feature)
						{	if (feature.layer && feature.layer.map.zoom < 18) return "";
							if (!feature.attributes.numero || Number(feature.attributes.numero)>1000) return '?';
							return feature.attributes.numero + feature.attributes.indice_de_repetition.toLowerCase();
						},
						color: function (feature)
						{	if (Number(feature.attributes.numero)>1000) return '#F00';
							else return "#000";
						}
					}
			}
	},
	// Affichage d'un label le long de la ligne
	'lelong': function(options)
	{	if (options) style = { label: "${"+options+"}", fontColor:"#000", labelOutlineColor:"#fff", labelOutlineWidth:3, 
							labelRotation: "${lrot}", labelXOffset:"${lox}", labelYOffset:"${loy}" };
		else style = {};
		context = 
		{	lrot: function (feature) 
			{	return GCMS.Util.angle (feature, 'center', true); 
			},
			lox: function (feature) 
			{	return GCMS.Util.dCenterLine(feature).dx; 
			},
			loy: function (feature) 
			{	return GCMS.Util.dCenterLine(feature).dy; 
			}
		};
		return { style:style, context:context };
	},
	// Affichage du nom a partir de l'echelle 15
	'nom15': function(options)
	{	return {	style : 
					{	label: "${getNom}"
					},
					context :
					{	getNom: function (feature)
						{	if (feature.layer.map.zoom < 15) return "";
							// Decouper les noms trop long
							else return GCMS.Layer.BDUni.toponyme(feature.attributes.nom);
						}
					}
			}
	},
	// Affichage du nom a partir de l'echelle 17
	'nom17': function(options)
	{	return {	style : 
					{	label: "${getNom}"
					},
					context :
					{	getNom: function (feature)
						{	if (feature.layer.map.zoom < 17) return "";
							// Decouper les noms trop long
							else return GCMS.Layer.BDUni.toponyme(feature.attributes.nom);
						}
					}
			}
	}

};


// Decouper les noms trop long
GCMS.Layer.BDUni.toponyme = function(nom)
{	if (!nom || !nom.length) return "";
	if (nom.length > 20)
	{	var t0 = nom.replace("' ","'").replace(" - ","-").split(' ');
		var ti="", t="";
		for (var i=t0.length-1; i>=0; i--)
		{	if (ti == "" || ti.length + t0[i].length < 15 || t0[i].length < 4)
			{	ti = t0[i]+(ti==""?"":" "+ti);
			}
			else 
			{	t = ti + (t==""?"":"\n"+t);
				ti = t0[i];
			}
		}
		if (ti) t = ti + (t==""?"":"\n"+t);
		return t;
	}
	else return nom.replace("' ","'").replace(" - ","-");
}