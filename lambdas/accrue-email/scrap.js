var AWS = require('aws-sdk');
const S3 = new AWS.S3();

var dtString = ((new Date().toISOString("en-US", {timezone: "America/New_York"})).split("T")[0]);
var lastDate = new Date()
lastDate.setDate(lastDate.getDate() - 1)
var lastDateString = (lastDate.toISOString("en-US", {timezone: "America/New_York"})).split("T")[0]
console.log(lastDateString)

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
console.log('Test')
getEmailLinksets('texts-for-processing', 'emails-links/' + lastDateString + '/').then((result) => { console.log(result) })

