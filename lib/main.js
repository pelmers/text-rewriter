const api = chrome;

const storage = api.storage.local;

// Send replacement lists to the given tab id.
function updateTab(id) {
    storage.get({ replacements: [], use_dynamic: true }, function (data) {
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
