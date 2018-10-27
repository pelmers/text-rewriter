const api = chrome;

const storage = api.storage.local;

const table = document.getElementById("pref_table"),
    save_btn = document.getElementById("save_button"),
    import_btn = document.getElementById("import_button"),
    purge_btn = document.getElementById("purge_button"),
    add_btn = document.getElementById("add_button"),
    scratchpad = document.getElementById("scratchpad"),
    default_replacements = [{
        "from": "mispell",
        "to": "misspell",
        "ic": false,
        "mw": false,
        "sc": false,
    }],
    use_dynamic_cb = document.getElementById("use_dynamic_checkbox");

// Make a span element with the given text and class.
function makeSpan(cl, text) {
    const sp = document.createElement('span');
    sp.appendChild(document.createTextNode(text));
    sp.classList.add(cl);
    return sp;
}

// Make an input inside of a td element with given value and checked.
function makeTD(type, value, checked) {
    const td = document.createElement('td'),
        inp = document.createElement('input');
    inp.type = type;
    if (value)
        inp.value = value;
    if (checked)
        inp.checked = checked;
    td.insertBefore(inp, td.firstChild)
    return td;
}

// Append a row to the table with given values for inputs.
function appendRow(data) {
    const tr = document.createElement("tr"),
        phrase = makeTD("text", data.from),
        replace = makeTD("text", data.to),
        case_box = makeTD("checkbox", null, data.ic),
        whole_box = makeTD("checkbox", null, data.mw),
        smart_box = makeTD("checkbox", null, data.sc),
        delrow = makeSpan('delrow', 'x');
    delrow.style.float = 'right';
    smart_box.appendChild(delrow);
    tr.appendChild(phrase);
    tr.appendChild(replace);
    tr.appendChild(case_box);
    tr.appendChild(whole_box);
    tr.appendChild(smart_box);
    table.appendChild(tr);
    attachDelRowListener(tr.querySelector(".delrow"));
}

// Append an empty row to the table.
function appendEmptyRow() {
    appendRow({from:"", to:"", ic:false, mw:false, sc:false});
}

// Call func(elem) on each element of arr.
function forEach(arr, func) {
    for (let i = 0; i < arr.length; i++)
        func(arr[i]);
}

// Listen on clicking delete button of a row.
function attachDelRowListener(itm) {
    (function(e) {
        e.addEventListener('click', function() {
            table.deleteRow(e.parentNode.parentNode.rowIndex);
        });
    })(itm);
}

// Add the data from replacements array to the table.
function initFromData(replacements) {
    // put the data into the page
    forEach(replacements, appendRow);
    // make sure we have at least one row in the table
    for (let i = table.children.length; i <= 1; i++) {
        appendEmptyRow();
    }
}

let saveTimeout;
// When document ready, add current preferences and attach buttons.
document.addEventListener('DOMContentLoaded', function () {
    storage.get({ replacements: default_replacements, use_dynamic2: false }, function (data) {
        initFromData(data.replacements);
        scratchpad.value = JSON.stringify(data.replacements);
        use_dynamic_cb.checked = data.use_dynamic2;
    });

    use_dynamic_cb.addEventListener("change", function() {
        storage.set({ use_dynamic2: use_dynamic_cb.checked });
    });

    // Collect all row data and save to local storage.
    save_btn.addEventListener('click', function () {
        const data = [],
            c = table.children;
        for (let i = 1; i < c.length; i++) {
            const d = c[i].querySelectorAll("input");
            if (d[0].value.length === 0)
                continue;
            data.push({
                "from": d[0].value,
                "to": d[1].value,
                "ic": d[2].checked,
                "mw": d[3].checked,
                "sc": d[4].checked
            });
        }
        scratchpad.value = JSON.stringify(data);
        storage.set({ replacements: data }, function () {
            document.querySelector("#saved_text").style.display = 'inline';
        });
        if (saveTimeout)
            window.clearTimeout(saveTimeout);
        saveTimeout = window.setTimeout(function () {
            document.querySelector("#saved_text").style.display = 'none';
        }, 800);
    });

    import_btn.addEventListener('click', function () {
        initFromData(JSON.parse(scratchpad.value));
        save_btn.click();
    });

    purge_btn.addEventListener('click', function () {
        const rows = table.children;
        for (let i = rows.length - 1; i >= 1; i--) {
            table.removeChild(rows[i]);
        }

        save_btn.click();
    });

    add_btn.addEventListener('click', appendEmptyRow);
});
