var s = document.createElement("script");
s.src = chrome.runtime.getURL("inject.js");
s.id = "injected-blue-block-xhr";
s.type = "text/javascript";
// s.onload = function() {
// 	this.remove();
// };
(document.head || document.documentElement).appendChild(s);

import LegacyVerifiedUsers from "./legacy-verified-users.js";

(function() {
  const style = document.createElement('style');
  style.innerText = `
    .extension-notification-fade-out {
      animation: fade-out 0.5s forwards;
    }
    @keyframes fade-out {
      0% {
        opacity: 1;
      }
      100% {
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
})();

function ShowNotification(message) {
  const notification = document.createElement('div');
  notification.style.fontFamily = 'sans-serif';
  notification.style.padding = '10px';
  notification.style.backgroundColor = '#202125';
  notification.style.border = '1px solid #71767b';
  notification.style.borderRadius = '20px';
  notification.style.color = '#71767b';
  notification.innerText = message;

  const notificationsContainer = document.getElementById('extension-notifications-container') || createNotificationsContainer();
  notificationsContainer.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('extension-notification-fade-out');
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, 4000);
}

function createNotificationsContainer() {
  const container = document.createElement('div');
  container.id = 'extension-notifications-container';
  container.style.position = 'fixed';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '5px';
  container.style.top = '10px';
  container.style.right = '10px';
  container.style.zIndex = '9999';
  document.body.appendChild(container);
  return container;
}

// this is the magic regex to determine if its a request we need. add new urls below
export const DefaultOptions = {
  // by default, spare the people we follow from getting blocked
  blockFollowing: false,
  blockLegacy: false,
  blue_blocked_users: {},
};

// when parsing a timeline response body, these are the paths to navigate in the json to retrieve the "instructions" object
// the key to this object is the capture group from the request regex in inject.js
export const InstructionsPaths = {
  HomeTimeline: [
    "data",
    "home",
    "home_timeline_urt",
    "instructions",
  ],
  HomeLatestTimeline: [
    "data",
    "home",
    "home_timeline_urt",
    "instructions",
  ],
  UserTweets: [
    "data",
    "user",
    "result",
    "timeline_v2",
    "timeline",
    "instructions",
  ],
  TweetDetail: [
    "data",
    "threaded_conversation_with_injections_v2",
    "instructions",
  ],
  "search/adaptive.json": [
    "timeline",
    "instructions",
  ],
};

export const Headers = [
  "authorization",
  "x-csrf-token",
  "x-twitter-active-user",
  "x-twitter-auth-type",
  "x-twitter-client-language",
];

var options = {};
export function SetOptions(items) {
  options = items;
}

const ReasonBlueVerified = 1;
const ReasonNftAvatar = 2;

const ReasonMap = {
  [ReasonBlueVerified]: "Paid Twitter Blue $",
  [ReasonNftAvatar]: "NFT avatar",
};

const BlockCache = new Set();
export function ClearCache() {
  BlockCache.clear();
}

export function BlockUser(user, user_id, headers, reason, attempt = 1) {
  if (BlockCache.has(user_id)) { return; }
  BlockCache.add(user_id);

  const formdata = new FormData();
  formdata.append("user_id", user_id);

  const ajax = new XMLHttpRequest();

  ajax.addEventListener('load', event => {
    console.log(`blocked ${user.legacy.name} (@${user.legacy.screen_name}) due to ${ReasonMap[reason]}.`);
    document.dispatchEvent(new CustomEvent("block-blue-user", { detail: user }));
  }, false);
  ajax.addEventListener('error', error => {
    console.error('error:', error);

    if (attempt < 3) { BlockUser(user, user_id, headers, reason, attempt + 1) }
    else { console.error(`failed to block ${user.legacy.name} (@${user.legacy.screen_name}):`, user); }
  }, false);

  ajax.open('POST', "https://twitter.com/i/api/1.1/blocks/create.json");
  for (const header of Headers) {
    ajax.setRequestHeader(header, headers[header]);
  }
  ajax.send(formdata);
}

export async function BlockBlueVerified({ user, tweet }, headers) {
  if (await document.isUserAlreadyBlocked(user)) {
    return;
  }
  if(user.legacy.blocking) return;

  // since we can be fairly certain all user objects will be the same, break this into a separate function
  if (user.is_blue_verified) {
    if (
      // group for block-following option
      !(options.blockFollowing || (!user.legacy.following && !user.super_following))
    ) {
      console.log(`did not block Twitter Blue verified user ${user.legacy.name} (@${user.legacy.screen_name}) because you follow them.`);
    } else if (
      // group for block-legacy option
      CheckLegacyVerified(user) && !options.blockLegacy
    ) {
      console.log(`did not block Twitter Blue verified user ${user.legacy.name} (@${user.legacy.screen_name}) because they are legacy verified.`);
    } else {
      BlockUser(user, String(user.rest_id), headers, ReasonBlueVerified);
      ShowNotification(`Blocked ${user.legacy.name} (@${user.legacy.screen_name})`);
      HideTweet({ user, tweet });
    }
  }
}

function findObjectsWithMatchingProperty(input, property, value) {
  const result = [];

  function searchRecursive(item) {
    if (Array.isArray(item)) {
      for (const element of item) {
        searchRecursive(element);
      }
    } else if (typeof item === 'object' && item !== null) {
      if (item[property] === value) {
        result.push(item);
      }
      for (const key in item) {
        if (item.hasOwnProperty(key)) {
          searchRecursive(item[key]);
        }
      }
    }
  }

  searchRecursive(input);
  return result;
}

export function CheckLegacyVerified(user) {
  return !!LegacyVerifiedUsers[user.rest_id];
}

export function HandleInstructionsResponse(e, body) {
  // pull the "instructions" object from the tweet
  let tweets = body;
  try {
    for (const key of InstructionsPaths[e.detail.parsedUrl[1]]) {
      tweets = tweets[key];
    }
  }
  catch (e) {
    console.error("failed to parse response body for instructions object", e, body);
    return;
  }

  // wait some time, it can takes times to render tweets.
  // if this is executed too early, blue tweets won't be removed
  setTimeout(() => {  
    for (const tweet of findObjectsWithMatchingProperty(tweets, '__typename', 'Tweet')) {
      const user = findObjectsWithMatchingProperty(tweet, '__typename', 'User')[0];
      BlockBlueVerified({ tweet, user }, e.detail.request.headers);
    }
  }, 1000);
}

const emojiRegExp = /(?:[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{1F300}-\u{1F5FF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{1F201}-\u{1F251}]|[\u{1F600}-\u{1F636}]|[\u{1F681}-\u{1F6C5}]|[\u{1F30D}-\u{1F567}])[\ufe0f\u{1F3FB}-\u{1F3FF}]?/gu;

function HideTweet({ tweet, user }) {
  const usernameWithoutEmoji = user.legacy.name.replace(emojiRegExp, '');

  const tweetsElements = document.getElementsByTagName('article');
  for (const t of tweetsElements) {
    if (t.textContent.includes(usernameWithoutEmoji) || t.textContent.includes(tweet.legacy.full_text)) {
      t.style.backgroundColor = 'red';
      t.style.display = 'none';
    }
  }
}