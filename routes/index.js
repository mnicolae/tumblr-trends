
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'CSC309-A2 Tumblr Trends' });
};