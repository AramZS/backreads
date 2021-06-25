const fetch = require("node-fetch");

const parseCookies = (response) => {
	const raw = response.headers.raw()["set-cookie"];
	return raw
		.map((entry) => {
			const parts = entry.split(";");
			const cookiePart = parts[0];
			return cookiePart;
		})
		.join(";");
};

const acquireAuth = (feed, username, password) => {
	return new Promise((resolve, reject) => {
		const fetchOptions = {
			method: "POST",
			headers: {
				cookie: "",
				Accept: "application/json",
				"Content-Type": "application/json",
				"X-Readup-Client": "web/app/client#Browser@1.32.0",
				"Accept-Language": "en-US,en;q=0.8",
				"User-Agent":
					"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15",
				redirect: "follow",
			},
			body: JSON.stringify({
				email: "aramzs@hacktext.com",
				password: " ",
			}),
			credentials: "include",
		};
		fetch("https://api.readup.com/UserAccounts/SignIn", fetchOptions)
			.then((response) => {
				console.log(response);
				console.log("Cookies: ");
				const cookies = parseCookies(response);
				const cookieParts = cookies.split("=");
				const cookieObj = {};
				cookieObj[cookieParts[0]] = cookieParts[1];
				console.log(cookies);
				resolve(cookies);
			})
			.catch((err) => {
				console.log("err", err);
				console.error(err);
				reject(err);
			});
	});
};
function getFeed() {
	const result = new Promise((resolve, reject) => {
		const cookies = acquireAuth(
			"https://api.readup.com/UserAccounts/SignIn",
			"aramzs@hacktext.com",
			"password"
		).then((cookies) => {
			fetch("https://api.readup.com/Articles/listHistory?pageNumber=1", {
				method: "GET",
				headers: {
					cookie: cookies,
					Accept: "application/json",
					"Content-Type": "application/json",
					"X-Readup-Client": "web/app/client#Browser@1.32.0",
					"Accept-Language": "en-US,en;q=0.8",
					"User-Agent":
						"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15",
					redirect: "follow",
				},
			})
				.then((nextResponse) => {
					nextResponse.json().then((rJson) => {
						console.log("readup", rJson);
						resolve(rJson);
					});
				})
				.catch((err) => {
					console.error(err);
				});
		});
	});

	result.then((r) => console.log("complete"));
	return result;
}

getFeed();
