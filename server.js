﻿var http = require('http');
var port = process.env.port || 5000;
var async = require('async'),
    CronJob = require('cron').CronJob,
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    FeedParser = require('feedparser'),
    request = require('request'),
    logtimestamp = require('log-timestamp');


//mongoose.connect('mongodb://localhost/rrsdb');
mongoose.connect('mongodb://fsdbuser:***p0rject@ds062797.mongolab.com:62797/feedstore')

var feedSchema = new Schema({
    _id: String
}, { strict: false });

var Feed = mongoose.model('Feed', feedSchema);

var job = new CronJob({
    cronTime: '0 */5 * * * *',
    
    onTick: function () {
        
        var req = request('http://feeds.feedburner.com/ampparit-kaikki'),
            feedparser = new FeedParser();
        
        var bulk = Feed.collection.initializeUnorderedBulkOp();
        
        req.on('error', function (err) {
            throw err;
        });
        
        req.on('response', function (res) {
            var stream = this;
            
            if (res.statusCode != 200) {
                return this.emit('error', new Error('Bad status code'));
            } else {
                console.log("res OK");
            }
            
            stream.pipe(feedparser);

        });
        
        feedparser.on('error', function (err) {
            throw err;
        });
        
        feedparser.on('readable', function () {
            
            var stream = this,
                meta = this.meta,
                item;
            
            while (item = stream.read()) {
                item._id = item.guid;
                delete item.guid;
                bulk.find({ _id: item._id }).upsert().updateOne({ "$set": item });
            }

        });
        
        feedparser.on('end', function () {
            console.log('at end');
            bulk.execute(function (err, response) {
                // Shouldn't be one as errors should be in the response
                // but just in case there was a problem connecting the op
                if (err) throw err;
                
                // Just dumping the response for demo purposes
                console.log(JSON.stringify(response, undefined, 4));

            });
        });
        
    var xmlHttp = null;
    var url = "http://feedwebnodejs-dataalbum.rhcloud.com";
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET",url , false );
    xmlHttp.send( null );
    console.log(xmlHttp.responseText);

    },
    start: true
});

mongoose.connection.on('open', function (err, db) {
    job.start();
});

http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello World\n');
}).listen(process.env.OPENSHIFT_NODEJS_PORT || 3000);
