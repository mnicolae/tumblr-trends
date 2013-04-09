// connect on cdf with this command:
// mysql -p -h us-mm-demo-dca-01.cleardb.com -u 530128b82aad68 cdb_eval_8926ac79f903c94
// password: 333c25d3
var mysql = require('mysql');
var pool = mysql.createPool({
	host: 'us-mm-demo-dca-01.cleardb.com',
	user: '530128b82aad68',
	password: '333c25d3',
	database: 'cdb_eval_8926ac79f903c94',
	multipleStatements: true
});

var tumblr = require('tumblr.js');
var client = tumblr.createClient({
	consumer_key: '6cIcNYtgacCdi52JwJB4ZofEQ0ul5uMDTeKXAwHhrFRX5Bp76p',
	consumer_secret: 'KqPFxtt8jhyg2wxeJU2qFeTlugyPcsnv0WFeCal1Uq0VVFy8K1',
	token: '<oauth token>',
	token_secret: '<oauth token secret>'
});

var cronJob = require('cron').CronJob;

var formatDateTimeNow = function () {
	var now = new Date();
	var date = now.getDate(),
		month = now.getMonth() + 1,
		year = now.getFullYear(),
		hour = now.getHours(),
		minutes = now.getMinutes(),
		seconds = now.getSeconds();

		return (year + '-' + month + '-' + date + " " + hour + ":" + minutes + ":" +
			seconds);
};

var formatDateTime = function (datetime, timezone) {
	var date = datetime.getDate(),
		month = datetime.getMonth() + 1,
		year = datetime.getFullYear(),
		hour = datetime.getHours(),
		minutes = datetime.getMinutes(),
		seconds = datetime.getSeconds();

		return (year + '-' + month + '-' + date + " " + hour + ":" + minutes + ":" +
			seconds + ' ' + timezone);
};

// list all blogs in 'blogs' table
exports.list = function (req,res) {
	pool.getConnection(function (err, connection) {
		connection.query('select * from blogs', function (err, rows) {
			if (err) res.send(500, err);
			else {
				connection.end();
				console.log("num of entries: " + rows.length);
				res.send(rows);
			}
		});
	});
};

// list posts table from mysql
exports.listposts = function (req, res) {
	pool.getConnection(function (err, connection) {
		connection.query('select * from posts', function (err, rows) {
			if (err) res.send(500, err);
			else {
				connection.end();
				console.log("num of entries: " + rows.length);
				res.send(rows);
			}
		});
	});
};

// list tracking table from mysql
exports.listTrack = function (req, res) {
	pool.getConnection(function (err, connection) {
		connection.query('select * from tracking', function (err, rows) {
			if (err) res.send(500, err);
			else {
				connection.end();
				console.log(rows)
				console.log("num of entries: " + rows.length);
				res.send(rows);
			}
		});
	});
};
  
// list likes table from mysql
exports.listLikes = function (req, res) {
	pool.getConnection(function (err, connection) {
		connection.query('select * from likes', function (err, rows) {
			if (err) res.send(500, err);
			else {
				connection.end();
				console.log("num of entries: " + rows.length);
				res.send(rows);
			}
		});
	});
};
  
// add new blog to 'blogs' table to track
exports.track = function (req, res) {
	pool.getConnection(function (err, connection) {
		connection.query('insert into blogs (hostname) values ("' + req.body.blog + '")',
			function(err, result) {
				if (err) res.send(500, err);
				else {
					connection.end();
					res.send(200, 'blog' + req.body.blog + ' successfully being tracked\n');}
			});
	});
};

exports.likes = function (req, res) {
	client.blogLikes(req.params.hostname, function (err, data) {
		if (err) res.send(err);
		else {
			console.log(data.liked_posts.length);
			res.json(data);
		}
	});
};

// insert the relevate data into the mysql db.
// data are the likes given by tumblr api for a certain hostname
var insertInDB = function (short_url, date, note_count, caption, image_permalink, hostname, connection) {

	connection.query('insert ignore into likes (hostname, posturl) values (? , ?)', [hostname, short_url],
		function(err, result) {
			if (err) console.log(err);
			else {
				// console.log('insert into likes successfully');
			}
		});

	connection.query('insert ignore into posts (posturl, text, imageurl, date) values (?, ?, ?, ?)', [short_url, caption, image_permalink, date],
	function(err, result) {
		if (err) console.log(err);
		else {
			// console.log("insert into posts successfully");
		}
	});

	connection.query('select posturl, sequence, count from tracking where posturl= ? and sequence >= all (select sequence from tracking where posturl= ?)',
		[short_url, short_url],
	function(err, result) {
		if (err) console.log(err);
		else {
			var query2values;
			if (result.length !== 0 ) {
				// then there are previous tracking sequences for this posturl already
				query2values = [short_url, formatDateTimeNow(), note_count - result[0].count, note_count, result[0].sequence+1];
			} else {
				// first sequece of the post
				query2values = [short_url, formatDateTimeNow(), 0, note_count, 1];
			}
			connection.query('insert into tracking values (?, ?, ?, ?, ?)', query2values,
				function(err, result) {
					if (err) console.log(err);
					else {
						console.log	('insert into tracking successfully: ' + short_url + " @ " + formatDateTimeNow());
					}
				});
		}
	});
};

