const tools = require('./parsing-tools')
// const simpleParser = require('mailparser').simpleParser;
var MailParser = require("mailparser-mit").MailParser;
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
					console.log('Error in JSON retrieval: ', error)
					reject('Error in JSON retrieval: ' + JSON.stringify(error) + ' ' + JSON.stringify(err));
					//reject(error);
				}
			}
		);
		// console.log('response is ', response);
	});
};

const getEmailHtml = (text) => {
	return new Promise((resolve, reject) => {
		var mailparser = new MailParser();
		try {
			// console.log('result retrieved', data);
			mailparser.on("end", function(mail_object){
				resolve(mail_object.html)
			});
			mailparser.write(text);
			mailparser.end();
		} catch (error) {
			console.log('Error in Email parsing: ', error)
			reject('Error in Email parsing: ' + JSON.stringify(error));
			//reject(error);
		}
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
	console.log("html-from-email request:", JSON.stringify(event, undefined, 2));
	try {
		const snsObject = tools.parseDataFromRecord(event)
		const receiptBucket = tools.getBucketFromEmailEvent(snsObject)
		const receiptKey = tools.getPathFromEmailEvent(snsObject)
		console.log("html-from-email bucket:", receiptBucket);
		console.log("html-from-email objectKey:", receiptKey);
		const email = await getText(receiptBucket, receiptKey)
		const emailHtml = await getEmailHtml(email)

		const emailName = (receiptKey.split('/'))[1]
		const dtKey = 'dt=' + ((new Date().toISOString("en-US", {timezone: "America/New_York"})).split("T")[0])
		
		const linkset = tools.getLinksFromEmailHTML(emailHtml)
		const resolvedLinkSet = await tools.resolveLinks(linkset)
		const sendHtml = await uploadDatastreamToS3(receiptBucket, 'emails-html/'+dtKey+'/'+emailName+'.html', Buffer.from(emailHtml))
		console.log('Push email HTML to ', receiptBucket, 'emails-html/'+dtKey+'/'+emailName+'.html')
		const sendLinks = await uploadDatastreamToS3(receiptBucket, 'emails-links/'+dtKey+'/'+emailName+'.json', Buffer.from(JSON.stringify(resolvedLinkSet)))
		console.log('Push email links to ', receiptBucket, 'emails-links/'+dtKey+'/'+emailName+'.json')
		console.log('Complete')
		/**


		*/
		return {
			links: linkset,
			sentHtml: sendHtml,
			sentLinks: sendLinks
		};
	} catch (e) {
		console.log('Lambda failed with error ', e)
		return e
	}
  };

/** https://cdkworkshop.com/20-typescript/30-hello-cdk/200-lambda.html */