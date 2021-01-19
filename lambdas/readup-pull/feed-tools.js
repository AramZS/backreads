const fetch = require('node-fetch');

const parseCookies = (response) => {
	const raw = response.headers.raw()['set-cookie'];
	return raw.map((entry) => {
	  const parts = entry.split(';');
	  const cookiePart = parts[0];
	  return cookiePart;
	}).join(';');
}

exports.acquireAuth = (username, password) => {
	return new Promise((resolve, reject) => {
		const fetchOptions = {
			'headers': {
				"cookie": "",
				"Accept": 'application/json',
				"Content-Type": "application/json",
				"X-Readup-Client": "web/app/client#Browser@1.32.0",
				'Accept-Language': 'en-US,en;q=0.8',
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15',
				redirect: 'follow',
			},
			"body": JSON.stringify({
			"email": username,
			"password": password
			}),
			'method': 'POST',
			"credentials": 'include',
		}
		fetch('https://api.readup.com/UserAccounts/SignIn', fetchOptions).then(response => {
			console.log(response);
			console.log("Cookies: ")
			const cookies = parseCookies(response)
			const cookieParts = cookies.split("=")
			const cookieObj = {};
			cookieObj[cookieParts[0]] = cookieParts[1]
			console.log(cookies)
			resolve(cookies)
		})
		.catch(err => {
			console.error(err);
			reject(err)
		});
	})
}

exports.getFeed = async (cookieString, page) => {
	
	return new Promise((resolve, reject) => {
		const response = fetch("https://api.readup.com/Articles/listHistory?pageNumber=" + (page ? page : "1"), {
					"method": "GET",
					"headers": {
						"cookie": cookieString,
						"Accept": 'application/json',
						"Content-Type": "application/json",
						"X-Readup-Client": "web/app/client#Browser@1.32.0",
						'Accept-Language': 'en-US,en;q=0.8',
						'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15',
						redirect: 'follow',
					}
				}).then(nextResponse => {
					nextResponse.json().then((jsonFeed) => {
						resolve(jsonFeed)
					})
				})
	})
}

exports.feedJStoJSONString = (rss) => {
	const finishedState = false;
	var lastDate = new Date()
	lastDate.setDate(lastDate.getDate() - 1)
	var dateString = (lastDate.toISOString("en-US", {timezone: "America/New_York"})).split("T")[0]
	var items = rss.items.map((item) => {
		/** 
		 *     {
      "id": 584361,
      "title": "The Cops Showed Us Who They Are",
      "slug": "discourse-blog_the-cops-showed-us-who-they-are",
      "source": "Discourse Blog",
      "datePublished": "2021-01-07T18:28:36",
      "section": null,
      "description": "The Capitol Police stood by as a Trump mob held the Capitol hostage. We shouldn't be surprised by this for a second.",
      "aotdTimestamp": null,
      "url": "https://discourseblog.com/police-allowed-trump-mob-to-storm-capitol/",
      "authors": [],
      "tags": [],
      "wordCount": 1716,
      "commentCount": 0,
      "readCount": 0,
      "averageRatingScore": null,
      "dateCreated": "2021-01-07T23:15:45.794063",
      "percentComplete": 16.3752913752914,
      "isRead": false,
      "dateStarred": null,
      "ratingScore": null,
      "datePosted": null,
      "datesPosted": [],
      "hotScore": 0,
      "hotVelocity": 0,
      "ratingCount": 0,
      "firstPoster": null,
      "flair": 0,
      "aotdContenderRank": 0,
      "proofToken": null
    }
		*/
		if (item && item.hasOwnProperty('id') && item.hasOwnProperty('url')){
			if (item['url'].match(/twitter\.com/g)){
				// ignore twitter links
			} else {
				const formedItem = {
					source: item.url,
					title: item.title,
					description: item.description && item.description.length ? item.description : "",
					tags: item.tags,
					date: item.dateCreated,
					weight: 8,
					platform: 'https://readup.com'
				};
				if (item.percentComplete > 90){
					formedItem.weight = 13
				}
				return formedItem
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
	return JSON.stringify({links: filteredItem}, null, 3);	
}