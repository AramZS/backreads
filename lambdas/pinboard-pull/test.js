var test = async function () {
	var f = require("node-fetch");
	var x = require("xml2js");
	console.log("start");
	var response = await f(
		"https://feeds.pinboard.in/rss/secret:7651932a7e7c6db975ea/u:AramZS/"
	);
	responseText = await response.text();
	console.log("output", responseText);
	var rss = await x.parseStringPromise(responseText);
	console.log("output js", rss);
	console.log("output js item", rss["rdf:RDF"].item);
	return rss["rdf:RDF"].item.map((item) => {
		if (item && item["$"] && item["$"]["rdf:about"]) {
			return item["$"]["rdf:about"];
		}
	});
};
var testOutput = test();

setTimeout(() => console.log("done", testOutput), 10000);

// Run via `node ./lambdas/pinboard-pull/test.js`
