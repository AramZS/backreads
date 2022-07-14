const jsdom = require("jsdom")
const { JSDOM } = jsdom
const fetch = require('node-fetch');
const AbortController = require('abort-controller');
/** const metascraper = require('metascraper')([
	require('metascraper-url')(),
	require('metascraper-title')(),
  ]) */
exports.parseDataFromRecord = function(event) {
	return JSON.parse(event.Records[0].Sns.Message)
}

exports.getBucketFromEmailEvent = function(message) {
	return message.receipt.action.bucketName
}

exports.getPathFromEmailEvent = function(message) {
	return message.receipt.action.objectKey
}

exports.collectableLink = function(link) {
	const testMailtoRegex = RegExp('mailto:')
	const manageLinks = RegExp('list-manage')
	const fbLinks = RegExp('facebook.com/')
	const twitterLinks = RegExp('twitter.com/')
	const profileLinks = RegExp('updatemyprofile')
	const privacyNoticeLinks = RegExp('privacy-notice')
	const testRegex = RegExp('unsubscribe')
	const forwardLink = RegExp('forward-to-friend')
	const kMail = RegExp('kmail-lists')
	const payMe = RegExp('stripe.com/')
	const coursehorse = RegExp('coursehorse.com/')
	const instagram = RegExp('instagram.com/')
	const appleApps = RegExp('apps.apple.com')
	const googleApps = RegExp('play.google.com')
	const login = RegExp('/login')
	// Uncrawlable.
	const hubspotRx = RegExp('hubspot.fedscoop.com')
	let linkValid = true;
	const regexs = [
		'mailto:',
		'facebook.com/',
		'twitter.com/',
		'updatemyprofile',
		/\/profile$/,
		'privacy-notice',
		'unsubscribe',
		'forward-to-friend',
		'kmail-lists',
		'stripe.com/',
		'coursehorse.com/',
		'instagram.com/',
		'apps.apple.com',
		'play.google.com',
		'/login',
		'/ad-choices/',
		'liveintent.com/',
		'cdn.substack.com/image',
		'greenhouse.io',
		'mailchimp.com/referral/',
		'p.liadm.com/click',
		'constantcontact.com',
		'cmail19.com',
		'/legal/',
		'hubspot.fedscoop.com',
		'/feedback/',
		'/tos',
		'/email_ad',
		'helpcenter',
		'/privacy-policy/',
		'/newsletters/',
		'/terms-of-service/',
		'/deals/',
		'disable_email',
		/\/subscribe$/,
		/\/subscribe\/$/,
		'givemeyournewsletter',
		/\/subscriptions$/,
		/\/subscriptions\/$/,
		/substack.com\/for-writers$/,
		'/terms-of-service/',
		/\/terms-of-service$/,
		'/newsletters/',
		'/helpcenter.',
		/\.com\/$/,
		/\.com$/,
		/\.io$/,
		/\.io\/$/,
		/\.space$/,
		/\.space\/$/,
		/\.org$/,
		/\.org\/$/,
		/\.net$/,
		/\.net\/$/,
		/\.co$/,
		/\.co\/$/,
		'about:blank',
		'404',
		/\/camp-rw\/$/,
		/\/ad$/,
		/\/rss$/,
		'/privacy/',
		/\/privacy$/,
		'/subscriptions/',
		'/membership/',
		'reddit.com/',
		'signin.html',
		'newegg.com/',
		/\/contact-us$/,
		/\/contact-us\/$/,
		/\/privacy-policy$/,
		/\/privacy_policy$/,
		/\/privacy-policy\/$/,
		/\/privacy_policy\/$/,
		/\/privacy-settings$/,
		/\/privacy-settings\/$/,
		'linkedin.com/company/',
		/\/shareArticle/,
		/\/areyouahuman$/,
		/\/c\//,
		'/account/',
		/\/uu\//,
		'/thank-you-for-signing-up-for-the-newsletter/',
		'forwardtomyfriend',
		'user#',
		'/advertise/',
		/\/comments$/,
		/\/sign-in$/,
		/\/settings$/,
		/\/newsletters$/,
		/\/safe_senders$/,
		'/channel/',
		'/membership/',
		'/professional/solution/bloomberg-terminal/',
		/\/products$/,
		'myaccount.economist.com/s/',
		/\|ARCHIVE\|/,
		'pinterest.com/',
		'flipboard.com/',
		'/firms/',
		/\/articles$/,
		/\/about-us\/$/,
		/\/about\/$/,
		/zendesk\.com/,
		/\/jobs\//,
		/zoom\.us\//,
		/\/category\//,
		/\/donate\//,
		/\/vcard\//,
		/unsub/,
		/vcard/,
		/sendtofriend/,
		/subscribertools/,
		/\/mediakit/,
		/nordvpn\.com\/special/,
		/adoptuskids\.org/,
		/updateAccount/,
		/about$/,
		/\/newsletters\/$/,
		/\/manage\//,
		/\/settings\//,
		/\/app$/,
		/\/signup$/,
		/theinventory\.com\/best-deals/,
		/kinja-deals/,
		/\/dp\//,
		/\/grow-with-mailchimp\//,
		/delighted\.com\//

	];
	for (let aRegExString of regexs) {
		const aRegex = new RegExp(aRegExString)
		if (aRegex.test(link)) {
			// console.log(aRegExString)
			return false;
		}
	}
	try {
		if (!link || link.length < 3) {
			return false;
		}
	} catch (e) {
		console.log('Link with no length let through somehow', e, link)
		return false;
	}
	return linkValid
	if (
		!testMailtoRegex.test(link) &&
		!testRegex.test(link) &&
		!manageLinks.test(link) &&
		!fbLinks.test(link) &&
		!twitterLinks.test(link) &&
		!profileLinks.test(link) &&
		!privacyNoticeLinks.test(link) &&
		!forwardLink.test(link) &&
		!kMail.test(link)
	) {
		return true
	} else {
		return false
	}
}

