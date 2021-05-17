var crypto = require('crypto');
// var fs = require('fs');

var md5sum = crypto.createHash('md5');
md5sum.update('https://tedium.co/2020/12/30/tedium-trends-2021/');
var d = md5sum.digest('hex');
console.log('md5 hash', d)
