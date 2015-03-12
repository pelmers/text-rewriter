var data = require("sdk/self").data,
    pageMod = require("sdk/page-mod");

pageMod.PageMod({
    include: "*",
    contentScriptFile: data.url("page-mod.js")
});
