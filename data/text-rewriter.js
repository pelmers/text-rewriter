const api = chrome;

const NODE_LIMIT = 50000;

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

// this is some text => This is some text
function sentenceCase(str) {
    const parts = str.split(' ');
    for (let i = 0; i < parts.length; i++) {
        if (i === 0) {
            parts[i] = titleCase(parts[i]);
        } else {
            parts[i] = parts[i].toLowerCase();
        }
    }
    return parts.join(' ');
}

// delete duplicate copies of replacements entries.
function dedup(replacements) {
    const deduped = [];
    for (let i = 0; i < replacements.length; i++) {
        const a = replacements[i];
        let unique = true;
        for (let j = i + 1; j < replacements.length; j++) {
            const b = replacements[j];
            if (a.from == b.from && a.to == b.to &&
                a.ic === b.ic && a.mw === b.mw && a.sc === b.sc) {
                unique = false;
            }
        }
        if (unique) {
            deduped.push(a);
        }
    }
    return deduped;
}


// Return new list of replacements with autocase replacements expanded.
function expandAutoCaseReplacements(replacements) {
    let newReplacements = [];
    for (let i = 0; i < replacements.length; i++) {
        const rep = replacements[i];
        if (rep.sc && !rep.ic) {
            const smartCases = [
            {
                "from": titleCase(rep.from),
                "to": titleCase(rep.to),
                "ic": rep.ic,
                "mw": rep.mw,
                "sc": rep.sc,
            },
            {
                "from": sentenceCase(rep.from),
                "to": sentenceCase(rep.to),
                "ic": rep.ic,
                "mw": rep.mw,
                "sc": rep.sc,
            },
            {
                "from": rep.from.toUpperCase(),
                "to": rep.to.toUpperCase(),
                "ic": rep.ic,
                "mw": rep.mw,
                "sc": rep.sc,
            },
            {
                "from": rep.from.toLowerCase(),
                "to": rep.to.toLowerCase(),
                "ic": rep.ic,
                "mw": rep.mw,
                "sc": rep.sc,
            }];
            newReplacements = newReplacements.concat(dedup(smartCases));
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

// Recursively replace all the Text nodes in the DOM subtree rooted at target.
// Return {totalCount: number, visited: number} representing number of replacements and nodes visited.
function treeReplace(target, replacements, visitSet) {
    const tree = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, null, false);
    let cur;
    let totalCount = 0;
    let visited = 0;
    if (replacements.length > 0) {
        while ((cur = tree.nextNode()) != null && visited < NODE_LIMIT) {
            if (visitSet != null) {
                if (visitSet.has(cur)) {
                    continue;
                } else {
                    visitSet.add(cur);
                }
                // Skip replacing under the active element if it's not the body, since it may interfere with typing.
                if (!document.activeElement.contains(document.body) && document.activeElement.contains(cur)) {
                    continue;
                }
            }

            // Ignore elements whose content was already changed, to avoid rewriting several times.
            if (!cur.textRewriterModified) {
                const {text, count} = performReplacements(cur.nodeValue, replacements);
                cur.nodeValue = text;
                if (count) {
                    cur.textRewriterModified = true;
                }
                totalCount += count;
                visited++;
            }
        }
    }
    return {totalCount, visited};
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
        console.time(event);
        // handle response, which has a list of replacements
        const {tabId, use_dynamic2} = message;
        const replacements = expandAutoCaseReplacements(message.replacements);
        // Bind a regexp to each replacement object.
        replacements.forEach((replacement) => {
            replacement.regexp = makeRegexp(replacement);
        });
        document.title = performReplacements(document.title, replacements).text;
        const {visited, totalCount} = treeReplace(document.body, replacements);
        console.timeEnd(event);
        console.info(visited, "nodes visited");
        api.runtime.sendMessage({ event: "replaceCount" , totalCount, tabId });
        if (use_dynamic2) {
            // Attach the mutation observer after we've finished our initial replacements.
            let dynamicCount = totalCount;
            const observeParams = {characterData: true, childList: true, subtree: true};
            const observer = new MutationObserver(function(mutations) {
                // Make sure the changes the observer makes don't re-trigger itself.
                observer.disconnect();
                // Keep a map of visited nodes so we don't rewrite same one multiple times.
                const visitSet = new WeakSet();
                for (let i = 0; i < mutations.length; i++) {
                    dynamicCount += treeReplace(mutations[i].target, replacements, visitSet).totalCount;
                }
                api.runtime.sendMessage({ event: "replaceCount" , totalCount: dynamicCount, tabId });
                // Reattach ourselves once we're done.
                observer.observe(document.body, observeParams);
            });
            observer.observe(document.body, observeParams);
            const titleObserver = new MutationObserver(function(mutations) {
                titleObserver.disconnect();
                document.title = performReplacements(document.title, replacements).text;
                titleObserver.observe(document.querySelector('title'), observeParams);
            })
            titleObserver.observe(document.querySelector('title'), observeParams);
        }
    }
});
