var AWS = require('aws-sdk');
const S3 = new AWS.S3();
const getText = (bucket, key) => {
	return new Promise((resolve, reject) => {
		const response = S3.getObject(
			{ Bucket: bucket, Key: key },
			(err, data) => {
				// console.log({ Bucket: getBucket(), Key: file }, 'getJSON result');
				try {
					// console.log('result retrieved', data);
					const results = data.Body.toString();
					resolve(results);
				} catch (error) {
					console.log('Error in retrieval: ', error)
					reject('Error in retrieval: ' + JSON.stringify(error) + ' ' + JSON.stringify(err));
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

exports.handler = async function(event) {
	console.log("accrue email request:", JSON.stringify(event, undefined, 2));
	var retrievalObject = {
		Bucket: event.sentLinks.Bucket,
		Key: event.sentLinks.Key
	}
	var linksText = await getText(event.sentLinks.Bucket, event.sentLinks.Key)
	var linksJSON = JSON.parse(linksText)
	var linksCount = linksJSON.links.length
	var dtString = ((new Date().toISOString("en-US", {timezone: "America/New_York"})).split("T")[0]);
	let dailyData = {
		emailCount: linksCount,
		links: {}
	}
	try {
		dailyData = await getText(process.env.DEPOSIT_BUCKET, 'emails/'+dtString+'/links.json')
		dailyData.emailCount += 1
		linksJSON.links.forEach((linkObj) => {
			if (dailyData.links.hasOwnProperty(linkObj.url)){
				dailyData.links[linkObj.url].count += 1
				if (dailyData.links[linkObj.url].title.length < 5){
					dailyData.links[linkObj.url].title = linkObj.title
				}
			} else {
				dailyData.links[linkObj.url] = { 
					title: linkObj.title, 
					url: linkObj.url,
					count: 1 
				}
			}
		})
	} catch (e) {
		linksJSON.links.forEach((linkObj) => {
			dailyData.links[linkObj.url] = { 
				title: linkObj.title, 
				url: linkObj.url,
				count: 1 
			}
		})
	}
	var updateDailyEmailLinks = await uploadDatastreamToS3(process.env.DEPOSIT_BUCKET, 'emails/'+dtString+'/links.json', Buffer.from(JSON.stringify(dailyData)))
	return {
		emailDateLevel: dtString,
		uploaded: updateDailyEmailLinks
	}
	
}