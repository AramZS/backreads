const fs = require('fs')
const path = require('path');
const handler = require('../accrue-list-tweets')
describe('get twitter feeds', () => {
	let file
	beforeAll(async (done) => {
		require('dotenv').config()
		done()
	})
	it('should get a feed list status set', async (done) => {
		const feedListId = "930182383739002881"
		let jsonData = await handler.getListStatuses(feedListId)
		expect(jsonData).toBeDefined();
		expect(jsonData[0].created_at).toBeDefined();
		expect(jsonData[0].entities).toBeDefined();
		expect(jsonData[0].entities).toBeDefined();
		fs.writeFileSync(path.join(__dirname, "feed.json"), JSON.stringify(jsonData, null, 4));
		done()
	}, 15000)
	it('should pop the max_id element off', async (done) => {
		const twitterfeed = JSON.parse(fs.readFileSync(path.join(__dirname, "feed.json")));
		expect(twitterfeed).toBeDefined();
		const length = twitterfeed.length;
		expect(twitterfeed[0].created_at).toBeDefined();
		var aContinuableStatusFeed = handler.getContinuableList(twitterfeed)
		expect(aContinuableStatusFeed).toBeDefined()
		expect(aContinuableStatusFeed.statuses).toBeDefined()
		expect(aContinuableStatusFeed.max_id_key).toBeDefined()
		expect(aContinuableStatusFeed.max_id_element).toBeDefined()
		expect(aContinuableStatusFeed.statuses.length).toBeGreaterThan(1)
		expect(aContinuableStatusFeed.statuses.length).toBeLessThan(length)
		done()
	})
	it('should add a page to a status list', async (done) => {
		const feedListId = "930182383739002881"
		let jsonData = await handler.getListStatuses(feedListId)
		const length = jsonData.length;
		const expandedList = await handler.addPageToListStatuses(feedListId, jsonData)
		expect(expandedList[0].created_at).toBeDefined();
		expect(expandedList.length).toBeGreaterThan(length)
		done()
	})
	it('should get a date', async (done) => {
		const twitterfeed = JSON.parse(fs.readFileSync(path.join(__dirname, "feed.json")));
		expect(twitterfeed).toBeDefined();
		expect(twitterfeed[0].created_at).toBeDefined();
		expect(handler.getTweetDate(twitterfeed[0])).toBeInstanceOf(Date)
		done()
	})
	it('should filter a feed by date', async (done) => {
		const twitterfeed = [
			{
				"created_at": "Fri Mar 26 19:53:54 +0000 2021",
				"id": 1375536510481621000,
				"id_str": "1375536510481620992",
			},
			{
				"created_at": "Thu Mar 25 23:51:44 +0000 2021",
				"id": 1375535964299362300,
				"id_str": "1375535964299362310",
				"text": "RT @dog_rates: This is Frida. She has a mustache. It somehow grew in way before her ears did. 14/10 please appreciate her https://t.co/XRRX…",
			},
			{
				"created_at": "Thu Mar 25 19:51:44 +0000 2021",
				"id": 1375535964299362301,
				"id_str": "1375535964299362310",
				"text": "RT @dog_rates: This is Frida. She has a mustache. It somehow grew in way before her ears did. 14/10 please appreciate her https://t.co/XRRX…",
			},
			{
				"created_at": "Thu Mar 25 00:02:44 +0000 2021",
				"id": 1375535964299362302,
				"id_str": "1375535964299362310",
				"text": "RT @dog_rates: This is Frida. She has a mustache. It somehow grew in way before her ears did. 14/10 please appreciate her https://t.co/XRRX…",
			},
			{
				"created_at": "Wed Mar 24 19:51:44 +0000 2021",
				"id": 1375535964299362303,
				"id_str": "1375535964299362310",
				"text": "RT @dog_rates: This is Frida. She has a mustache. It somehow grew in way before her ears did. 14/10 please appreciate her https://t.co/XRRX…",
			}
		]
		expect(twitterfeed).toBeDefined();
		expect(twitterfeed[0].created_at).toBeDefined();
		const fixedFeed = handler.filterTwitterStatusByDate(twitterfeed, new Date('Fri Mar 25 00:02:44 +0000 2021'));
		// console.log(fixedFeed)
		expect(fixedFeed.length).toBe(3)
		done()
	})
	it('should consider the feed by done by day before target date', async (done) => {
		const twitterfeed = { statuses: [
				{
					"created_at": "Fri Mar 26 19:53:54 +0000 2021",
					"id": 1375536510481621000,
					"id_str": "1375536510481620992",
				},
				{
					"created_at": "Thu Mar 25 23:51:44 +0000 2021",
					"id": 1375535964299362300,
					"id_str": "1375535964299362310",
					"text": "RT @dog_rates: This is Frida. She has a mustache. It somehow grew in way before her ears did. 14/10 please appreciate her https://t.co/XRRX…",
				},
				{
					"created_at": "Thu Mar 25 19:51:44 +0000 2021",
					"id": 1375535964299362301,
					"id_str": "1375535964299362310",
					"text": "RT @dog_rates: This is Frida. She has a mustache. It somehow grew in way before her ears did. 14/10 please appreciate her https://t.co/XRRX…",
				},
				{
					"created_at": "Thu Mar 25 00:02:44 +0000 2021",
					"id": 1375535964299362302,
					"id_str": "1375535964299362310",
					"text": "RT @dog_rates: This is Frida. She has a mustache. It somehow grew in way before her ears did. 14/10 please appreciate her https://t.co/XRRX…",
				},
				{
					"created_at": "Wed Mar 24 19:51:44 +0000 2021",
					"id": 1375535964299362303,
					"id_str": "1375535964299362310",
					"text": "RT @dog_rates: This is Frida. She has a mustache. It somehow grew in way before her ears did. 14/10 please appreciate her https://t.co/XRRX…",
				}
			],
			max_id_key: 1375535964299362303,
			max_id_element: {
				"created_at": "Wed Mar 24 19:51:44 +0000 2021",
				"id": 1375535964299362303,
				"id_str": "1375535964299362310",
				"text": "RT @dog_rates: This is Frida. She has a mustache. It somehow grew in way before her ears did. 14/10 please appreciate her https://t.co/XRRX…",
			}
		}
		expect(twitterfeed).toBeDefined();
		expect(twitterfeed.statuses[0].created_at).toBeDefined();
		const check = handler.checkIfListEndReached(twitterfeed.max_id_element, new Date('Wed Mar 25 00:00:00 +0000 2021'));
		expect(check).toBeTruthy()
		done()
	})
	it('should get a full feed list status set', async (done) => {
		const feedListId = "930182383739002881"
		let jsonData = await handler.fullList(feedListId)
		expect(jsonData).toBeDefined();
		expect(jsonData[0].created_at).toBeDefined();
		expect(jsonData[0].entities).toBeDefined();
		expect(jsonData[0].entities).toBeDefined();
		const startpage = JSON.parse(fs.readFileSync(path.join(__dirname, "feed.json")));
		expect(startpage.length).toBeLessThan(jsonData.length)
		fs.writeFileSync(path.join(__dirname, "full-feed.json"), JSON.stringify(jsonData, null, 4));
		done()
	},(60000*8))
})
