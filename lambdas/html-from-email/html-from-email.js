const tools = require('./parsing-tools')
// const simpleParser = require('mailparser').simpleParser;
var MailParser = require("mailparser-mit").MailParser;
var AWS = require('aws-sdk');
const S3 = new AWS.S3();
const SNS = new AWS.SNS({apiVersion: '2010-03-31'})
var crypto = require('crypto');

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

const existsOnS3 = (bucket, key) => {
	return new Promise((resolve, reject) => {
		S3.headObject({ Bucket: bucket, Key: key }, (err, metadata) => {
			if (err && ['NotFound', 'Forbidden'].indexOf(err.code) > -1){
				 return resolve(false);
			}
			else if (err) {
				const e = Object.assign({}, Errors.SOMETHING_WRONG, { err });
				return reject(e);
			}
			return resolve(true);
		});
	});
}

/** sample input event 
 * 
 * {
  "links": {
    "links": [
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS8/5756c6a26ce954a71a8b4d74Befda9175",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cDovL3d3dy5ibG9vbWJlcmcuY29tL2Jjb20vc3RhdGljL2VtYWlsX2FkP2l1PS81MjYyL25ld3NsZXR0ZXIvYnVzaW5lc3Mmc3o9MjA2eDMxJnQ9/5756c6a26ce954a71a8b4d74B1271ec03",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuZmFjZWJvb2suY29tL2Jsb29tYmVyZ2J1c2luZXNzLw/5756c6a26ce954a71a8b4d74Bd5152494",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly90d2l0dGVyLmNvbS9idXNpbmVzcw/5756c6a26ce954a71a8b4d74B4d1b9a54",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS9hY2NvdW50L25ld3NsZXR0ZXJzL2V2ZW5pbmctYnJpZWZpbmc_c291cmNlPU5Mc2hhcmU/5756c6a26ce954a71a8b4d74Bc80a2fcf",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS9uZXdzL2FydGljbGVzLzIwMjAtMTItMzEvZmFzdGVyLXNwcmVhZGluZy1jb3ZpZC1zdHJhaW4tYWZmZWN0cy15b3VuZy10aGUtbW9zdC1zdHVkeS1zYXlzP2NtcGlkPUJCRDEyMzEyMF9CSVomdXRtX21lZGl1bT1lbWFpbCZ1dG1fc291cmNlPW5ld3NsZXR0ZXImdXRtX3Rlcm09MjAxMjMxJnV0bV9jYW1wYWlnbj1ibG9vbWJlcmdkYWlseQ/5756c6a26ce954a71a8b4d74B50f216ef",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS9uZXdzL2FydGljbGVzLzIwMjAtMTItMzAvbmV3LXN0cmFpbi1lbnRlcnMtY2FsaWZvcm5pYS1ueWMtcG9zaXRpdmUtcmF0ZS11cC12aXJ1cy11cGRhdGU_Y21waWQ9QkJEMTIzMTIwX0JJWiZ1dG1fbWVkaXVtPWVtYWlsJnV0bV9zb3VyY2U9bmV3c2xldHRlciZ1dG1fdGVybT0yMDEyMzEmdXRtX2NhbXBhaWduPWJsb29tYmVyZ2RhaWx5/5756c6a26ce954a71a8b4d74B7f805b1f",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly90d2l0dGVyLmNvbS9kYXZpZHJvdmVsbGE_bGFuZz1lbg/5756c6a26ce954a71a8b4d74B6bf41311",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS9ncmFwaGljcy9jb3ZpZC12YWNjaW5lLXRyYWNrZXItZ2xvYmFsLWRpc3RyaWJ1dGlvbi8_Y21waWQ9QkJEMTIzMTIwX0JJWiZ1dG1fbWVkaXVtPWVtYWlsJnV0bV9zb3VyY2U9bmV3c2xldHRlciZ1dG1fdGVybT0yMDEyMzEmdXRtX2NhbXBhaWduPWJsb29tYmVyZ2RhaWx5/5756c6a26ce954a71a8b4d74Bb351d34f",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS9ncmFwaGljcy8yMDIwLXd1aGFuLW5vdmVsLWNvcm9uYXZpcnVzLW91dGJyZWFrLz9jbXBpZD1CQkQxMjMxMjBfQklaJnV0bV9tZWRpdW09ZW1haWwmdXRtX3NvdXJjZT1uZXdzbGV0dGVyJnV0bV90ZXJtPTIwMTIzMSZ1dG1fY2FtcGFpZ249Ymxvb21iZXJnZGFpbHk/5756c6a26ce954a71a8b4d74Bdb28ef9f",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS9ncmFwaGljcy8yMDIwLXVuaXRlZC1zdGF0ZXMtY29yb25hdmlydXMtb3V0YnJlYWsvP2NtcGlkPUJCRDEyMzEyMF9CSVomdXRtX21lZGl1bT1lbWFpbCZ1dG1fc291cmNlPW5ld3NsZXR0ZXImdXRtX3Rlcm09MjAxMjMxJnV0bV9jYW1wYWlnbj1ibG9vbWJlcmdkYWlseQ/5756c6a26ce954a71a8b4d74B97dd6cb0",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS9uZXdzL2FydGljbGVzLzIwMjAtMTItMzEvdGVzbGEtc2hvcnRzLXNlbGxlcnMtbG9zdC0zOC1iaWxsaW9uLWluLTIwMjAtYXMtc3RvY2stc3VyZ2VkP2NtcGlkPUJCRDEyMzEyMF9CSVomdXRtX21lZGl1bT1lbWFpbCZ1dG1fc291cmNlPW5ld3NsZXR0ZXImdXRtX3Rlcm09MjAxMjMxJnV0bV9jYW1wYWlnbj1ibG9vbWJlcmdkYWlseQ/5756c6a26ce954a71a8b4d74B90573957",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly90YXNrYW5kcHVycG9zZS5jb20vbmV3cy9mMzUtam9pbnQtc3RyaWtlLWZpZ2h0ZXItc3BhcmUtcGFydHMtY29zdC8/5756c6a26ce954a71a8b4d74B5838145f",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly90YXNrYW5kcHVycG9zZS5jb20vbWlsaXRhcnktdGVjaC9mMzUtam9pbnQtc3RyaWtlLWZpZ2h0ZXItZGVmaWNpZW5jaWVzLTIwMjAv/5756c6a26ce954a71a8b4d74B4d387ccb",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS9uZXdzL2FydGljbGVzLzIwMjAtMTItMTgvYWlyLWZvcmNlLW9wZW5lZC1jcmltaW5hbC1wcm9iZS1hZnRlci1hLWxvY2toZWVkLWYtMzUtZ3JvdW5kaW5nP2NtcGlkPUJCRDEyMzEyMF9CSVomdXRtX21lZGl1bT1lbWFpbCZ1dG1fc291cmNlPW5ld3NsZXR0ZXImdXRtX3Rlcm09MjAxMjMxJnV0bV9jYW1wYWlnbj1ibG9vbWJlcmdkYWlseQ/5756c6a26ce954a71a8b4d74B2a5aa086",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS9uZXdzL2FydGljbGVzLzIwMjAtMTItMzEvcGVudGFnb24ta2VlcHMtMzk4LWJpbGxpb24tZi0zNS1zLWZ1bGwtcmF0ZS1wcm9kdWN0aW9uLW9uLWhvbGQ_Y21waWQ9QkJEMTIzMTIwX0JJWiZ1dG1fbWVkaXVtPWVtYWlsJnV0bV9zb3VyY2U9bmV3c2xldHRlciZ1dG1fdGVybT0yMDEyMzEmdXRtX2NhbXBhaWduPWJsb29tYmVyZ2RhaWx5/5756c6a26ce954a71a8b4d74Bc28c1a38",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS9uZXdzL2FydGljbGVzLzIwMjAtMTItMjMvbmV4dC1nZW5lcmF0aW9uLXUtcy1udWNsZWFyLXN1Yi1mYWNpbmctY29zdC1vdmVycnVucy1kZWxheXM_Y21waWQ9QkJEMTIzMTIwX0JJWiZ1dG1fbWVkaXVtPWVtYWlsJnV0bV9zb3VyY2U9bmV3c2xldHRlciZ1dG1fdGVybT0yMDEyMzEmdXRtX2NhbXBhaWduPWJsb29tYmVyZ2RhaWx5/5756c6a26ce954a71a8b4d74B99d3c96f",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS9uZXdzL2FydGljbGVzLzIwMjAtMTItMzEvZ29sZC1oZWFkcy1mb3ItYmVzdC15ZWFyLWluLWEtZGVjYWRlLXdpdGgtZG9sbGFyLW9uLXRoZS1yb3Blcz9jbXBpZD1CQkQxMjMxMjBfQklaJnV0bV9tZWRpdW09ZW1haWwmdXRtX3NvdXJjZT1uZXdzbGV0dGVyJnV0bV90ZXJtPTIwMTIzMSZ1dG1fY2FtcGFpZ249Ymxvb21iZXJnZGFpbHk/5756c6a26ce954a71a8b4d74B7a99e596",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS9uZXdzL2FydGljbGVzLzIwMjAtMTItMzEvbWljcm9zb2Z0LXNheXMtc3VzcGVjdGVkLXJ1c3NpYW4taGFja2Vycy12aWV3ZWQtc291cmNlLWNvZGU_Y21waWQ9QkJEMTIzMTIwX0JJWiZ1dG1fbWVkaXVtPWVtYWlsJnV0bV9zb3VyY2U9bmV3c2xldHRlciZ1dG1fdGVybT0yMDEyMzEmdXRtX2NhbXBhaWduPWJsb29tYmVyZ2RhaWx5/5756c6a26ce954a71a8b4d74B9ba3cd25",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS9uZXdzL2FydGljbGVzLzIwMjAtMTItMzEvaG9tZWJ1eWVycy1pbi11LXMtZmFjZS13b3JzdC1hZmZvcmRhYmlsaXR5LXNxdWVlemUtaW4tMTIteWVhcnM_Y21waWQ9QkJEMTIzMTIwX0JJWiZ1dG1fbWVkaXVtPWVtYWlsJnV0bV9zb3VyY2U9bmV3c2xldHRlciZ1dG1fdGVybT0yMDEyMzEmdXRtX2NhbXBhaWduPWJsb29tYmVyZ2RhaWx5/5756c6a26ce954a71a8b4d74Bd795c106",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS9uZXdzL2FydGljbGVzLzIwMjAtMTItMzEvcG9zc2libGUtdHJ1bXAtcGFyZG9uLW92ZXJzaGFkb3dzLWFzc2FuZ2UtZXh0cmFkaXRpb24tcnVsaW5nP2NtcGlkPUJCRDEyMzEyMF9CSVomdXRtX21lZGl1bT1lbWFpbCZ1dG1fc291cmNlPW5ld3NsZXR0ZXImdXRtX3Rlcm09MjAxMjMxJnV0bV9jYW1wYWlnbj1ibG9vbWJlcmdkYWlseQ/5756c6a26ce954a71a8b4d74B3d581b94",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS9uZXdzL2FydGljbGVzLzIwMjAtMTItMzAvdS1zLXN0YXRlcy1yZXdyaXRlLXZhY2NpbmUtcnVsZXMtdG8tZ2V0LWNvdmlkLXNob3RzLW1vdmluZz9jbXBpZD1CQkQxMjMxMjBfQklaJnV0bV9tZWRpdW09ZW1haWwmdXRtX3NvdXJjZT1uZXdzbGV0dGVyJnV0bV90ZXJtPTIwMTIzMSZ1dG1fY2FtcGFpZ249Ymxvb21iZXJnZGFpbHk/5756c6a26ce954a71a8b4d74Be0764225",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS9uZXdzL2FydGljbGVzLzIwMjAtMTItMzEvcmVzdGF1cmFudHMtYnJhY2UtZm9yLWEtbmV3LXllYXItcy1ldmUtd2l0aG91dC1tdWNoLWNlbGVicmF0aW9uP2NtcGlkPUJCRDEyMzEyMF9CSVomdXRtX21lZGl1bT1lbWFpbCZ1dG1fc291cmNlPW5ld3NsZXR0ZXImdXRtX3Rlcm09MjAxMjMxJnV0bV9jYW1wYWlnbj1ibG9vbWJlcmdkYWlseQ/5756c6a26ce954a71a8b4d74Bbcb67d5f",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS9uZXdzL2FydGljbGVzLzIwMjAtMTItMzEvZWxvbi1tdXNrLWplZmYtYmV6b3Mtc21hc2gtcmVjb3Jkcy1hcy13b3JsZC1zLXJpY2hlc3QtcGVvcGxlLWFkZC0xLTgtdHJpbGxpb24_Y21waWQ9QkJEMTIzMTIwX0JJWiZ1dG1fbWVkaXVtPWVtYWlsJnV0bV9zb3VyY2U9bmV3c2xldHRlciZ1dG1fdGVybT0yMDEyMzEmdXRtX2NhbXBhaWduPWJsb29tYmVyZ2RhaWx5/5756c6a26ce954a71a8b4d74Bb9befaa7",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS9uZXdzL2FydGljbGVzLzIwMjAtMTItMzAvY2hpbmEtcy1ib3R0bGVkLXdhdGVyLWtpbmctZGV0aHJvbmVzLWFtYmFuaS1hcy1hc2lhLXMtcmljaGVzdD9jbXBpZD1CQkQxMjMxMjBfQklaJnV0bV9tZWRpdW09ZW1haWwmdXRtX3NvdXJjZT1uZXdzbGV0dGVyJnV0bV90ZXJtPTIwMTIzMSZ1dG1fY2FtcGFpZ249Ymxvb21iZXJnZGFpbHk/5756c6a26ce954a71a8b4d74B47bb73fe",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS9uZXdzL2FydGljbGVzLzIwMjAtMTItMzAvZG9sbGFyLWF0LTItMS0yLXllYXItbG93LWFzaWEtc3RvY2tzLXRvLWRpcC1tYXJrZXRzLXdyYXA_Y21waWQ9QkJEMTIzMTIwX0JJWiZ1dG1fbWVkaXVtPWVtYWlsJnV0bV9zb3VyY2U9bmV3c2xldHRlciZ1dG1fdGVybT0yMDEyMzEmdXRtX2NhbXBhaWduPWJsb29tYmVyZ2RhaWx5/5756c6a26ce954a71a8b4d74B34cc18ca",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS9uZXdzL2FydGljbGVzLzIwMjAtMTItMzEvdHJ1bXAtYnVkZ2V0LWNoaWVmLWhhbXBlcnMtYmlkZW4tdHJhbnNpdGlvbi13aXRoLWJhbi1vbi1tZWV0aW5ncz9jbXBpZD1CQkQxMjMxMjBfQklaJnV0bV9tZWRpdW09ZW1haWwmdXRtX3NvdXJjZT1uZXdzbGV0dGVyJnV0bV90ZXJtPTIwMTIzMSZ1dG1fY2FtcGFpZ249Ymxvb21iZXJnZGFpbHk/5756c6a26ce954a71a8b4d74B8e480d6e",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS9uZXdzL2FydGljbGVzLzIwMjAtMTItMzEvY292aWQta2VlcHMtbWlsbGlvbnMtZnJvbS13b3JrLWp1c3QtYXMtdS1zLWVjb25vbXktbG9zZXMtc3RlYW0_Y21waWQ9QkJEMTIzMTIwX0JJWiZ1dG1fbWVkaXVtPWVtYWlsJnV0bV9zb3VyY2U9bmV3c2xldHRlciZ1dG1fdGVybT0yMDEyMzEmdXRtX2NhbXBhaWduPWJsb29tYmVyZ2RhaWx5/5756c6a26ce954a71a8b4d74Bb3a8833b",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS9uZXdzL2FydGljbGVzLzIwMjAtMTItMzEvdS1zLWpvYmxlc3MtY2xhaW1zLWRlY2xpbmUtdW5leHBlY3RlZGx5LXdoaWxlLXN0YXlpbmctZWxldmF0ZWQ_Y21waWQ9QkJEMTIzMTIwX0JJWiZ1dG1fbWVkaXVtPWVtYWlsJnV0bV9zb3VyY2U9bmV3c2xldHRlciZ1dG1fdGVybT0yMDEyMzEmdXRtX2NhbXBhaWduPWJsb29tYmVyZ2RhaWx5/5756c6a26ce954a71a8b4d74B3508cf96",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly9iaXQubHkvMzVpaFFIeA/5756c6a26ce954a71a8b4d74B6d123cf1",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS9vcGluaW9uL2FydGljbGVzLzIwMjAtMTItMzEvYXJrLXMtY2F0aGllLXdvb2QtYmV0cy1vbi1kbmEtaW5ub3ZhdG9ycz9jbXBpZD1CQkQxMjMxMjBfQklaJnV0bV9tZWRpdW09ZW1haWwmdXRtX3NvdXJjZT1uZXdzbGV0dGVyJnV0bV90ZXJtPTIwMTIzMSZ1dG1fY2FtcGFpZ249Ymxvb21iZXJnZGFpbHk/5756c6a26ce954a71a8b4d74B9e293857",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS9vcGluaW9uL2FydGljbGVzLzIwMjAtMTItMzEvYXJrLXMtY2F0aGllLXdvb2QtYmV0cy1vbi1kbmEtaW5ub3ZhdG9ycz9jbXBpZD1CQkQxMjMxMjBfQklaJnV0bV9tZWRpdW09ZW1haWwmdXRtX3NvdXJjZT1uZXdzbGV0dGVyJnV0bV90ZXJtPTIwMTIzMSZ1dG1fY2FtcGFpZ249Ymxvb21iZXJnZGFpbHk/5756c6a26ce954a71a8b4d74C9e293857",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS9zdWJzY3JpcHRpb25zP3V0bV9zb3VyY2U9bmV3c2xldHRlciZ1dG1fbWVkaXVtPWVtYWlsJnV0bV9jYW1wYWlnbj1ibG9vbWJlcmdkYWlseQ/5756c6a26ce954a71a8b4d74Bb70085cb",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly9hcHBsZS5jby9ibG9vZHJpdmVy/5756c6a26ce954a71a8b4d74B44278af7",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly9vcGVuLnNwb3RpZnkuY29tL3Nob3cvNW4xanJXYndoQnVLbkw2VE1pS3hKbj9zaT1DRnBPeEdIclNuaXVVWE1zN1BfbHNB/5756c6a26ce954a71a8b4d74B592858be",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly9pdHVuZXMuYXBwbGUuY29tL3VzL3BvZGNhc3QvZGVjcnlwdGVkL2lkMTE2MTg4MDkxNj9tdD0y/5756c6a26ce954a71a8b4d74Bd4606a93",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly9vcGVuLnNwb3RpZnkuY29tL3Nob3cvNmhFVGk5b0JkMjZ2YzBiUmdYWU41Vw/5756c6a26ce954a71a8b4d74B87580342",
      "https://link.mail.bloombergbusiness.com/click/16070283.145331/aHR0cDovL2xpbmsubWFpbC5ibG9vbWJlcmdidXNpbmVzcy5jb20vY2xpY2svMTAyNzYwMTcuMTgzNTczL2FIUjBjSE02THk5cGRIVnVaWE11WVhCd2JHVXVZMjl0TDJGd2NDOWhjSEJzWlMxemRHOXlaUzlwWkRJNE1UazBNVEE1Tno5d2REMDRPVFE1Sm1OMFBYSmxiR0YxYm1Ob1gyVnRZV2xzSm0xMFBUZy81NmZiZWNjMWU5YThhMjQxMDc4YjQ4YjFCOWU2MDcyNDE/58091eb2b84a994a148b4b20B42849805",
      "https://link.mail.bloombergbusiness.com/click/16070283.145331/aHR0cDovL2xpbmsubWFpbC5ibG9vbWJlcmdidXNpbmVzcy5jb20vY2xpY2svMTAyNzYwMTcuMTgzNTczL2FIUjBjSE02THk5d2JHRjVMbWR2YjJkc1pTNWpiMjB2YzNSdmNtVXZZWEJ3Y3k5a1pYUmhhV3h6UDJsa1BXTnZiUzVpYkc5dmJXSmxjbWN1WVc1a2NtOXBaQzV3YkhWekpuSmxabVZ5Y21WeVBYVjBiVjl6YjNWeVkyVWxNMFJsYldGcGJDVXlOblYwYlY5allXMXdZV2xuYmlVelJISmxiR0YxYm1Oby81NmZiZWNjMWU5YThhMjQxMDc4YjQ4YjFCNDMwMDQ2ODA/58091eb2b84a994a148b4b20Bc061af45",
      "https://link.mail.bloombergbusiness.com/click/15638356.78421/aHR0cHM6Ly93d3cuYmxvb21iZXJnLmNvbS9wcm9mZXNzaW9uYWwvc29sdXRpb24vYmxvb21iZXJnLXRlcm1pbmFsLw/55088ec43b35d034698d38aeBe3d4e6ab",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cHM6Ly9sb2dpbi5ibG9vbWJlcmcuY29tL25ld3NsZXR0ZXJzP3NvdXJjZT1uZXdzbGV0dGVyX3Vuc3ViJmVtYWlsPWdpdmVtZXlvdXJuZXdzbGV0dGVyJTQwYXJhbXpzLm1lJmhhc2g9YmRlOTk3ZWM1ODc5OTI3MDYxM2MxYWRlMDFhMTI3NmU/5756c6a26ce954a71a8b4d74B62d24622",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cDovL2Jsb29tYmVyZy5jb20/5756c6a26ce954a71a8b4d74Bf3e02c21",
      "https://link.mail.bloombergbusiness.com/click/22534452.104710/aHR0cDovL3d3dy5ibG9vbWJlcmcuY29tL2ZlZWRiYWNrP2FsY21waWQ9bW9zdHBvcA/5756c6a26ce954a71a8b4d74B4e18a022",
      ""
    ]
  },
  "sentHtmlLocation": "emails-html/dt=2021-01-02/27guv0ca6h4gnf8l6dhh4ahuj9tj20fbmebgaeo1.html",
  "sentLinks": {
    "ETag": "\"a218dfc783100751cfbc672e9dc032b8\"",
    "Location": "https://texts-for-processing.s3.amazonaws.com/emails-links/dt%3D2021-01-02/27guv0ca6h4gnf8l6dhh4ahuj9tj20fbmebgaeo1.json",
    "key": "emails-links/dt=2021-01-02/27guv0ca6h4gnf8l6dhh4ahuj9tj20fbmebgaeo1.json",
    "Key": "emails-links/dt=2021-01-02/27guv0ca6h4gnf8l6dhh4ahuj9tj20fbmebgaeo1.json",
    "Bucket": "texts-for-processing"
  }
}
 * 
 */

