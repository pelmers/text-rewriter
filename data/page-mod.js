var tag = "rewrites";
self.port.on(tag, function(data) {
    var replacements = JSON.parse(data),
        tree = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false),
        cur = tree.nextNode();
    while (cur) {
        var text = cur.nodeValue;
        // perform the replacements
        for (var i = 0; i < replacements.length; i++) {
            var rep = replacements[i],
                ign = (rep.ic)?"i":"",
                reg = new RegExp(rep.from, "g"+ign);
            text = text.replace(reg, rep.to);
        }
        cur.nodeValue = text;
        cur = tree.nextNode();
    }
});

