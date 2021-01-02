const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const tools = require('./feed-tools')

const depositBucketName = process.env.DEPOSIT_BUCKET;
const feedName = process.env.FEED_NAME;

exports.handler = async function(event) {
	console.log("request:", JSON.stringify(event, undefined, 2));
	const feedAsString = await tools.fetchFeed(feedName)
	const rssJs = await tools.feedToJS(feedAsString)
	const feedAsJsonString = await tools.feedJStoJSONString(rssJs)
	var base64data = Buffer.from(feedAsJsonString);
	const upload = new Promise((resolve, reject) => {
		S3.upload({
			Bucket:depositBucketName,
			Key: 'pinboard/feed.json',
			Body: base64data
		  },function (resp) {
			console.log('Successfully uploaded package.', resp);
			resolve(resp)
		  });
	})
	await upload;
  };
