# tumblr-trends

On any single day Tumblr.com receives well over 50 million new posts. 

With such a massive number of new items every day, it is very hard to find great 
content likely to become popular until it already has. Until now … This project is 
a server capable of tracking popular posts on Tumblr.

## Important note:

The server is currently not running. To run it, in terminal:

	node app.js

Then, to run the client, in browser:

	http://127.0.0.1:31280/

## Authors:

[Jiang Tao Hong](http://github.com/jianghong)    
[Kevin Leung](http://github.com/kevleung)  
[Mihai Nicolae](http://github.com/mnicolae)   
[Philip Ojha](http://github.com/oojhaa)  

## Instructor:

**Juan Gonzales**  

## Links:

[Assignment handout](http://csc309.fabspaces.cc/?page_id=105)

## Documentation: 

Our server is running on nodejs and built on the express web framework.

Our main server file is 'app.js' and the functions that handle the requests is blog.js.

We use the official tumblr API client available through 'npm tumblr.js'.

We use cron to run a tracking function at the top of every hour. All posts in our database will be checked to see if there are changes in its note count.

We use mysql on a remote server to store all the information tracked. The schemas are of tables are shown in an image:

[MySQL Table Schemas](http://bit.ly/16qkPYE)

[Database ER Diagram](http://dl.dropbox.com/u/61875648/db_schema.jpg)

Sequence diagram for our services:

[Sequence diagram](http://dl.dropbox.com/u/61875648/db_seq_diagram.jpg)

### Mandatory Services:

POST a new blog: 
	
	/blog

GET trends for a single blog: 

	/blog/{base-hostname}/trends
	Parameters: 
		order : "trending"/"recent",
		limit : maximum number of results to return (optional). Default: 20

GET trends for all blogs:

	/blogs/trends
	Parameters: 
		order : "trending"/"recent",
		limit : maximum number of results to return (optional). Default: 20

If order = 'trending' then the posts will be sorted by largest latest increments in note count.

If order = 'recent', then the posts will be sorted by the date the posts were created.

### Optional Services:

Home page currently runs the sample client provided by the professor. It gets data from:

	/blogs/trends?order=trending

GET the list of blogs being tracked:

	/blogs

GET the list of posts being tracked:

	/posts

GET the list of tracking info about each post:

	/tracking

GET the list of likes:

	/likes

## How to run:

	node app.js

## Node dependencies:

* express
* jade
* tumblr.js
* mysql
* cron

