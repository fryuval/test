var express			=	require('express');
var app				=	express();
var server			=	require('http').createServer(app);
var routes			=	require('./routes');
var io				=	require('socket.io').listen(server);
var path			=	require('path');

var credentials		=	require('./credentials.js');
var dbproperties	=	require('./dbproperties.js');
var mongo 			=	require('mongodb');
var twitter			=	require('ntwitter');
var DbServer		=	mongo.Server;
var	Db				=	mongo.Db;

app.configure(function(){
  app.set('port', process.env.PORT || 5000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

app.get('/', routes.index);

var t = new twitter({
    consumer_key: credentials.consumer_key,
    consumer_secret: credentials.consumer_secret,
    access_token_key: credentials.access_token_key,
    access_token_secret: credentials.access_token_secret
});

var	dbserver	=	new DbServer(	dbproperties.server_ip		,
									dbproperties.server_port	,
									{	auto_reconnect:	true	}	);
							
var db = new Db(	dbproperties.database_name,	dbserver,	{	safe:	true	}	)

var criteria = ['103.748581,1.306320,103.867844,1.470620'];
//40.105387,-75.349731
//39.732538,-74.86084


//var criteria = ['-74,40,-73,41'];
//var criteria = ['-75.35,39.75,-74.85,40.1'];

db.open(function(err, client)	{
	client.authenticate(dbproperties.database_user,	dbproperties.database_pass,	function(err, success) {
		db.collection(dbproperties.collection_name,	function(err,	collection) {
			collection.remove(null,	{safe:	true},	function(err,	result)	{}	);
		}	);
		t.stream(	
			'statuses/filter'				,
			{ locations: criteria }			,
			function(stream) {
				stream.on('data',	function(tweet)	{
					db.collection(dbproperties.collection_name,	function(err,	collection) {
						collection.insert(tweet,	{safe:	true},	function(err,	result)	{}	);
					}	);
					var geo=false;
					var latitude;
					var longitude;
					if(tweet.geo!=null){
						geo = true;
						latitude = tweet.geo.coordinates[0];
						longitude = tweet.geo.coordinates[1];
					}
					io.sockets.volatile.emit('tweets', {
						created:				tweet.created_at				,
						id: 					tweet.id_str 					, 
						geo: 					geo 							, 
						latitude: 				latitude						,
						longitude:				longitude						,
						text:					tweet.text						,
						user_name:				tweet.user.name					,
						user_screen_name:		tweet.user.screen_name			,
						user_profile_image:		tweet.user.profile_image_url
					});
				}	);
			}
		)
	}	)
}	);