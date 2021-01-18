var AWS = require('aws-sdk');
const S3 = new AWS.S3();
const Mustache = require("mustache");
const fs = require("fs");


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

exports.generateHTML = (linkset, date) => {
	let templateStrings = {
		emailCount: 0,
		linkCount: 0,
		date: date,
		links: [],
		linksString: '',
		fileDepth: "../",
		version: "0.0.1"
	}
	templateStrings.emailCount = templateStrings.emailCount
	const linksArray = Object.keys(linkset.links)
	templateStrings.linkCount = linksArray.length

	const linkSetsArrayArray = Object.entries(linkset.links);
	const linkSetsArray = linksArray.map(arrayedLink => linkset.links[arrayedLink]);

	let linkSetsArraySorted = linkSetsArray.sort(
		(a, b) => {
			return b.count - a.count
		}
	);

	templateStrings.links = linkSetsArraySorted
	templateStrings.linksString = JSON.stringify(linkSetsArraySorted, null, 4)

	var file = fs.readFileSync("./index.mst").toString();
	var html = Mustache.render(file, templateStrings);
	return html;
}

exports.generatePreviousDate = function( daysBefore, pathMode ){
	var lastDate = new Date()
	lastDate.setDate(lastDate.getDate() - daysBefore)
	var string = (lastDate.toISOString("en-US", {timezone: "America/New_York"})).split("T")[0];
	if (pathMode){
		const splitDate = string.split('-')
		return splitDate[0]+"/"+splitDate[1]+"/"+splitDate[2]
	}
	return string
}


exports.handler = async function(event) {
	console.log("accrue email request:", JSON.stringify(event, undefined, 2));
	var dates = {
		0: exports.generatePreviousDate(1, false),
		1: exports.generatePreviousDate(2, false),
		2: exports.generatePreviousDate(3, false),
		3: exports.generatePreviousDate(4, false),
		4: exports.generatePreviousDate(5, false),
		5: exports.generatePreviousDate(6, false),
		6: exports.generatePreviousDate(7, false),
		7: exports.generatePreviousDate(8, false)

	}

	const linksetString = await getText(process.env.PICKUP_BUCKET, 'emails/' + dates[0] + '/links.json')
	const linkset = JSON.parse(linksetString)
	const html = exports.generateHTML(linkset, dates[0])
	var updateDailyEmailLinks = await uploadDatastreamToS3(process.env.DEPOSIT_BUCKET, 'emails/'+lastDateString+'/index.html', Buffer.from(html))
	var updateTodayEmailLinks = await uploadDatastreamToS3(process.env.DEPOSIT_BUCKET, 'emails/index.html', Buffer.from(html))
	console.log('final', dailyData)
	return {
		emailDateLevel: updateDailyEmailLinks,
		emailMainLevel: updateTodayEmailLinks
	}
	
}