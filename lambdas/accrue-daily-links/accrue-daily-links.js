var AWS = require('aws-sdk');
const S3 = new AWS.S3();
const getText = (bucket, key) => {
	return new Promise((resolve, reject) => {
		const response = S3.getObject(
			{ Bucket: bucket, Key: key },
			(err, data) => {
				// console.log({ Bucket: getBucket(), Key: file }, 'getJSON result');
				if ((err && err.statusCode >= 400) || (data && data.statusCode >= 400)){
					console.log('File does not exist.')
					reject( 'File does not exist' )
				}
				try {
					// console.log('result retrieved', data);
					const results = data.Body.toString();
					resolve(results);
				} catch (error) {
					console.log('Error in retrieval of '+bucket+'/'+key+': ', error)
					reject('Error in retrieval: ' + JSON.stringify(error) + ' ' + JSON.stringify(err) + data);
					//reject(error);
				}
			}
		);
		// console.log('response is ', response);
	});
};

const uploadDatastreamToS3 = (
	Bucket,
	Key,
	dataStream
) => {
	return new Promise((resolve, reject) => {
		S3.upload(
			{
				Bucket,
				Key,
				Body: dataStream
			},
			(error, data) => {
				if (error) {
					console.log('Error occured', error, data);
					reject(error)
				}
				// console.log(err, data);
				resolve(data);
			}
		);
	});
};

const getLinksets = async function(bucket, path){
	return new Promise((resolve, reject) => {
		const response = S3.listObjectsV2(
			{
				Bucket: bucket, 
				Prefix: path,
				MaxKeys: 5000
			},
			(err, data) => {
				// console.log(data)
				resolve(data)
			})
	})
}

exports.handler = async function(event) {
	console.log("accrue email request:", JSON.stringify(event, undefined, 2));
	var dtString = ((new Date().toISOString("en-US", {timezone: "America/New_York"})).split("T")[0]);
	var lastDate = new Date()
	lastDate.setDate(lastDate.getDate() - 1)
	var lastDateString = (lastDate.toISOString("en-US", {timezone: "America/New_York"})).split("T")[0]
	let dailyData = {
		linkCount: 0,
		links: {}
	}
	// Pick up from stroy links
	const linksets = await getLinksets(process.env.PICKUP_BUCKET, 'dailyLinks/' + lastDateString + '/')
	console.log('Linkset: ', linksets)
	dailyData.linkCount = linksets.KeyCount
	var promiseSet = linksets.Contents.map((s3Object) => {
		return new Promise(resolve => {
			getText(process.env.PICKUP_BUCKET, s3Object.Key).then(data => {
				let linkFile = JSON.parse(data)
				if (linkFile) {
					const finalLinkObj = { 
						...linkFile
					}
					resolve(finalLinkObj)
				} else {
					resolve(null)
				}
			})
		});
	})
	var resolvedLinkSet = await Promise.all(promiseSet)
	dailyData.links = resolvedLinkSet
	var updateDailyLinks = await uploadDatastreamToS3(process.env.DEPOSIT_BUCKET, 'dailyLinks/'+lastDateString+'/links.json', Buffer.from(JSON.stringify(dailyData)))
	console.log('resolved', resolvedLinkSet)
	return {
		resolved: {
			bucket: process.env.DEPOSIT_BUCKET,
			key: 'emails/'+lastDateString+'/links.json'
		},
		emailDateLevel: lastDateString,
		uploaded: updateDailyLinks
	}
	
}