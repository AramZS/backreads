const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const tools = require('./feed-tools')

const username = process.env.USERNAME;
const password = process.env.PASSWORD;
const depositBucketName = process.env.DEPOSIT_BUCKET;

exports.handler = async function(event) {
	console.log("request:", JSON.stringify(event, undefined, 2));
	const cookieString = await tools.acquireAuth(username, password)
	const feedAsJSON = await tools.getFeed(cookieString, 1)
	const feedAsJsonString = tools.feedJStoJSONString(feedAsJSON)
	var base64data = Buffer.from(feedAsJsonString);
	const upload = new Promise((resolve, reject) => {
		S3.upload({
			Bucket:depositBucketName,
			Key: 'readup/feed.json',
			Body: base64data
		  },function (err, resp) {
			console.log('Successfully uploaded package.', resp);
			resolve(resp)
		  });
	})
	const uploadComplete = await upload;
	return { 
		uploadedFeed: { 
			uploadResult: uploadComplete,
			uploadBucket: depositBucketName,
			uploadKey:  'readup/feed.json'
		}
	};
  };
