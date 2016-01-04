var data = require("sdk/self").data,
    pageMod = require("sdk/page-mod"),
    prefs = require("sdk/simple-prefs"),
    tabs = require("sdk/tabs"),
    ss = require("sdk/simple-storage"),
    system = require("sdk/system"),
    tag = "rewrites",
    tag_in = "words_in",
    default_data = [{
        "from": "mispell",
        "to": "misspell",
        "ic": false,
        "mw": false
    }];

// array of {from:str, to:str, ic: bool, mw: bool} objects
if (ss.storage.replacements === undefined)
    ss.storage.replacements = JSON.stringify(default_data);
if (ss.storage.enabled === undefined)
    ss.storage.enabled = true;

// Send JSON data to the content script.
function emitWords(worker) {
    if (ss.storage.enabled)
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

// fennec does not support the toggle button UI; make sure it's desktop Firefox
// taken from https://addons.mozilla.org/en-US/firefox/pages/appversions
if (system.id == "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}") {
    var {ToggleButton} = require("sdk/ui/button/toggle");
    ToggleButton({
        id: "toggle",
        label: "Toggle text rewriter",
        checked: !ss.storage.enabled,
        icon: data.url("icon.png"),
        onChange: function(state) {
            ss.storage.enabled = !state.checked;
            tabs.activeTab.reload();
        }
    });
}
