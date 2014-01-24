var path = require('path');
var express = require('express');

var config = require('./config');
var routes = require('./routes/routes');

var app = express();

//

app.locals.public_version = 1;
app.locals.analytics = config.analytics;

app.use(express.cookieParser());

app.configure('development', function() {
	app.use(express.logger('dev'));
	
	app.get('/public/worker.js', routes.front.worker);
	app.use('/public', express.static(path.join(__dirname, 'raw')));
});

app.configure('testing', function() {
	app.use(express.logger('dev'));
	
	app.use('/public', express.static(path.join(__dirname, 'public')));
});

app.configure('production', function() {
	app.enable('trust proxy');
});

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

//

app.get('/', routes.api.tag, routes.front.home);

app.get('/withdraw/:id', routes.api.tag, routes.front.withdraw);
app.post('/withdraw/:id', routes.api.tag, express.urlencoded(), routes.front.withdrawp);
app.get('/api/withdraw', routes.api.middleware, routes.api.tag, routes.api.withdraw);

app.get('/api/work', routes.api.middleware, routes.api.tag, routes.api.work);
app.get('/api/balance', routes.api.middleware, routes.api.tag, routes.api.balance);

app.post('/api/submit', routes.api.middleware, routes.api.tag, express.urlencoded(), routes.api.submit);
app.post('/api/email', routes.api.middleware, routes.api.tag, express.urlencoded(), routes.api.email);

var port = (process.env.NODE_PORT || config.server.port);
app.listen(port);
process.title = 'sv' + port;