exports.getLinksFromEmailHTML = function(html) {
	const virtualConsole = new jsdom.VirtualConsole();
	// virtualConsole.on("error", () => { console.log(error) });
	// virtualConsole.sendTo(c, { omitJSDOMErrors: true });
	var dom = new JSDOM(html, { pretendToBeVisual: false, virtualConsole })
	const linksJson = { links: [] }
	var links = dom.window.document.querySelectorAll('a')
	const testRegex = RegExp('unsubscribe')
	links.forEach(link => {
		if (
			(link.innerText || link.innerHTML) &&
			(!link.innerText || !testRegex.test(link.innerText)) &&
			!linksJson.links.includes(link.href) &&
			exports.collectableLink(link.href)
		) {
			linksJson.links.push(link.href)
		}
	});
	return linksJson
}

function timeout(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

exports.convertDateToLocalString = function(dateObj){
	var dateSet = (dateObj.toLocaleString("en-US", {timezoneName: "ET"}).split(",")[0]).split('/');
	var month = dateSet[0].length < 2 ? `0${dateSet[0]}` : dateSet[0]
	var day = dateSet[1].length < 2 ? `0${dateSet[1]}` : dateSet[1]
	var dateIs = `${dateSet[2]}-${month}-${day}`;
	return dateIs;
}

exports.cleanLinkSet = function(linkSet) {
	var cleanLinksResolved = linkSet.filter((link) => link)
	const justUrls = [];
	var finalCleanLinksResolved = cleanLinksResolved.filter((link) => {
		if (!exports.collectableLink(link.source)){
			return false;
		}
		if (justUrls.includes(link.source)){
			return false;
		} else {
			justUrls.push(link.source)
			return true;
		}
	})
	return finalCleanLinksResolved;
}


exports.resolveLinks = async function(linkSet, aCallback, ua) {
	// https://developers.whatismybrowser.com/useragents/explore/software_type_specific/?utm_source=whatismybrowsercom&utm_medium=internal&utm_campaign=breadcrumbs
	// https://user-agents.net/lookup
	let user_agent_windows = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
		'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 ' +
		'Safari/537.36'
	let user_agent_macbook = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36 OPR/72.0.3815.400'
	let user_agent_firefox = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:83.0) Gecko/20100101 Firefox/83.0'
	let user_agent_safari = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9'
	let baidu_ua = 'Baiduspider+(+http://www.baidu.com/search/spider.htm)'
	let googleBot = 'Googlebot/2.1 (+http://www.google.com/bot.html)'
	let newGoogleBot = 'UCWEB/2.0 (compatible; Googlebot/2.1; +google.com/bot.html)'
	let pythonRequests = 'python-requests/2.23.0';
	let facebookRq = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
	let lighthouse = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko; Google Page Speed Insights) Chrome/41.0.2272.118 Safari/537.36'
	const uas = [user_agent_windows, user_agent_macbook, user_agent_firefox, user_agent_safari, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:77.0) Gecko/20100101 Firefox/77.0', 'Mozilla/5.0 (X11; Linux x86_64)']
	let user_agent_desktop = uas[0]
	const substackERx = RegExp('email.substack')
	const substackMGRx = RegExp('mg2.substack')
	const washPostRx = RegExp('s2.washingtonpost.com')
	const washPostStandardRx = RegExp('washingtonpost.com')
	const bbergLink = /link\.mail\.bloombergbusiness\.com/
	const goLink = /r\.g-omedia\.com/
	const logicLink = /thelogic\.us12\.list-manage\.com/
	// Bot detected titles
	const cloudflareBlock = RegExp('Attention Required')
	const fourOhThreeBlock = RegExp('403')
	const humanCheckBlock = RegExp('Are you a human')

	const linksResolve = linkSet.links.filter((link) => link && link.length).map(async (link, index) => {
		await timeout(index * 1500)
		user_agent_desktop = ua ? ua : uas[Math.floor(Math.random() * uas.length)];
		let linkObj = {
			source: "",
			title: "",
			description: "",
			tags: [],
			date: (new Date()).toISOString(),
			localDate: exports.convertDateToLocalString(new Date()),
			platform: "email"
		}
		try {
			if (substackMGRx.test(link) || substackERx.test(link)) {
				user_agent_desktop = baidu_ua
			} else if (washPostRx.test(link)) {
				user_agent_desktop = lighthouse // facebookRq
			} else if ( washPostStandardRx.test(link) ){
				user_agent_desktop = lighthouse
			} else if (bbergLink.test(link) || goLink.test(link)){
				user_agent_desktop = user_agent_safari
			} else if (logicLink.test(link)){
				user_agent_desktop = user_agent_firefox
			}
			const controller = new AbortController();
			const fetchTimeout = setTimeout(() => {
				console.log('Request timed out for', link, user_agent_desktop)
				if (linkObj.source.length < 3) {
					linkObj.source = link
					linkObj.title = "Request Timed Out for: " + link + ' with ' + user_agent_desktop
				}
				controller.abort();
			}, 5500);
			var r = await fetch(link, {
				redirect: 'follow',
				headers: {
					"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
					'User-Agent': user_agent_desktop,
					"Accept-Encoding": "gzip, deflate", // 'Accept-Encoding': 'gzip, deflate, br',
					"Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8", // 'Accept-Language': 'en-US,en;q=0.9',
					"Dnt": "1",
					"Upgrade-Insecure-Requests": "1",
					"Referer": "https://www.gmail.com/",
				},
				signal: controller.signal
			})
			if (r.ok){
				let url = r.url
				let text = await r.text();
				clearTimeout(fetchTimeout)
				const virtualConsole = new jsdom.VirtualConsole();
				// virtualConsole.on("error", () => { console.log(error) });
				// virtualConsole.sendTo(c, { omitJSDOMErrors: true });
				var dom = new JSDOM(text, { pretendToBeVisual: false, virtualConsole })
				try {
					try {
						url = dom.window.document.querySelector('link[rel=canonical]').href
					} catch (e) {
						console.log('no canonical', r.url)
						try {
							url = dom.window.document.querySelector('meta[property="og:url"]').content
						} catch (e) {
							console.log('no og:url', r.url)
							url = (r.url.split('?'))[0]
						}
					}
					let title = ''
					try {
						title = dom.window.document.title
					} catch (e) {
						console.log('Could not find title', r.url, e)
						try {
							title = dom.window.document.querySelector('meta[property="og:title"]').content
						} catch (e) {
							title = ""
						}
					}
					let description = ''
					try {
						description = dom.window.document.querySelector('meta[name="description"]').content
					} catch (e) {
						console.log('Could not find description', r.url, e)
						try {
							description = dom.window.document.querySelector('meta[property="og:description"]').content
						} catch (e) {
							description = ""
						}
					}
					linkObj.title = title
					linkObj.description = description
					if (exports.collectableLink(url)) {
						if (aCallback) {
							let check = await aCallback(url, { title, description })
						}
						linkObj.source = url
					} else {
						return null
					}
				} catch (e) {
					console.log('Error in links resolution', r.url, e)
					if (exports.collectableLink(url)) {
						if (aCallback) {
							let check = await aCallback(r.url, { title: "", description: "" })
						}
						linkObj.source = r.url
					} else {
						return null
					}
				}
				if (cloudflareBlock.test(linkObj.title) || fourOhThreeBlock.test(linkObj.title) || humanCheckBlock.test(linkObj.title)){
					linkObj.title = "Title not found for " + linkObj.source
					linkObj.source = link
				}
				return linkObj
			} else {
				console.log('Attempt to resolve link failed for ', link, "with ua", user_agent_desktop, "With response status: ", r.status)
				linkObj.source = link
			}
		} catch (e) {
			console.log('Attempt to resolve link failed for ', link, "with ua", user_agent_desktop, "With error: ", e)
			linkObj.source = link
			// return { title: '', url: link }
			// return null
		}
		if (linkObj.source.length < 3) {
			return null
		}
		return linkObj
		/** try {

			const metadata = await metascraper({ html: text, url })
			// console.log('metadata retrieved', metadata)
			if (metadata.url){
				url = metadata.url
			}
			return {title: metadata.hasOwnProperty('title') ? metadata.title : '', url}
		} catch (e){
			return {title: '', url}
		} */
	});
	var linksResolved = await Promise.all(linksResolve)
	return { links: exports.cleanLinkSet(linksResolved) }
}
