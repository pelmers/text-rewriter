// TODO: port to browser api
const api = chrome;

// Return regexp for the replacement.
function makeRegex(rep) {
    const ign = (rep.ic)?"i":"",
          start = (rep.mw)?"\\b":"",
          end = (rep.mw)?"\\b":"";
    return new RegExp(start+rep.from+end, "g"+ign);
}

// Call text.replace on each regex in replacements.
// Return {text, count} the new text and the number of replacements made.
function performReplacements(text, replacements) {
    let count = 0;
    for (let i = 0; i < replacements.length; i++) {
        const re = makeRegex(replacements[i]);
        const matches = text.match(re);
        count += (matches != null) ? matches.length : 0;
        text = text.replace(re, replacements[i].to);
    }
    return {text, count};
}

// Tell the background script a content page has loaded.
api.runtime.sendMessage({ event: "pageLoad" });

api.runtime.onMessage.addListener(function (message) {
    const {event} = message;
    if (event === "textRewriter") {
        console.time("textRewriter");
        // handle response, which has a list of replacements
        const {replacements, tabId} = message;
        const tree = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        document.title = performReplacements(document.title, replacements).text;
        let cur = tree.nextNode();
        let totalCount = 0;
        while (cur) {
            const {text, count} = performReplacements(cur.nodeValue, replacements);
            cur.nodeValue = text;
            totalCount += count;
            cur = tree.nextNode();
        }
        console.timeEnd("textRewriter");
        api.runtime.sendMessage({ event: "replaceCount" , totalCount, tabId });
    }
});