// for all blogs in mysql db, find the likes of them and insert info into db
var filldb = function () {
	pool.getConnection(function (err, connection) {
		var query = connection.query('select * from blogs');
		query.on('result', function (row) {
			connection.pause();
			var hostname = row.hostname;
			var short_url, date, note_count, caption, image_permalink;
			client.blogLikes(hostname, {limit: 20}, function(err, bloglikes) {
				for (var i=0;i<bloglikes.liked_posts.length;i++){
					short_url = bloglikes.liked_posts[i].short_url;
					date = bloglikes.liked_posts[i].date;
					note_count = bloglikes.liked_posts[i].note_count;
					caption = bloglikes.liked_posts[i].slug;
					if (bloglikes.liked_posts[i].photos) {
						image_permalink = bloglikes.liked_posts[i].photos[0].original_size.url;
					} else {
						image_permalink = '';
					}

					insertInDB(short_url, date, note_count, caption, image_permalink, hostname, connection);
				}
				console.log('data inserted into db for: ' + hostname);
				connection.resume();
			});
		});
		connection.end();
		console.log("job done at: " + formatDateTimeNow());
	});
};

// run cron job every hour to fill db with new info
new cronJob('00 00 */1 * * *', function(){
	filldb();
}, null, true);

// route for manually filling db
exports.doTrack = function(req, res) {
	filldb();
	res.send('done');
};

var formatResponse = function (data, order, limit, type) {
	var trending_posts = [],
		trending = [];
	// get all the unique urls in posturl
	for (var i=0;i<data.length;i++){
		if (trending_posts.indexOf(data[i].posturl) === -1) {
			trending_posts.push(data[i].posturl);
			trending.push({
				url: data[i].posturl,
				text: data[i].text,
				image: data[i].imageurl,
				date: data[i].date,
				last_track: formatDateTime(data[i].timestamp, 'EST'),
				last_count: data[i].count,
				tracking: []
			});
		}
	}
	var post;
	for (var j=0;j<trending_posts.length; j++) {
		post = trending_posts[j];
		for (var k=0;k<data.length;k++){
			if (data[k].posturl === post){
				for (var l=0;l<trending.length;l++){
					if (trending[l].url === data[k].posturl){
						trending[l].tracking.push({
							timestamp:formatDateTime(data[k].timestamp, 'EST'),
							sequence: data[k].sequence,
							increment: data[k].increment,
							count: data[k].count
						});
					}
				}
			}
		}
	}

	if (type === 'recent') {
		trending.sort(function (a, b) {
			return b.date - a.date;
		});
	}
	// format date
	for (var n=0;n<trending.length;n++) {
		trending[n].date = formatDateTime(trending[n].date, 'GMT');
	}

	// sort by squence
	for (var m=0;m<trending.length;m++){
		trending[m].tracking.sort(function (a, b) {
			return b.sequence - a.sequence;
		});
	}

	if(type === 'trending') { // type is trending
		trending.sort(function (a, b) {
			return b.tracking[0].increment - a.tracking[0].increment;
		});
	}

	console.log(trending.length);
	var response = {
		trending: trending,
		order: order,
		limit: limit
	};
	return response;
};

// serve trends for all blogs
exports.allTrends = function (req, res) {
	var q,
	limit = req.query.limit,
	order = req.query.order;
	pool.getConnection(function (err, connection) {
		if (!limit) {
			limit = 20; // limit default to 20
		}
		if (order.toLowerCase() === 'recent'){
			q = 'select * from (select * from posts order by date desc limit ' + limit + ') as top join tracking using (posturl) order by posturl, sequence desc;';
			connection.query(q, function (err, result) {
				res.json(formatResponse(result, order, limit, 'recent'));
			});
		} else if (order.toLowerCase() === 'trending'){
			q = 'select posturl, text, imageurl, date, tracking.timestamp, tracking.sequence, tracking.increment, tracking.count from ' +
			'(select posturl, text, imageurl, date, timestamp, sequence, increment, count from posts join (select posturl, count, increment, ' +
				'timestamp, sequence from tracking join (select hostname, posturl, max(sequence) as sequence from likes join tracking using (posturl) ' +
					'group by hostname, posturl) as t using (posturl, sequence) order by increment desc limit ' + limit + ') as p using (posturl)) as w join tracking using (posturl) order by posturl, increment desc;';
			connection.query(q, function (err, result) {
				res.json(formatResponse(result, order, limit, 'trending'));
			});
		} else {
			res.send(404, 'Bad Parameters');
		}
		connection.end();
	});

};

// serve trends for target hostname blog
exports.targetTrends = function (req, res) {
	var hostname = req.params.hostname,
		q,
		limit = req.query.limit,
		order = req.query.order;
				
	pool.getConnection(function (err, connection) {
		connection.query('select * from blogs where hostname="' + hostname + '"',
		function(err, result) {
			if (result.length === 0) res.send(404);
			else {
				if (!limit) {
					limit = 20;
				}
				if (order.toLowerCase() === 'recent') {
					q = 'select posturl, text, imageurl, date, timestamp, sequence, increment, count from (select * from (select posturl from likes where hostname = "' + hostname + '") as m join posts using (posturl) order by date desc limit ' + limit + ') as top join tracking using (posturl) order by posturl, sequence;';
					connection.query(q, function (err, result) {
						res.json(formatResponse(result, order, limit, 'recent'));
					});
				} else if (order.toLowerCase() === 'trending') {
					q = 'select posturl, text, imageurl, date, tracking.timestamp, tracking.sequence, tracking.increment, tracking.count from ' +
						'(select posturl, text, imageurl, date, timestamp, sequence, increment, count from posts join ' +
						'(select posturl, count, increment, timestamp, sequence from (select posturl, max(sequence) as sequence from ' +
						'(select posturl from blogs join likes using (hostname) where hostname = "' + hostname + '") as p join tracking ' +
						'using (posturl) group by posturl) as p join tracking using (posturl, sequence) order by increment desc limit ' + limit + ') as trend using (posturl) ' +
						') as w join tracking using (posturl) order by posturl;';
					connection.query(q, function (err, result) {
						res.json(formatResponse(result, order, limit, 'trending'));
					});
				}

			}
		});
		connection.end();
	});
};
