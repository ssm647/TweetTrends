exports.handle = function(e, ctx, cb) {
  console.log('starting function');
  var Twitter = require('twitter');
  var sentiment = require('sentiment');
  var twitterAPI = require('node-twitter-api');
  var elasticsearch = require('elasticsearch');
  var NodeGeocoder = require('node-geocoder');

  var options = {
    provider: 'google',
    httpAdapter: 'https',   // Default
    apiKey: '', // for Mapquest, OpenCage, Google Premier
    formatter: null         // 'gpx', 'string', ...
  };
  
  var geocoder = NodeGeocoder(options);

  var client = new Twitter({
      consumer_key: '',
      consumer_secret: '',
      access_token_key: '',
      access_token_secret: ''
  });

  var conn = new elasticsearch.Client( {
    hosts: ['']
  });

    checkelastic()
    var AWS = require('aws-sdk');
    AWS.config.update({region: 'us-east-1'});
    var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
    var tweetTotalSentiment = 0;
    var stream = client.stream('statuses/filter', {track: e.keyword});
    stream.on('data', function(event) {
      if (event.lang === 'en' && event.place != null) {
        geocoder.geocode(event.place.full_name).then(function(res) {
          var lat = res[0].latitude;
          var long = res[0].longitude;
          var params = {
           DelaySeconds: 1,
           MessageAttributes: {
            "name": {
               DataType: "String",
               StringValue: event.user.name
             },
            "username": {
               DataType: "String",
               StringValue: event.user.screen_name
             },
            "profile_url": {
               DataType: "String",
               StringValue: event.user.profile_image_url_https
             },
            "latitude": {
              DataType: "String",
              StringValue: lat + ""
            },
            "longitude": {
               DataType: "String",
               StringValue: long + ""
            },
            "tweet_text": {
               DataType: "String",
               StringValue: event.text
            },
            "tweet_time": {
               DataType: "String",
               StringValue: event.created_at + ""
            }
           },
           MessageBody: "First SQS",
           QueueUrl: ""
          };
          sqs.sendMessage(params, function(err, data) {
            if (err) {
              console.log("Error", err);
            } else {
              console.log("Success", data.MessageId);
              var sns = new AWS.SNS();
              sns.publish({
                  Message: 'Test publish to SNS from Lambda',
                  TopicArn: ''
              }, function(err, data) {
                  if (err) {
                      console.log(err.stack);
                      return;
                  }
                  else{
                      console.log("Hello");
                  }
              });
            }
          });
        });
      }
    });
    stream.on('error', function(error) {
      throw error;
    });

    //Check if tweet index is in elasticsearch
    function checkelastic(){
      conn.search({
      index: 'tweets',
      type: 'tweets',
      body: {
          query: {
            match_all: {}
          },
        }
      },function (error, response,status) {
          if (error){
            console.log('No such Indexes exist');
          }
          else {
            deleteelastic();
          }
      });
    }

    //Delete the index from elasticsearch
    function deleteelastic(){
      conn.indices.delete({
         index: 'tweets'
      }, function(err, res) {
         if (err) {
             console.error(err.message);
         } else {
             console.log('Indexes have been deleted!');
         }
      });
    }
}
