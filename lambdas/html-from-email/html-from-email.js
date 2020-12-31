const tools = require('./parsing-tools')
const simpleParser = require('mailparser').simpleParser;
var AWS = require('aws-sdk');
const S3 = new AWS.S3();

export const getText = (bucket, key) => {
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
					reject('Error in JSON retrieval: ' + JSON.stringify(error) + ' ' + JSON.stringify(err));
					//reject(error);
				}
			}
		);
		// console.log('response is ', response);
	});
};

export const getEmailHtml = (text) => {
	return new Promise((resolve, reject) => {
		try {
			// console.log('result retrieved', data);
			simpleParser(file, null, (err, parsed) => {
				resolve(parsed.html)
			});
		} catch (error) {
			reject('Error in Email parsing: ' + JSON.stringify(error) + ' ' + JSON.stringify(err));
			//reject(error);
		}
		// console.log('response is ', response);
	});
};

export const uploadDatastreamToS3 = (
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
	console.log("html-from-email request:", JSON.stringify(event, undefined, 2));
	const snsObject = tools.parseDataFromRecord(event)
	console.log("html-from-email bucket:", receiptBucket);
	console.log("html-from-email objectKey:", receiptKey);
	const receiptBucket = tools.getBucketFromEmailEvent(snsObject)
	const receiptKey = tools.getPathFromEmailEvent(snsObject)
	const email = await getText(receiptBucket, receiptKey)
	const emailHtml = await getEmailHtml(email)
	const emailName = (receiptKey.split('/'))[1]
	const dtKey = 'dt=' + ((new Date().toISOString("en-US", {timezone: "America/New_York"})).split("T")[0])
	const parallelProcesses = []
	parallelProcesses.push(uploadDatastreamToS3(receiptBucket, 'emails-html/'+dtKey+'/'+emailName+'.html', Buffer.from(emailHtml)))
	const linkset = tools.getLinksFromEmailHTML(emailHtml)
	const resolvedLinkSet = tools.resolveLinks(linkset)
	parallelProcesses.push(uploadDatastreamToS3(receiptBucket, 'emails-links/'+dtKey+'/'+emailName+'.json', Buffer.from(JSON.stringify(emailHtml))))
	await Promise.all(parallelProcesses)
	return {
	  statusCode: 200,
	  headers: { "Content-Type": "text/plain" },
	  body: `Hello, CDK! You've hit ${event.path}\n`
	};
  };

/** https://cdkworkshop.com/20-typescript/30-hello-cdk/200-lambda.html */