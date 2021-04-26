const BackreadsLink = require('../index')
describe('Link Object should work as expected', () => {
	let LinkObj
	beforeAll(async (done) => {
		console.log('lib', BackreadsLink)
		LinkObj = BackreadsLink.LinkObj
		done()
	})
	it('should get a feed list status set', async (done) => {
		const link =    {
			"source": "https://www.niemanlab.org/2020/11/whoa-im-crying-worrisome-buckle-up-the-swift-complicated-rise-of-eric-feigl-ding-and-his-covid-tweet-threads/",
			"title": "Untitled (https://www.niemanlab.org/2020/11/whoa-im-crying-worrisome-buckle-up-the-swift-complicated-rise-of-eric-feigl-ding-and-his-covid-tweet-threads/)",
			"description": "I retweeted a comment by a doctor about Covid today and this is essential context for the problematic way he approaches Twitter (and online harassment) \n\n",
			"tags": [],
			"date": "2020-12-26T20:42:42+00:00",
			"platform": "https://instapaper.com"
		 }
		let aNewLinkObj = new LinkObj(link)
		expect(aNewLinkObj).toBeDefined();
		expect(aNewLinkObj.source).toBeDefined();
		expect(aNewLinkObj.title).toBeDefined();
		expect(aNewLinkObj.description).toBeDefined();
		expect(aNewLinkObj.weight).not.toBeDefined();
		done()
	}, 6000)

})
