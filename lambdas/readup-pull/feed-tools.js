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

exports.getFeed = async (username, password, page) => {
	const cookieString = await exports.acquireAuth(username, password)
	const response = await fetch("https://api.readup.com/Articles/listHistory?pageNumber=" + (page ? page : "1"), {
				"method": "GET",
				"headers": {
					"cookie": cookies,
					"Accept": 'application/json',
					"Content-Type": "application/json",
					"X-Readup-Client": "web/app/client#Browser@1.32.0",
					'Accept-Language': 'en-US,en;q=0.8',
					'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15',
					redirect: 'follow',
				}
			})
	responseJson = await response.json()

exports.feedJStoJSONString = async (rss) => {
	// console.log('output js', rss)
	// console.log('output js item', rss['rdf:RDF'].item)
	var items = rss.items.map((item) => {
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
					platform: 'https://readup.com'
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