var tag = "rewrites",
    tag_out = "words_in",
    table = document.getElementById("pref_table"),
    save = document.getElementById("save_button"),
    add = document.getElementById("add_button");

// Append a row to the table with given values for inputs.
function appendRow(fr, to, ic) {
    var tr = document.createElement("tr"),
    phrase = document.createElement("td"),
    phrase_in = document.createElement("input");
    replace = document.createElement("td"),
    replace_in = document.createElement("input");
    ignore_case = document.createElement("td"),
    case_box = document.createElement("input");
    case_box.type = "checkbox";
    phrase_in.type = "text";
    replace_in.type = "text";
    phrase_in.value = fr;
    replace_in.value = to;
    case_box.checked = ic;
    phrase.appendChild(phrase_in);
    replace.appendChild(replace_in);
    ignore_case.appendChild(case_box);
    tr.appendChild(phrase);
    tr.appendChild(replace);
    tr.appendChild(ignore_case);
    table.appendChild(tr);
}

// Collect all row data and send back on port.
save.addEventListener('click', function() {
    var data = [],
        c = table.children;
    for (var i = 1; i < c.length; i++) {
        var d = c[i].querySelectorAll("input");
        if (d[0].value.length === 0)
            continue;
        data.push({
            "from": d[0].value,
            "to": d[1].value,
            "ic": d[2].checked
        });
    }
    self.port.emit(tag_out, JSON.stringify(data));
});

add.addEventListener('click', function() {
    appendRow("", "", false);
});

// Receive data on port and add to the table.
self.port.on(tag, function(data) {
    var replacements = JSON.parse(data);
    // put the data into the page
    for (var i = 0; i < replacements.length; i++) {
        var fr = replacements[i].from,
            to = replacements[i].to,
            ic = replacements[i].ic;
        appendRow(fr, to, ic)
    }
});
