var data = require("sdk/self").data,
    pageMod = require("sdk/page-mod"),
    prefs = require("sdk/simple-prefs"),
    tabs = require("sdk/tabs"),
    tag = "rewrites";

function emitWords(worker) {
    var words = "some stuff";
    worker.port.emit(tag, words);
}

pageMod.PageMod({
    include: "*",
    contentScriptFile: data.url("page-mod.js"),
    onAttach: emitWords
});

pageMod.PageMod({
    include: /.*text-rewriter\/data\/prefs.html/,
    contentScriptFile: data.url("prefs.js"),
    onAttach: emitWords
});

prefs.on("Preferences", function() {
    tabs.open(data.url("prefs.html"));
});
