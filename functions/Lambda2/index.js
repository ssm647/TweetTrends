exports.handle = function(e, ctx, cb) {
  var AWS = require('aws-sdk');
  AWS.config.update({region: 'us-east-1'});
  var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
  var queueURL = "";
  var elasticsearch = require('elasticsearch');
  var sentiment = require('sentiment');

  var params = {
   AttributeNames: ["All"],
   MaxNumberOfMessages: 10,
   MessageAttributeNames: ["All"],
   QueueUrl: queueURL,
   VisibilityTimeout: 5,
   WaitTimeSeconds: 5
 };

  var conn = new elasticsearch.Client( {
    hosts: ['']
  });

  sqs.receiveMessage(params, function(err, data) {
    if (err) {
        console.log("Receive Error", err);
    } else if (data.Messages) {
        console.log(data.Messages[0].MessageAttributes);
        var result = sentiment(data.Messages[0].MessageAttributes.tweet_text.StringValue);
        var finalresult = result.score;
        conn.index({
          index: 'tweets',
          type: 'tweets',
          body: {
            "name": data.Messages[0].MessageAttributes.name.StringValue,
            "username": data.Messages[0].MessageAttributes.username.StringValue,
            "profile_url": data.Messages[0].MessageAttributes.profile_url.StringValue,
            "latitude": data.Messages[0].MessageAttributes.latitude.StringValue,
            "longitude": data.Messages[0].MessageAttributes.longitude.StringValue,
            "tweet_text": data.Messages[0].MessageAttributes.tweet_text.StringValue,
            "tweet_time": data.Messages[0].MessageAttributes.tweet_time.StringValue,
            "sentiment": finalresult
          }
      },function(err,resp,status) {
          console.log(resp);
      });
      var deleteParams = {
        QueueUrl: queueURL,
        ReceiptHandle: data.Messages[0].ReceiptHandle
      };
      console.log(data);
      sqs.deleteMessage(deleteParams, function(err, data) {
        if (err) {
          console.log("Delete Error", err);
        } else {
          console.log("Message Deleted", data);
        }
      });
    }
  });
}
