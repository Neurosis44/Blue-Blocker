import { ClearCache, DefaultOptions, SetOptions, HandleInstructionsResponse } from '../shared.js';

document.addEventListener("blue-blocker-event", function (e) {
	ClearCache();

	// retrieve option
	browser.storage.sync.get(DefaultOptions).then(items => {
		SetOptions(items);
		const body = JSON.parse(e.detail.body);

		switch (e.detail.parsedUrl[1]) {
			case "HomeLatestTimeline":
      case "HomeTimeline":
			case "UserTweets":
			case "TweetDetail":
      case "search/adaptive.json":
				return HandleInstructionsResponse(e, body);
			default:
				console.error("found an unexpected url that we don't know how to handle:", e.detail.url);
		}
	});
});

const STORAGE_KEY = 'blue_blocked_users';
async function getBlockedUsers() {
  const store = await browser.storage.local.get(STORAGE_KEY);
  return store[STORAGE_KEY] || {};
}

document.isUserAlreadyBlocked = async function(user) {
  const store = await getBlockedUsers();
  return !!store[user.rest_id];
}

document.addEventListener("block-blue-user", async function({ detail: user }) {
  const store = await getBlockedUsers();

  browser.storage.local.set({ [STORAGE_KEY]: { ...store, [user.rest_id]: user.legacy.screen_name } });
});

