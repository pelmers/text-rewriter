Text Rewriter
=============

A small Firefox plugin to rewrite customizable patterns in a page as something else.
Created mostly for personal amusement, inspired by [XKCD #1288](http://xkcd.com/1288/).
By default this provides a "mispell" -> "misspell" replacement.

The plugin supports any Javascript regular expressions, including using
backrefs and captures. We just visit the visible text nodes on the page and use
nodeValue.replace for each provided pattern. This means if there is an
overlapping pair of patterns A -> B and B -> C, then A - > C is shown.

[Install the latest release](https://github.com/pelmers/moz-text-rewriter/releases)

Development
-----------

This addon uses [Jetpack](https://developer.mozilla.org/en-US/Add-ons/SDK).
Once it's installed you can run it with

```bash
jpm run --prefs test/prefs.json
```

The _prefs.json_ file is necessary to allow unsigned addons be installed.
In our case we're testing so, we go ahead and activate it.