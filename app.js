
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    blog = require('./routes/blog'),
    http = require('http'),
    path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 31110);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
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

app.get('/', routes.index);
app.get('/blogs', blog.list);
app.get('/posts', blog.listposts);
app.get('/tracking', blog.listTrack);
app.get('/likes', blog.listLikes);
app.post('/blog', blog.track);
app.get('/blog/:hostname/likes', blog.likes);
app.get('/blogs/track', blog.doTrack);
app.get('/blog/:hostname/trends', blog.targetTrends);
app.get('/blogs/trends', blog.allTrends);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
