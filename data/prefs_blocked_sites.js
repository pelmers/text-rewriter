(function() {

const api = chrome;

const storage = api.storage.local;

// TODO: write this thing in typescript some day

const table = document.getElementById("website_table"),
    save_btn = document.getElementById("website_save_button"),
    clear_btn = document.getElementById("website_clear_button"),
    add_btn = document.getElementById("website_add_button");

// Make a span element with the given text and class.
function makeSpan(cl, text) {
    const sp = document.createElement('span');
    sp.appendChild(document.createTextNode(text));
    sp.classList.add(cl);
    return sp;
}

function makeTD(type, value) {
    const td = document.createElement('td'),
        inp = document.createElement('input');
    inp.type = type;
    if (value)
        inp.value = value;
    td.insertBefore(inp, td.firstChild)
    return td;
}

// Append a row to the table with given values for inputs.
function appendRow(data) {
    const tr = document.createElement("tr"),
        pattern = makeTD("text", data.pattern),
        delrow = makeSpan('delrow', 'x');
    delrow.style.float = 'right';
    pattern.appendChild(delrow);
    tr.appendChild(pattern);
    table.appendChild(tr);
    attachDelRowListener(tr.querySelector(".delrow"));
}

// Append an empty row to the table.
function appendEmptyRow() {
    appendRow({pattern: ""});
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

function appendFromData(blockPatterns) {
    // put the data into the page
    forEach(blockPatterns, appendRow);
    // make sure we have at least one row in the table
    for (let i = table.children.length; i <= 1; i++) {
        appendEmptyRow();
    }
}

let saveTimeout;
// When document ready, add current preferences and attach buttons.
document.addEventListener('DOMContentLoaded', function () {
    storage.get({
        blockPatterns: [],
    }, function (data) {
        appendFromData(data.blockPatterns);
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
                pattern: d[0].value,
            });
        }
        if (saveTimeout) {
            window.clearTimeout(saveTimeout);
        }
        storage.set({
            blockPatterns: data,
        }, function () {
            document.querySelector("#website_saved_text").style.display = 'inline';
            saveTimeout = window.setTimeout(function () {
                document.querySelector("#website_saved_text").style.display = 'none';
            }, 800);
        });
    });

    clear_btn.addEventListener('click', function () {
        // the first row is the header, so delete up to that point
        for (let row = table.rows.length - 1; row > 0; row--) {
            table.deleteRow(row);
        }
        appendFromData([]);
        // don't save immediately in case it's an accident
    });

    add_btn.addEventListener('click', appendEmptyRow);
});

})();