var tag = "rewrites",
    tag_out = "words_in",
    table = document.getElementById("pref_table"),
    save = document.getElementById("save_button"),
    add = document.getElementById("add_button"),
    // html code for adding sorting buttons to each row.
    moveup = "<span id='moveup'>▲</span>",
    delrow = "<span id='delrow'>☓</span>",
    sortingHTML = "<span style='float:right;'>"+moveup+delrow+"</span>";

// Make an input inside of a td element with given value and checked
// Append stuff html code at the end of the input.
function makeTD(type, value, checked, stuff) {
    var td = document.createElement('td'),
        inp = document.createElement('input');
    inp.type = type;
    if (value)
        inp.value = value;
    if (checked)
        inp.checked = checked;
    if (stuff)
        td.innerHTML = stuff;
    td.insertBefore(inp, td.firstChild)
    return td;
}

// Append a row to the table with given values for inputs.
function appendRow(data) {
    var tr = document.createElement("tr"),
        phrase = makeTD("text", data.from),
        replace = makeTD("text", data.to),
        case_box = makeTD("checkbox", null, data.ic),
        whole_box = makeTD("checkbox", null, data.mw, sortingHTML);
    tr.appendChild(phrase);
    tr.appendChild(replace);
    tr.appendChild(case_box);
    tr.appendChild(whole_box);
    table.appendChild(tr);
    attachDelRowListener(tr.querySelector("#delrow"));
    attachMoveUpListener(tr.querySelector("#moveup"));
}

// Append an empty row to the table.
function appendEmptyRow() {
    appendRow({from:"", to:"", ic:false, mw:false});
}

// Call func(elem) on each element of arr.
function forEach(arr, func) {
    for (var i = 0; i < arr.length; i++)
        func(arr[i]);
}

// Put b in front of a.
function swapRows(a, b) {
    b.parentNode.insertBefore(b, a);
}

// Listen on clicking up arrow for a row.
function attachMoveUpListener(itm) {
    (function(e) {
        e.addEventListener('click', function() {
            // can't move top element up
            var thisRow = e.parentNode.parentNode.parentNode;
            if (thisRow.rowIndex > 1) {
                var prevRow = e.parentNode.parentNode.parentNode.previousSibling;
                swapRows(prevRow, thisRow);
            }
        });
    })(itm);
}

// Listen on clicking delete button of a row.
function attachDelRowListener(itm) {
    (function(e) {
        e.addEventListener('click', function() {
            table.deleteRow(e.parentNode.parentNode.parentNode.rowIndex);
        });
    })(itm);
}

// Receive data on port and add to the table.
self.port.on(tag, function(data) {
    var replacements = JSON.parse(data);
    // put the data into the page
    for (var i = 0; i < replacements.length; i++) {
        appendRow(replacements[i]);
    }
    // make sure we have at least 3 rows in the table
    for (var i = replacements.length; i < 3; i++) {
        appendEmptyRow();
    }
});

var saveTimeout;
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
            "ic": d[2].checked,
            "mw": d[3].checked
        });
    }
    self.port.emit(tag_out, JSON.stringify(data));
    document.querySelector("#saved_text").style.display = 'inline';
    if (saveTimeout)
        window.clearTimeout(saveTimeout);
    saveTimeout = window.setTimeout(function() {
        document.querySelector("#saved_text").style.display = 'none';
    }, 800);
});

add.addEventListener('click', appendEmptyRow);
