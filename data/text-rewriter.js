var tag = "rewrites";

// Return regexp for the replacement.
function makeRegex(rep) {
    var ign = (rep.ic)?"i":"",
        start = (rep.mw)?"\\b":"",
        end = (rep.mw)?"\\b":"";
    return new RegExp(start+rep.from+end, "g"+ign);
}

self.port.on(tag, function(data) {
    var replacements = JSON.parse(data),
        tree = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false),
        cur = tree.nextNode();
    while (cur) {
        var text = cur.nodeValue;
        // perform the replacements
        for (var i = 0; i < replacements.length; i++) {
            text = text.replace(makeRegex(replacements[i]), replacements[i].to);
        }
        cur.nodeValue = text;
        cur = tree.nextNode();
    }
});

