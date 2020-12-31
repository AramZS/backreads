const jsdom = require("jsdom")
const { JSDOM } = jsdom
const fetch = require('node-fetch');
const metascraper = require('metascraper')([
	require('metascraper-url')(),
	require('metascraper-title')(),
  ])
exports.parseDataFromRecord = function (event) {
	return JSON.parse(event.Records[0].Sns.Message)
}

exports.getBucketFromEmailEvent = function(message) {
	return message.receipt.action.bucketName
}

exports.getPathFromEmailEvent = function(message) {
	return message.receipt.action.objectKey
}

exports.getLinksFromEmailHTML = function(html){
	const virtualConsole = new jsdom.VirtualConsole();
	// virtualConsole.on("error", () => { console.log(error) });
	// virtualConsole.sendTo(c, { omitJSDOMErrors: true });
	var dom = new JSDOM(html, { pretendToBeVisual: false, virtualConsole })
	const linksJson = { links: [] }
	var links = dom.window.document.querySelectorAll('a')
	const testRegex = RegExp('unsubscribe')
	links.forEach(link => {
		if (!testRegex.test(link.innerText)){
			linksJson.links.push(link.href)
		}
	});
	return linksJson
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.resolveLinks = async function(linkSet){
	const testRegex = RegExp('unsubscribe')
	const linksResolve = linkSet.links.map(async (link, index) => {
		await timeout(index*1000)
		var r = await fetch(link, {redirect: 'follow'})
		let url = r.url
		let text = await r.text();
		const virtualConsole = new jsdom.VirtualConsole();
		// virtualConsole.on("error", () => { console.log(error) });
		// virtualConsole.sendTo(c, { omitJSDOMErrors: true });
		var dom = new JSDOM(text, { pretendToBeVisual: false, virtualConsole })
		try {
			url = dom.window.document.querySelector('link[rel=canonical]').href
			return { title: window.document.querySelector('title').innerText, url }
		} catch (e){}
		try {
			const metadata = await metascraper({ html: text, url })
			// console.log('metadata retrieved', metadata)
			if (metadata.url){
				url = metadata.url
			}
			return {title: metadata.hasOwnProperty('title') ? metadata.title : '', url}
		} catch (e){
			return {title: '', url}
		}
	});
	var linksResolved = await Promise.all(linksResolve)
	return { links: linksResolved}
}