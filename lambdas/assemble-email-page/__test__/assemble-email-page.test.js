const handler = require('../assemble-email-page')
const fs = require('fs')
const path = require('path');

/** const metascraper = require('metascraper')([
	require('metascraper-url')(),
	require('metascraper-title')(),
  ]) */
describe('create email page', () => {
	it('should parse a record event', async (done) => {
		const dataString = fs.readFileSync(path.join(__dirname, "email-links.json")).toString();
		const data = JSON.parse(dataString);
		let html = handler.generateHTML(data, handler.generatePreviousDate(1, false))
		expect(html).toBeDefined();
		expect(html).toMatch(/house-begins-final-push-to-make-trump-the-only-president-to-be-impeached-twice/)
		fs.writeFileSync(path.join(__dirname, "email-links.html"), html);
		done()
	})
	it('should get a correct date', async (done) => {
		let dateString = handler.convertDateToLocalString(new Date())
		expect(dateString).toBeDefined();
		expect(dateString).toMatch(/^2021-/)
		let dateStringTwo = handler.convertDateToLocalString(new Date('1/22/2020'))
		expect(dateStringTwo).toBeDefined();
		expect(dateStringTwo).toMatch('2020-01-22')
		let dateStringThree = handler.convertDateToLocalString(new Date('12/1/2020'))
		expect(dateStringThree).toBeDefined();
		expect(dateStringThree).toMatch('2020-12-01')
		let dateStringFour = handler.convertDateToLocalString(new Date('02/04/2020'))
		expect(dateStringFour).toBeDefined();
		expect(dateStringFour).toMatch('2020-02-04')
		done()
	})
	it('should create a full email report', async (done) => {
		process.env.PICKUP_BUCKET = 'backreads'
		process.env.DEPOSIT_BUCKET = 'backreads'
		process.env.AWS_PROFILE = 'aram'
		let {html, date} = await handler.composeEmail()
		expect(html).toBeDefined();
		expect(date).toBeDefined();
		fs.writeFileSync(path.join(__dirname, "email-links-full.html"), html);
		done()
	})
})
