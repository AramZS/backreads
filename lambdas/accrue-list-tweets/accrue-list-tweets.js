const { TwitterClient } = require('twitter-api-client');
require('dotenv').config()

/*
 * ## Notes Space

https://developer.twitter.com/en/docs/authentication/guides/authentication-best-practices
https://developer.twitter.com/en/portal/projects/
https://developer.twitter.com/en/docs/projects/overview
https://developer.twitter.com/en/docs/twitter-api/v1/rate-limits
https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/create-manage-lists/api-reference/get-lists-statuses
https://developer.twitter.com/en/docs/tutorials/building-an-app-to-stream-tweets
https://glitch.com/edit/#!/twitter-real-time-tweet-streamer?path=.env%3A1%3A0
https://www.npmjs.com/package/twitter-api-client
https://github.com/FeedHive/twitter-api-client/blob/main/REFERENCES.md
https://www.npmjs.com/package/twitter-v2
 */

const twitterClient = new TwitterClient({
	apiKey: process.env.TWITTER_API_KEY,
	apiSecret: process.env.TWITTER_API_SECRET,
	accessToken: process.env.TWITTER_ACCESS,
	accessTokenSecret: process.env.TWITTER_ACCESS_SECRET,
});

const a0PhoneNotifications = "930182383739002881"
const adTech = "905523364361580544"
const outsideTheOldBoys = "109010783"

exports.getListStatuses = async function(list_id, since_id, max_id) {

	const config = {
		list_id,
		include_entities: true,
		include_rts: true,
		count: 1000
	}
	since_id ? config.since_id = since_id : null
	max_id ? config.max_id = max_id : null
	const statuses = await twitterClient.accountsAndUsers.listsStatuses(config)
	return statuses
}

/**
 * Despite API documentation otherwise, the max_id param in a query will always indicate the first tweet of the list. This allows us to paginate a list query without having repeats.
 *
 *
 * @return  {[type]}                [return description]
 */
exports.getContinuableList = function(statuses) {
	// const listStatuses = getListStatuses(list_id);
	const lastElement = statuses.pop()
	const continue_key = lastElement.id;
	console.log('statuses:', statuses.length)
	return {
		statuses: statuses,
		max_id_key: continue_key,
		max_id_element: lastElement
	}
}

exports.addPageToListStatuses = async function(list_id, listStatuses) {
	let oldStatuses = listStatuses ? listStatuses : []
	if (oldStatuses.length < 1) {
		oldStatuses = await exports.getListStatuses(list_id);
	}
	try {
		const { statuses, max_id_key, max_id_element } = exports.getContinuableList(oldStatuses)
		const nextPage = await exports.getListStatuses(list_id, false, max_id_key);
		console.log(max_id_key)
		if (nextPage.length === 1) {
			// We've run out of API
			console.log('No more API entires available')
			throw new Error('API Unexpectedly Ended')
		}
		concatedList = statuses.concat(nextPage)
		return concatedList
	} catch (e) {
		console.log('Finished status retrieval , last is ', oldStatuses[oldStatuses.length - 1])
		return oldStatuses
	}
}

exports.getTweetDate = function(tweetObj) {
	const dateObj = new Date(tweetObj.created_at)
	return dateObj
	//const epochTime = dateObj.getTime()
	//return epochTime
}

exports.generatePrevDateObj = function(daysBefore) {
	var lastDate = new Date()
	lastDate.setDate(lastDate.getDate() - daysBefore)
	return lastDate;
}

exports.isValidDate = function(aTweet, aDateObj, begin, end) {
	const dayBegins = begin || (new Date(aDateObj.setUTCHours(0, 0, 0, 0)));
	const dayEnds = end || (new Date(aDateObj.setUTCHours(24, 0, 0, 0)));
	let isValid = true;
	if (!aTweet || !aTweet.hasOwnProperty('created_at') || (exports.getTweetDate(aTweet) > dayEnds) || (exports.getTweetDate(aTweet) < dayBegins)) {
		isValid = false;
	}
	return isValid;
}

exports.filterTwitterStatusByDate = function(statuses, aDateObj) {
	const dayBegins = (new Date(aDateObj.setUTCHours(0, 0, 0, 0)));
	const dayEnds = (new Date(aDateObj.setUTCHours(24, 0, 0, 0)));
	// console.log('Day Begins', dayBegins.toString(), 'Day Ends', dayEnds.toString())
	return statuses.filter((aTweet) => {
		return exports.isValidDate(aTweet, aDateObj, dayBegins, dayEnds)
	})
}

exports.checkIfListEndReached = function(end_of_list_element, dayBegins) {
	if (exports.getTweetDate(end_of_list_element) < dayBegins) {
		console.log('End date reached', end_of_list_element)
		return true
	}
	// console.log('End date not yet reached', end_of_list_element)
	return false;
}

exports.fullList = async (list_id) => {
	const statusesList = await exports.getListStatuses(list_id)
	let finalStatusList = statusesList
	let finalStatus = {}
	let finalStatusCount = 0;
	let listEnded = false;
	const targetDate = exports.generatePrevDateObj(1)
	const dayBegins = (new Date(targetDate.setUTCHours(0, 0, 0, 0)));
	// let continuableList = exports.getContinuableList(statusesList)
	while (listEnded === false) {
		finalStatusList = await exports.addPageToListStatuses(list_id, finalStatusList)
		if (finalStatusList.length <= finalStatusCount) {
			console.log('List has run out of tweets', finalStatusList.length),
				listEnded = true;
			break;
		} else {
			finalStatusCount = finalStatusList.length
		}
		try {

			listEnded = exports.checkIfListEndReached(finalStatusList[finalStatusList.length - 1], dayBegins)
			if (finalStatus.id === finalStatusList[finalStatusList.length - 1]) {
				// Twitter doesn't tell you that it has run out of available query API entries (less than 24 hours) so we're checking for sequential same ending tweets.
				listEnded = true;
				break;
			} else {
				finalStatus = finalStatusList[finalStatusList.length - 1];
			}
		} catch (e) {
			console.log('List has somehow gone wrong and can not end', finalStatusList.length),
				listEnded = true
			break;
		}
	}
	console.log('Trigger list filtering')
	return exports.filterTwitterStatusByDate(finalStatusList, targetDate)
}
