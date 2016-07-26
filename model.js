const request = require("request");
const Pool = require('pg-pool');
const dateFormat = require('dateformat');
const url = require("url");
var model = {};

/*
* @param {subscriptKey} Microsoft subscript key.
*/
module.exports = (function(subscriptKey){
    
    const db_url = process.env.DATABASE_URL || 'postgres://ubuntu:111111@localhost:5432/imgsearch';
    const params =  url.parse(db_url);
    const auth = params.auth.split(':');
    
    var config = {
        host: params.hostname || 'localhost',
        database: params.pathname.split('/')[1] || 'imgsearch',
        user: auth[0],
        password: auth[1],
        port: params.port || 5432,
        ssl: true,
        max: 20, //set pool max size to 20
        min: 4, //set min pool size to 4
        idleTimeoutMillis: 1000 //close idle clients after 1 second
    };

    model.subscriptKey = subscriptKey;

    model.getImages = getImages;
    model.getRecent = getRecent;
    model.saveQuery = saveQuery;
    
    model.initDB = initDB;
    model.close = closeConnections;
    
    model.db = new Pool(config);
    // model.db.on('unhandledRejection', function(err) {
    //   console.log('idle client error', err.message, err.stack);
    // });

    return model;
});

/**
 * Go to Google Search Engine for search results. Work them and
 * get the JSON response.
 *
 * @param {search_text} text to search images.
 * @param {per_page} number of found images to get [1..10].
 * @param {page_num} number of page with results from 0...
 * @param {callback(err, data)} call when search results are ready.
 *      return them as array of objects:
 *      [{
 *          "url" : full image url,
 *		    "snippet" : outline of the image,
 *	    	"thumbnail" : full thumbnail url,
 *	    	"context" : url of the site with image
 *      }]
 * @public
 */
function getImages(search_text, per_page, page_num, callback){
    checkBorders(1, 10, per_page);
    checkBorders(0, 1000, page_num);

    var address = 'https://api.cognitive.microsoft.com/bing/v5.0/images/search'+
        '?q=' + search_text +
        '&count=' + per_page +
        '&offset=' + page_num +
        '&mkt=en-us' +
        '&safeSearch=Moderate';
    
    request({
        url: address,
        json: true,
        headers: {
            'Ocp-Apim-Subscription-Key': model.subscriptKey
        }
    }, function (err, res, body) {
        if(err) callback(err, null);
        else if(res.statusCode === 200) {
            try{
                var arr = []; // result array of objects
                var waititems = Math.min(per_page, body.value.length);
                body.value.forEach(function (x){
                    arr.push({
                        "url" : x.contentUrl,
                        "snippet" : x.name,
                        "thumbnail" : x.thumbnailUrl,
                        "context" : x.hostPageUrl
                    });
                    waititems--;
                    if(waititems === 0) callback(null, arr);
                });
            }
            catch(err){
                callback(err, null);
            }
        }
        else callback("Error getting data from search engine. Status code: " + res.statusCode);
    });
}


function checkBorders(min, max, val){
    if(isNaN(val)) val = max;
    else if(val > max) val = max;
    else if(val < min) val = min;
}


/**
 * Returns array of objects describe most recent search queries.
 *
 * @param {num_items} number of getting results from 1 to 20.
 * @param {callback(err, data)} call when data will ready. data is the array
 *  of objects:
 *      [{
 *          "term" : query text,
		    "when" : string with date of the search ("2016-07-23T09:31:32.009Z")
 *      }]
 * 
 * @public
 */
function getRecent(num_items, callback){
    var results = [];

    model.db.connect().then(function(client) {
        var query = client.query("SELECT query, date FROM queries ORDER BY date DESC LIMIT $1;", [num_items]);
        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push({
                "term": row.query,
                "when": row.date
            });
        });
        // After all data is returned, close connection and return results
        query.on('end', function() {
            callback(null, results);
        });
        query.on('error', function (err) {
            callback(err, null);
        });
    }).catch(function(err) {
        callback(err, null);
  });
}


/**
 * Saves search query to the database.
 *
 * @param {search_text} query text.
 * @param {date} date of the query.
 * @param {callback(err)} emits when done.
 * @public
 */
function saveQuery(search_text, date, callback){
    var date_text = "'" + dateFormat(date, "yyyy-mm-dd HH:MM:ss") + "'";
    model.db.connect().then(function(client) {
        var query = client.query("INSERT INTO queries(query, date) values($1, $2)", [search_text, date_text]);
        query.on('end', function () {
            client.release();
            callback(null);
        });
        query.on('error', function (err) {
            client.release();
            callback(err);
        });
    })
    .catch(function(err) {
        callback(err, null);
    });
}


/**
 * Close all connections to database.
 *
 * @param {callback()} call when db closed.
 *  If there are no errors return null
 * @public
 */
function closeConnections(callback) {
    model.db.end();
    if(typeof(callback) === "function") callback();
}


/**
 * create table 'SearchRequests'.
 * @public
 */
function initDB(callback) {
    console.log('Start to creade database.');
    var local_cl = null;
    model.db.connect()
    .then(function(client)  {
		local_cl = client;
        return local_cl.query(
            'CREATE TABLE IF NOT EXISTS queries(' +
            'id SERIAL PRIMARY KEY' +
            ', query VARCHAR(512) not null' +
            ', date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW());');
    })
    .then(function(res)  {
        console.log('Table "queries" created.');
        return local_cl.query("select 1 from pg_indexes where indexname='queries_date_index' limit 1;");
    })
    .then(function(res)  {
		if(res !== undefined && res.rowCount === 0) return local_cl.query('CREATE INDEX queries_date_index ON queries (date);');
		return null;
	})
	.then(function(res) {
		if(res !== null) console.log('Idenx for queries table created.');
		console.log('Creade database finished.');
		local_cl.release();
		if(typeof(callback) === "function") callback();
	})
    .catch(function(err) {
		console.error('Error init DB: ', err.message, err.stack);
		if(local_cl !== null) local_cl.release();
		if(typeof(callback) === "function") callback();
	});
}