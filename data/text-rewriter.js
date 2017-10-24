// TODO: port to browser api
const api = chrome;

// this is some text => This Is Some Text
function titleCase(str) {
  const parts = str.split(' ');
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].length > 0) {
      parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
    }
  }
  return parts.join(' ');
}

// Return new list of replacements with autocase replacements expanded.
function expandAutoCaseReplacements(replacements) {
    const newReplacements = [];
    for (let i = 0; i < replacements.length; i++) {
        const rep = replacements[i];
        if (rep.sc && !rep.ic) {
            const repTitle = {
                "from": titleCase(rep.from),
                "to": titleCase(rep.to),
                "ic": rep.ic,
                "mw": rep.mw,
                "sc": rep.sc,
            };
            const repUpper = {
                "from": rep.from.toUpperCase(),
                "to": rep.to.toUpperCase(),
                "ic": rep.ic,
                "mw": rep.mw,
                "sc": rep.sc,
            };
            const repLower = {
                "from": rep.from.toLowerCase(),
                "to": rep.to.toLowerCase(),
                "ic": rep.ic,
                "mw": rep.mw,
                "sc": rep.sc,
            };
            newReplacements.push(repTitle);
            newReplacements.push(repUpper);
            newReplacements.push(repLower);
        } else {
            newReplacements.push(rep);
        }
    }
    return newReplacements;
}

// Return regexp for the replacement.
function makeRegexp(rep) {
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
        const re = replacements[i].regexp;
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
        const {tabId} = message;
        const replacements = expandAutoCaseReplacements(message.replacements);
        // Bind a regexp to each replacement object.
        replacements.forEach((replacement) => {
            replacement.regexp = makeRegexp(replacement);
        });
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
