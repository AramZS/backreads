var AWS = require('aws-sdk');
const S3 = new AWS.S3();
const Mustache = require("mustache");
const fs = require("fs");
const jsdom = require('jsdom')
const { JSDOM } = jsdom;
const emailChartBuilder = require('./email-charts.js')

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
	dataStream,
	metaData
) => {
	return new Promise((resolve, reject) => {
		S3.upload(
			{
				Bucket,
				Key,
				Body: dataStream,
				...metaData
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
		version: "0.1.1"
	}
	templateStrings.emailCount = linkset.emailCount
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

exports.convertDateToLocalString = function(dateObj){
	var dateSet = (dateObj.toLocaleString("en-US", {timezoneName: "ET"}).split(",")[0]).split('/');
	var month = dateSet[0].length < 2 ? `0${dateSet[0]}` : dateSet[0]
	var day = dateSet[1].length < 2 ? `0${dateSet[1]}` : dateSet[1]
	var dateIs = `${dateSet[2]}-${month}-${day}`;
	return dateIs;
}

exports.generatePreviousDate = function( daysBefore, pathMode ){
	var lastDate = new Date()
	lastDate.setDate(lastDate.getDate() - daysBefore)
	var string = exports.convertDateToLocalString(lastDate);
	if (pathMode){
		const splitDate = string.split('-')
		return splitDate[0]+"/"+splitDate[1]+"/"+splitDate[2]
	}
	return string
}

const getCount = async function (date, type){
	const linksetString = await getText(process.env.PICKUP_BUCKET, 'emails/' + date + '/links.json')
	const linkData = JSON.parse(linksetString)
	return {
		date,
		count: linkData[type+'Count']
	}
}

exports.composeEmail = async function(){
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
	const linkCounts = [{
		date: dates[0],
		count: Object.keys(linkset.links).length
	}]
	const emailCounts = [{
		date: dates[0],
		count: linkset.emailCount
	}]
	const promiseArray = [];
	let n = 1
	while (n < 8) {
		promiseArray.push((async (date) => {
			const linksetString = await getText(process.env.PICKUP_BUCKET, 'emails/' + date + '/links.json')
			const linkData = JSON.parse(linksetString)
			return {
				data: linkData, date: date
			};
		})(dates[n]))
		n++
	}
	const linkDatas = await Promise.all(promiseArray);
	linkDatas.forEach((aLinkset) => {
		linkCounts.push({ date: aLinkset.date, count: Object.keys(aLinkset.data.links).length })
		emailCounts.push({ date: aLinkset.date, count: aLinkset.data.emailCount })
	})

	console.log('counts', 'links', linkCounts, 'emails', emailCounts)
	// TODO: build link histograph - last 7 days and last 7 of this day of the week - https://www.d3-graph-gallery.com/graph/histogram_basic.html
	// https://github.com/d3-node/d3-node
	// https://d3node-test-zs.glitch.me/basic-line
	let html = exports.generateHTML(linkset, dates[0])
	let jsDomObj = new JSDOM(html)
	console.log('Start trying to insert charts')
	try {
		jsDomObj  = emailChartBuilder.generateChartOntoHTML(emailCounts, jsDomObj, '#emails-over-time__chart')
	} catch (e) {
		console.log('First chart generation failed', e)
	}
	try {
		jsDomObj  = emailChartBuilder.generateChartOntoHTML(linkCounts, jsDomObj, '#links-over-time__chart')
	} catch (e) {
		console.log('Second chart generation failed', e)
	}
	console.log('HTML with charts ready for upload')
	return {
		html: jsDomObj.serialize(),
		date: dates[0]
	};
}

exports.handler = async function(event) {
	console.log("assemble email page request:", JSON.stringify(event, undefined, 2));
	const emailComposition = await exports.composeEmail()
	const html = emailComposition.html
	const date = emailComposition.date
	console.log('Run upload for html for ', date)
	var updateDailyEmailLinks = await uploadDatastreamToS3(process.env.DEPOSIT_BUCKET, 'emails/'+date+'/index.html', Buffer.from(html), 		{
			ContentType: "text/html",
			ACL:'public-read'
		}
	)
	console.log('Upload of dated index - ', updateDailyEmailLinks)
	var updateTodayEmailLinks = await uploadDatastreamToS3(process.env.DEPOSIT_BUCKET, 'emails/index.html', Buffer.from(html),
		{
			ContentType: "text/html",
			ACL:'public-read'
		}
	)
	console.log('Upload of nondated index - ', updateTodayEmailLinks)
	const cloudfront = new AWS.CloudFront();
	const invalidateEvent = await cloudfront.createInvalidation({
        DistributionId: process.env.DISTRIBUTION_ID,
        InvalidationBatch: {
            CallerReference: `backreads-email-${new Date().getTime()}`,
            Paths: {
                Quantity: 2,
				Items: [
					'/emails/'+date+'/index.html',
					'/emails/index.html'
				],
            },
        },
    }).promise();
	console.log('Invalidation event - ', invalidateEvent)
	console.log('Email page build complete')
	return {
		emailDateLevel: updateDailyEmailLinks,
		emailMainLevel: updateTodayEmailLinks,
		invalidation: invalidateEvent
	}

}
