var socket = io.connect();
var map;
var total_geo = 0;
var total = 0;
var temp_arr	=	[];
var draw_layer	=	null;
var timeline;

jQuery(function ($) {
	map				=	L.map("map");
	map.setView([40.800,	-73.833],	10);	//@
	var	tileLayer	=	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png',{ attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'})
		tileLayer.addTo(map);
	var markers = new L.MarkerClusterGroup();
		map.addLayer(markers);
	render_chart();
	socket.on('tweets',	function (data)	{
		render(data,	markers);	//@
        update_total();
    }	);
}	);

function reset(markers)	{	//@
	update_geo(0);
	update_total(0);
	$("#feed-inner").empty();
	$('#timeline-inner').highcharts().series[0].setData(reset_timeline(), true);
	markers.clearLayers();
}
function render(data,	markers)	{
	var feed	=	$("#feed-inner");
	
	var tweet				=	$("<div	/>");
		tweet.addClass("tweet");
		tweet.attr("id",	data.id);
	var user_profile_image	=	$("<div	/>");
		user_profile_image.addClass("user_profile_image");
		user_profile_image.css("background-image",	"url('"	+	data.user_profile_image	+	"')");
	var user_profile_wrap	=	$("<div	/>");
		user_profile_wrap.addClass("user_profile_wrap");
		user_profile_wrap.append(user_profile_image);
	var user_name			=	$("<a	/>");
		user_name.addClass("user_name");
		user_name.attr("href", "https://twitter.com/"	+	data.user_name);
		user_name.attr("target", "_blank");
		user_name.text(data.user_name);
	var user_screen_name	=	$("<span />");
		user_screen_name.addClass("user_screen_name");
		user_screen_name.text(" @"+data.user_screen_name);
	var created				=	$("<div	/>");
		created.addClass("created");
		created.text(data.created.split(" ")[3]);
	var text				=	$("<div	/>");
		text.addClass("text");
		text.text(data.text);	
	
	tweet.append([user_profile_wrap, user_name, user_screen_name, created, text]);
	if	(data.geo)	{	update_geo();
						tweet.addClass("geo");
						addMarker(data, markers);	}
	feed.prepend(tweet);
}
function update_total(n) {
	if (n!=null)	{	total	=	n;	}
	else			{	total++;		}	
    $("#total").html(total);
	if (!n)	{	temp_arr.push(true);	}
}
function update_geo(n) {
	if (n!=null)	{	total_geo	=	n;	}
	else			{	total_geo++;		}
    $("#total_geo").html(total_geo);
}
function addMarker(data,	markers){
	var marker	=	L.marker([data.latitude,	data.longitude]);
		marker.bindPopup('<a href="https://twitter.com/'+data.user_name+'" target="_blank">'+data.user_name+'</a>'+'<p>'+data.text+'</p>');	//@
	markers.addLayer(marker);
}
function render_chart()	{
	var minute_mill	=	60*1000;
	var timeline	=	$('#timeline-inner').highcharts('StockChart', {
		chart:			{	events:	{
								load:	function()	{	var series	=	this.series[0];
														setInterval(function()	{
															series.addPoint([(new Date()).getTime(), temp_arr.length], true, true)
															temp_arr	=	[];
														},	minute_mill);	}	}	,
							height: 180	}			,
		rangeSelector:	{	enabled:	false				}	,
		xAxis:			{	minRange:	(10*minute_mill)	}	,
		series:			[	{	name:	'Tweets',
								data:	(function()	{
											return reset_timeline();
										}	)()
							}	]
	}	);
}
function reset_timeline()	{
	var minute_mill	=	60*1000;
	var data	= [];
	var time	=	(new Date()).getTime();
	for (var i=-10;	i<=0;	i++)	{
		data.push(	[	(time + i * minute_mill),	1	]	);
	}
	return data;
}