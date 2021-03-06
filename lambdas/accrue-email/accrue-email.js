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

const getEmailLinksets = async function(bucket, path){
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

exports.convertDateToLocalString = function(dateObj){
	var dateSet = (dateObj.toLocaleString("en-US", {timezoneName: "ET"}).split(",")[0]).split('/'); 
	var month = dateSet[0].length < 2 ? `0${dateSet[0]}` : dateSet[0]
	var day = dateSet[1].length < 2 ? `0${dateSet[1]}` : dateSet[1]
	var dateIs = `${dateSet[2]}-${month}-${day}`;
	return dateIs;
}

exports.handler = async function(event) {
	console.log("accrue email request:", JSON.stringify(event, undefined, 2));
	var lastDate = new Date()
	lastDate.setDate(lastDate.getDate() - 1)
	var lastDateString = exports.convertDateToLocalString(lastDate)
	let dailyData = {
		emailCount: 0,
		links: {}
	}
	const linksets = await getEmailLinksets(process.env.PICKUP_BUCKET, 'emails-links/' + lastDateString + '/')
	console.log('Linkset: ', linksets)
	dailyData.emailCount = linksets.KeyCount
	var promiseSet = linksets.Contents.map((s3Object) => {
		return new Promise(resolve => {
			getText(process.env.PICKUP_BUCKET, s3Object.Key).then(data => {
				let emailLinks = JSON.parse(data)
				emailLinks.links.forEach((linkObj) => {
					if (dailyData.links.hasOwnProperty(linkObj.source)){
						dailyData.links[linkObj.source].count += 1
						if (dailyData.links[linkObj.source].title.length < 5){
							dailyData.links[linkObj.source].title = linkObj.title
						}
					} else {
						dailyData.links[linkObj.source] = { 
							title: linkObj.title, 
							url: linkObj.source,
							count: 1 
						}
					}
					if (!dailyData.links[linkObj.source].title || dailyData.links[linkObj.source].title.includes("Access Denied") || dailyData.links[linkObj.source].title.includes("Access denied")){
						dailyData.links[linkObj.source].title = "Link: " + linkObj.source
					}
				})
				resolve(dailyData)
			})
		});
	})
	var resolvedSet = await Promise.all(promiseSet)
	var updateDailyEmailLinks = await uploadDatastreamToS3(process.env.DEPOSIT_BUCKET, 'emails/'+lastDateString+'/links.json', Buffer.from(JSON.stringify(dailyData)))
	console.log('final', dailyData)
	return {
		resolved: {
			bucket: process.env.DEPOSIT_BUCKET,
			key: 'emails/'+lastDateString+'/links.json'
		},
		emailDateLevel: lastDateString,
		uploaded: updateDailyEmailLinks
	}
	
}