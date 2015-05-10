var tag = "rewrites";

// Return regexp for the replacement.
function makeRegex(rep) {
    var ign = (rep.ic)?"i":"",
        start = (rep.mw)?"\\b":"",
        end = (rep.mw)?"\\b":"";
    return new RegExp(start+rep.from+end, "g"+ign);
}

// Call text.replace on each regex in replacements.
function performReplacements(text, replacements) {
    for (var i = 0; i < replacements.length; i++) {
        text = text.replace(makeRegex(replacements[i]), replacements[i].to);
    }
    return text;
}

self.port.on(tag, function(data) {
    var replacements = JSON.parse(data),
        tree = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false),
        cur = tree.nextNode();
    document.title = performReplacements(document.title, replacements);
    while (cur) {
        cur.nodeValue = performReplacements(cur.nodeValue, replacements);
        cur = tree.nextNode();
    }
});

