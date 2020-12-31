const tools = require('../html-from-email')
const fs = require('fs')
const path = require('path');
const simpleParser = require('mailparser').simpleParser;
const jsdom = require("jsdom")
const { JSDOM } = jsdom
describe('feed tools', () => {
	let file
	beforeAll(async (done) => {
/**
			const response = await fetch('https://feeds.pinboard.in/rss/secret:7651932a7e7c6db975ea/u:AramZS/')
			fs.writeFileSync(path.join(__dirname, 'sampleFeed.xml'), await response.text())
 */
		const fileBuffer = fs.readFileSync(path.join(__dirname, 'sampleEmail'));
		file = fileBuffer.toString();
		done()
	  });
	  it('should parse an email', async (done) => {
		expect.assertions(4)
		simpleParser(file, null, (err, parsed) => {
			expect(parsed.headers.get('subject')).toBe('Weekly Newsletter: Subscription Confirmed')
			expect(parsed.html).toBeDefined()
			var dom = new JSDOM(parsed.html)
			expect(dom.window.document.querySelector('a.formEmailButton')).toBeDefined()
			var link = dom.window.document.querySelector('a.formEmailButton').href
			expect(link).toMatch("us13.mailchimp.com/mctx/clicks")
			done()
		});
	  })
});