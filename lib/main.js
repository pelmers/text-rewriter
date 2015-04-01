var data = require("sdk/self").data,
    pageMod = require("sdk/page-mod"),
    prefs = require("sdk/simple-prefs"),
    tabs = require("sdk/tabs"),
    ss = require("sdk/simple-storage"),
    tag = "rewrites",
    tag_in = "words_in",
    // CANTERBURY TALES Middle English rewrites:
    default_data = [{"from":"i([^aeiou])e\\b","to":"y$1e","ic":false,"mw":false},{"from":"igh\\b","to":"ye","ic":false,"mw":false},{"from":"([a-zA-Z]{3})y\\b","to":"$1ye","ic":false,"mw":false},{"from":"([^ld][ae])y","to":"$1yn","ic":false,"mw":false},{"from":"ee([^n])\\b","to":"e$1e","ic":false,"mw":false},{"from":"(\\w{2}[^aeiou][aiou])n(s?)\\b","to":"$1nne$2","ic":false,"mw":false},{"from":"(\\w)en\\b","to":"$1an","ic":false,"mw":false},{"from":"ea","to":"e","ic":false,"mw":false},{"from":"oo(\\w)\\b","to":"oo$1e","ic":false,"mw":false},{"from":"([^y])ou","to":"$1o","ic":false,"mw":false},{"from":"ew\\b","to":"ewe","ic":false,"mw":false},{"from":"ere\\b","to":"er","ic":false,"mw":false},{"from":"ze","to":"s","ic":false,"mw":false},{"from":"oa(\\w)\\b","to":"o$1e","ic":false,"mw":false},{"from":"(\\w{2})owe?","to":"$1ou","ic":false,"mw":false},{"from":"quor","to":"cour","ic":false,"mw":false},{"from":"(\\w)and(s?)\\b","to":"$1onde$2","ic":false,"mw":false},{"from":"([^wW\\s])as\\b","to":"$1ath","ic":false,"mw":false},{"from":"([^c])tion","to":"$1cyon","ic":false,"mw":false},{"from":"([^t])hr","to":"$1r","ic":false,"mw":false},{"from":"ai","to":"aye","ic":false,"mw":false},{"from":"([^aeiou])on\\b","to":"$1one","ic":false,"mw":false}];

// array of {from:str, to:str, ic: bool, mw: bool} objects
if (ss.storage.replacements === undefined)
    ss.storage.replacements = JSON.stringify(default_data);

// Send JSON data to the content script.
function emitWords(worker) {
    worker.port.emit(tag, ss.storage.replacements);
}

// Activate on all pages.
pageMod.PageMod({
    include: "*",
    contentScriptFile: data.url("text-rewriter.js"),
    onAttach: emitWords
});

// For preferences page.
pageMod.PageMod({
    include: /.*text-rewriter\/data\/prefs.html/,
    contentScriptFile: data.url("prefs.js"),
    onAttach: function(worker) {
        emitWords(worker);
        worker.port.on(tag_in, function(data) {
            ss.storage.replacements = data;
        });
    }
});

prefs.on("Preferences", function() {
    tabs.open(data.url("prefs.html"));
});
