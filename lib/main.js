const api = chrome;

const storage = api.storage.local;

// In case the page or other extensions have their own observers that mutate the page
// when we change it, we don't want to get into an infinite loop.
// This const defines the minimum time since the last observer event that the
// next one is allowed to run.
// The way it works is that instead of mutating directly in the observer, we add
// changed nodes to a list and then go through that every Interval time.
const DEFAULT_DYNAMIC_REPLACE_INTERVAL_MS = 2000;

// Send replacement lists to the given tab id.
function updateTab(id) {
    storage.get({
        replacements: [],
        use_dynamic2: false,
        dynamic_timeout_value: DEFAULT_DYNAMIC_REPLACE_INTERVAL_MS,
    }, function (data) {
        data.event = "textRewriter";
        data.tabId = id;
        api.tabs.sendMessage(id, data);
    });
}

// Listen to messages from content scripts.
api.runtime.onMessage.addListener(function (message, sender) {
    const {event} = message;
    if (event === "pageLoad") {
        storage.get({ enabled: true }, function (data) {
            if (data.enabled) {
                updateTab(sender.tab.id);
            }
        });
    } else if (event === "replaceCount") {
        const {totalCount, tabId} = message;
        api.browserAction.setBadgeText({text: totalCount.toString(), tabId});
        api.browserAction.setBadgeBackgroundColor({color: [102,102,102,255]});
    }
});

// When enable state changes, change the icon and update the current tab.
api.browserAction.onClicked.addListener(function (tab) {
    storage.get({ enabled: true }, function (data) {
        if (data.enabled) {
            storage.set({ enabled: false });
            api.browserAction.setIcon({path: { 48: "data/icon-disabled.png" }});
            api.tabs.reload(tab.id);
        } else {
            storage.set({ enabled: true });
            api.browserAction.setIcon({path: { 48: "data/icon.png" }});
            updateTab(tab.id);
        }
    });
});
