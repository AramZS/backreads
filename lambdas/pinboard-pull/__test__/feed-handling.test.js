const tools = require('../feed-tools')
const fs = require('fs')
const path = require('path');
const fetch = require('node-fetch');

describe('feed tools', () => {
	let file
	beforeAll(async (done) => {
/**
			const response = await fetch('https://feeds.pinboard.in/rss/secret:7651932a7e7c6db975ea/u:AramZS/')
			fs.writeFileSync(path.join(__dirname, 'sampleFeed.xml'), await response.text())
 */
		const fileBuffer = fs.readFileSync(path.join(__dirname, 'sampleFeed.xml'));
		file = fileBuffer.toString();
		done()
	  });
	it('should parse a feed', async (done) => {
		const js = await tools.feedToJS(file)
		expect(js).toHaveProperty('rdf:RDF')
		expect(js['rdf:RDF']).toHaveProperty('item')
		expect(js['rdf:RDF'].item.length).toBeDefined()
		expect(js['rdf:RDF'].item.length > 0).toBeTruthy()
		done()
	});
	it('should parse a feed into an item json string', async (done) => {
		/** 
		 * Example item
		 * 
		{
        '$': { 'rdf:about': 'https://emshea.com/post/serverless-cicd' },
        title: [ 'A basic CI/CD pipeline for serverless apps' ],
        'dc:date': [ '2020-12-24T23:59:12+00:00' ],
        link: [ 'https://emshea.com/post/serverless-cicd' ],
        'dc:creator': [ 'AramZS' ],
        description: [
          "For deploying my applications, I have a CI/CD pipeline that uses the AWS Serverless Application Model (SAM), GitHub, and CircleCI. In this post I'll show you…"
        ],
        'dc:source': [ 'https://instapaper.com/' ],
        'dc:identifier': [ 'https://pinboard.in/u:AramZS/b:c830470c08ba/' ]
      },
		*/
		const js = await tools.feedToJS(file)
		const jsonString = await tools.feedJStoJSONString(js)
		const json = JSON.parse(jsonString);
		fs.writeFileSync(path.join(__dirname, 'sampleJSON.json'), jsonString)
		expect(json).toBeDefined()
		expect(json[0]).toHaveProperty('title')
		expect(json[0]).toHaveProperty('source')
		expect(json[0]).toHaveProperty('description')
		expect(json[0]).toHaveProperty('tags')
		expect(json[0].tags.length).toBeDefined()
		expect(json[0]).toHaveProperty('date')
		expect(json[json.length - 1]).not.toBe(null)
		expect(json[json.length - 1]).toHaveProperty('title')
		expect(json[json.length - 1]).toHaveProperty('source')
		expect(json[json.length - 1]).toHaveProperty('description')
		expect(json[json.length - 1]).toHaveProperty('tags')
		expect(json[json.length - 1].tags.length).toBeDefined()
		expect(json[json.length - 1]).toHaveProperty('date')
		done()
	});
});