exports.handler = async function(event) {
	console.log("html-from-email request:", JSON.stringify(event, undefined, 2));
	const depositBucket = process.env.DEPOSIT_BUCKET
	const linksProcessingTopicArn = process.env.LINKS_PROCESSING_TOPIC
	try {
		const snsObject = tools.parseDataFromRecord(event)
		const receiptBucket = tools.getBucketFromEmailEvent(snsObject)
		const receiptKey = tools.getPathFromEmailEvent(snsObject)
		console.log("html-from-email bucket:", receiptBucket);
		console.log("html-from-email objectKey:", receiptKey);
		const email = await getText(receiptBucket, receiptKey)
		const emailHtml = await getEmailHtml(email)

		const emailName = (receiptKey.split('/'))[1]
		const dtKey = ((new Date().toISOString("en-US", {timezone: "America/New_York"})).split("T")[0])
		
		let handleLinks = async (link, pageObj) => {
			var date = ((new Date().toISOString("en-US", {timezone: "America/New_York"})).split("T")[0])
			var md5sum = crypto.createHash('md5');
			md5sum.update(link);
			var linkhash = md5sum.digest('hex');
			var linkObj = {
				date: date,
				description: pageObj.description,
				hash: linkhash,
				platform: "email",
				source: link,
				tags: [],
				title: pageObj.title,
				weight: 1
			}
			var exists = await existsOnS3(process.env.DEPOSIT_BUCKET, 'item/' + linkObj.hash + ".json")
			let uploadResult = {}
			let uploadResultDate = {}
			let finalLinkObj = {}
			if (!exists){
				finalLinkObj = linkObj
				uploadResult = await uploadDatastreamToS3(process.env.DEPOSIT_BUCKET, 'item/' + linkObj.hash + ".json",  Buffer.from(JSON.stringify(linkObj)))
				
			} else {
				var fileText = await getText(process.env.DEPOSIT_BUCKET, 'item/' + linkObj.hash + ".json")
				var oldLinkObj = JSON.parse(fileText)
				if (oldLinkObj.hasOwnProperty('weight')){
					oldLinkObj.weight = oldLinkObj.weight + 1
				} else {
					// Base email weight is 1
					oldLinkObj.weight = 1
				}
				if (linkObj.description.length > oldLinkObj.description.length) {
					oldLinkObj = linkObj.description
				}
				finalLinkObj = oldLinkObj
				uploadResult = await uploadDatastreamToS3(process.env.DEPOSIT_BUCKET, 'item/' + linkObj.hash + ".json",  Buffer.from(JSON.stringify(oldLinkObj)))
			}
			uploadResultDate = await uploadDatastreamToS3(process.env.DEPOSIT_BUCKET, 'dailyLinks/' + date + '/' + linkObj.hash + ".json",  Buffer.from(JSON.stringify(finalLinkObj)))
			return {uploadResult, uploadResultDate}
		}

		const linkset = tools.getLinksFromEmailHTML(emailHtml)
		handleLinks = null
		const resolvedLinkSet = await tools.resolveLinks(linkset, handleLinks)
		const sendHtml = await uploadDatastreamToS3(receiptBucket, 'emails-html/'+dtKey+'/'+emailName+'.html', Buffer.from(emailHtml))
		console.log('Push email HTML to ', receiptBucket, 'emails-html/'+dtKey+'/'+emailName+'.html')
		const sendLinks = await uploadDatastreamToS3(receiptBucket, 'emails-links/'+dtKey+'/'+emailName+'.json', Buffer.from(JSON.stringify(resolvedLinkSet)))
		console.log('Push email links to ', receiptBucket, 'emails-links/'+dtKey+'/'+emailName+'.json')
		// https://aws.amazon.com/blogs/compute/building-event-driven-architectures-with-amazon-sns-fifo/ 
		var publishTextPromise = await SNS.publish({
			Message: JSON.stringify({
				uploadBucket: receiptBucket,
				uploadKey: 'emails-links/'+dtKey+'/'+emailName+'.json'
			}),
			TopicArn: linksProcessingTopicArn,
			MessageGroupId: 'JOB' + dtKey + emailName,
			MessageDeduplicationId: dtKey + emailName 
		}).promise();
		console.log('Topic publish complete:', publishTextPromise)
		console.log('Completed links out of ', linkset.length, ' a total of links processed were ', resolvedLinkSet.length)
		/**


		*/
		return {
			links: linkset,
			sentHtmlLocation: 'emails-html/'+dtKey+'/'+emailName+'.html',
			resolvedLinksFile: sendLinks,
			resolvedLinks: resolvedLinkSet,
			topicPublishEvent: publishTextPromise
		};
	} catch (e) {
		console.log('Lambda failed with error ', e)
		return e
	}
  };

/** https://cdkworkshop.com/20-typescript/30-hello-cdk/200-lambda.html */