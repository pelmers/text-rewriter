// Firefox = browser, Chrome = chrome.
let api;
try {
    api = chrome;
} catch(e) {
    api = browser;
}

// Return regexp for the replacement.
function makeRegex(rep) {
    const ign = (rep.ic)?"i":"",
          start = (rep.mw)?"\\b":"",
          end = (rep.mw)?"\\b":"";
    return new RegExp(start+rep.from+end, "g"+ign);
}

// Call text.replace on each regex in replacements.
function performReplacements(text, replacements) {
    for (let i = 0; i < replacements.length; i++) {
        text = text.replace(makeRegex(replacements[i]), replacements[i].to);
    }
    return text;
}

// Tell the background script a content page has loaded.
api.runtime.sendMessage({"event": "pageLoad"});

api.runtime.onMessage.addListener(function (message) {
    if (message.event === "textRewriter") {
        // handle response, which has a list of replacements
        const replacements = message.replacements,
              tree = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        document.title = performReplacements(document.title, replacements);
        let cur = tree.nextNode();
        while (cur) {
            cur.nodeValue = performReplacements(cur.nodeValue, replacements);
            cur = tree.nextNode();
        }
    }
});