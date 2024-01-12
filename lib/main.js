const api = chrome;

const storage = api.storage.local;

// In case the page or other extensions have their own observers that mutate the page
// when we change it, we don't want to get into an infinite loop.
// This const defines the minimum time since the last observer event that the
// next one is allowed to run.
// The way it works is that instead of mutating directly in the observer, we add
// changed nodes to a list and then go through that every Interval time.
const DEFAULT_DYNAMIC_REPLACE_INTERVAL_MS = 2000;

const DISABLED_MSG = "⛔️";

// Send replacement lists to the given tab id.
function updateTab(id) {
    storage.get({
        replacements: [],
        use_dynamic2: false,
        dynamic_timeout_value: DEFAULT_DYNAMIC_REPLACE_INTERVAL_MS,
        skip_pre_tags: false,
        skip_code_tags: false,
    }, function (data) {
        data.event = "textRewriter";
        data.tabId = id;
        api.tabs.sendMessage(id, data);
    });
}

function isBlocked(blocklist, url) {
    for (const {pattern} of blocklist) {
        const re = new RegExp(pattern);
        if (re.test(url)) {
            return true;
        }
    }
}

function makePattern(url) {
    // Find the domain/subdomain part of the url and escape the periods
    return new URL(url).origin.replace(/\./g, '\\.');
}

// Listen to messages from content scripts.
api.runtime.onMessage.addListener(function (message, sender) {
    const {event} = message;
    if (event === "pageLoad") {
        storage.get({ blockPatterns: [] }, function (data) {
            const {url} = sender.tab;
            if (!isBlocked(data.blockPatterns, url)) {
                updateTab(sender.tab.id);
            } else {
                api.action.setBadgeText({text: DISABLED_MSG, tabId: sender.tab.id});
                api.action.setBadgeBackgroundColor({color: [102,102,102,255]});
            }
        });
    } else if (event === "replaceCount") {
        const {totalCount, tabId} = message;
        api.action.setBadgeText({text: totalCount.toString(), tabId});
        api.action.setBadgeBackgroundColor({color: [102,102,102,255]});
    }
});

// When enable state changes, change the icon and update the current tab.
api.action.onClicked.addListener(function (tab) {
    storage.get({ blockPatterns: [] }, function (data) {
        if (!isBlocked(data.blockPatterns, tab.url)) {
            data.blockPatterns.push({pattern: makePattern(tab.url)})
            storage.set({blockPatterns: data.blockPatterns}, () => {
                api.action.setBadgeText({text: "🔄", tabId: tab.id});
                api.action.setBadgeBackgroundColor({color: [102,102,102,255]});
            });
        } else {
            api.action.getBadgeText({tabId: tab.id}, (text) => {
                if (text === DISABLED_MSG) {
                    // Bypass the disable state for this tab (if not already bypassed)
                    updateTab(tab.id);
                } else {
                    // in this case it's already disabled, but it was bypassed (ask user to reload)
                    api.action.setBadgeText({text: "🔄", tabId: tab.id});
                    api.action.setBadgeBackgroundColor({color: [102,102,102,255]});
                }
            });
        }
    });
});
