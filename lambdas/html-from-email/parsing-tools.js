const jsdom = require("jsdom")
const { JSDOM } = jsdom
const fetch = require('node-fetch');
const AbortController = require('abort-controller');
/** const metascraper = require('metascraper')([
	require('metascraper-url')(),
	require('metascraper-title')(),
  ]) */
exports.parseDataFromRecord = function (event) {
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
		'list-manage', 
		'facebook.com/',
		'twitter.com/',
		'updatemyprofile',
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
		'click.revue.email',
		'hubspot.fedscoop.com'
	];
	for (let aRegExString of regexs) {
		const aRegex = RegExp(aRegExString)
		if (aRegex.test(link)){
			linkValid = false;
			break;
		}
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

exports.getLinksFromEmailHTML = function(html){
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
			( !link.innerText || !testRegex.test(link.innerText) ) && 
			exports.collectableLink(link.href)
		){
			linksJson.links.push(link.href)
		}
	});
	return linksJson
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.resolveLinks = async function(linkSet, aCallback, ua){
	// https://developers.whatismybrowser.com/useragents/explore/software_type_specific/?utm_source=whatismybrowsercom&utm_medium=internal&utm_campaign=breadcrumbs
	let user_agent_windows = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' + 
			'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 ' +
			'Safari/537.36'
	let user_agent_macbook = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36 OPR/72.0.3815.400'
	let user_agent_firefox = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:83.0) Gecko/20100101 Firefox/83.0'
	let user_agent_safari = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9'
	let baidu_ua = 'Baiduspider+(+http://www.baidu.com/search/spider.htm)'
	const uas = [user_agent_windows, user_agent_macbook, user_agent_firefox, user_agent_safari, 'Googlebot/2.1 (+http://www.google.com/bot.html)', baidu_ua]
	let user_agent_desktop = uas[0]
	const substackERx = RegExp('email.substack')
	const substackMGRx = RegExp('mg2.substack')
	const washPostRx = RegExp('s2.washingtonpost')
	const linksResolve = linkSet.links.filter((link) => link && link.length).map(async (link, index) => {
		await timeout(index*1000)
		user_agent_desktop = ua ? ua : uas[Math.floor(Math.random() * uas.length)];
		try {

			if (washPostRx.test(link) || substackMGRx.test(link) || substackERx.test(link)){
				user_agent_desktop = baidu_ua
			}
			const controller = new AbortController();
			const timeout = setTimeout(() => {
				controller.abort();
			}, 5000);
			var r = await fetch(link, {
				redirect: 'follow',
				headers: {
					'Upgrade-Insecure-Requests': '1',
					'Accept-Language': 'en-US,en;q=0.8',
					'User-Agent': user_agent_desktop
				},
				signal: controller.signal
			})
			let url = r.url
			let text = await r.text();
			const virtualConsole = new jsdom.VirtualConsole();
			// virtualConsole.on("error", () => { console.log(error) });
			// virtualConsole.sendTo(c, { omitJSDOMErrors: true });
			var dom = new JSDOM(text, { pretendToBeVisual: false, virtualConsole })
			try {
				try {
					url = dom.window.document.querySelector('link[rel=canonical]').href
				} catch (e){
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
					} catch(e){
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
					} catch(e){
						description = ""
					}
				}
				if (exports.collectableLink(url)){
					if (aCallback){
						let check = await aCallback(url, { title, description })
					}
					return { title: title, url }
				} else {
					return null
				}
			} catch (e){
				console.log('Error in links resolution', r.url, e)
				if (exports.collectableLink(url)){
					if (aCallback){
						let check = await aCallback( r.url, { title: "", description: "" })
					}
					return { title: '', url: r.url }
				} else {
					return null
				}
			}
		} catch (e) {
			console.log('Attempt to resolve link failed for ', link, "with ua", user_agent_desktop, "With error: ", e)
			return { title: '', url: link }
		}
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
	var cleanLinksResolved = linksResolved.filter((link) => link)
	return { links: cleanLinksResolved }
}