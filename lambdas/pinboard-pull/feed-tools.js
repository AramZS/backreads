const fetch = require('node-fetch');
const xml2js = require('xml2js');

exports.fetchFeed = async (feed) => {
	const response = await fetch(feed)
	return await response.text()
}

exports.feedToJS = async (feedText) => {
	return await xml2js.parseStringPromise(feedText);
}

exports.feedJStoJSONString = async (rss) => {
	// console.log('output js', rss)
	// console.log('output js item', rss['rdf:RDF'].item)
	var items = rss['rdf:RDF'].item.map((item) => {
		if (item && item['$'] && item['$']['rdf:about']){
			if (item['$']['rdf:about'].match(/twitter\.com/g)){
				// ignore twitter links
			} else {
				return {
					source: item['$']['rdf:about'],
					title: item.title && item.title.length ? item.title[0] : item['$']['rdf:about'],
					description: item.description && item.description.length ? item.description[0] : "",
					tags: item["dc:subject"] && item["dc:subject"].length ? item["dc:subject"] : [],
					date: item["dc:date"] && item["dc:date"].length ? item["dc:date"][0] : (new Date()).toISOString(),
					platform: 'pinboard'
				};
			}
			
		}
	});
	const filteredItem = items.filter((item) => {
		if (item){
			return true
		} else {
			return false
		}
	})
	return JSON.stringify(filteredItem, null, 3);	
};