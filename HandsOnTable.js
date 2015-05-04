var accountName = "finalproject6830";
var password = 'databases'
var repoName = "test";
var fullTableName = "";
var dataTypes = ['bigint', 'bit', 'decimal', 'int', 'money', 'numeric', 'smallint', 'smallmoney', 'tinyint', 'float', 'real', 'date', 'datetime2', 'datetime', 'datetimeoffset', 'smalldatetime', 'time',
                'char', 'text', 'varchar', 'nchar', 'ntext', 'nvarchar', 'binary', 'image', 'varbinary', 'cursor', 'hierarchyid', 'sql_variant', 'table', 'timestamp', 'uniqueidentifier', 'xml'];
var numberTypes = ["bigint", "bit", "decimal", "int", "integer", "money", "numeric", "smallint", "smallmoney", "tinyint", "float", "real", "double", "double precision"]
var decimalTypes = ["decimal", "money", "numeric", "smallmoney", "float", "real", "double", "double precision"]

$(document).ready(function () {
	transport = new Thrift.Transport("http://datahub.csail.mit.edu/service/json"),	protocol = new Thrift.Protocol(transport),
	client = new DataHubClient(protocol),
	con_params = new ConnectionParams({'user': accountName, 'password': password}),
	con = client.open_connection(con_params),
    repos = client.list_repos(con);
    var unsavedData = [];

    chart_client = charts(accountName, client, con);
    $('#chart_menu').click(chart_client.openModal);

    $('#results').handsontable({
		minSpareRows: 1,
        manualColumnMove: true,
        manualRowMove: true,
        manualColumnResize: true,
        manualRowResize: true,
        columnSorting: true,
        rowHeaders: true,
        // needs testing to see how slow with good wifi
        persistentState: true,
		contextMenu: ['remove_col', 'row_above', 'row_below', 'col_left', 'col_right'],
		afterRemoveCol: function (index, amount) {
			var field_names = client.get_schema(con, fullTableName);
			for (var i = index; i < index + amount; i++) {
				if (field_names.tuples.length > i) {
					var field_name = field_names.tuples[i].cells[0];
					client.execute_sql(con, 'ALTER TABLE ' + fullTableName + ' DROP COLUMN ' + field_name);
				}
			}
		},
        cells: function(row, col, prop) {
            this.renderer = function (instance, td, row, col, prop, value, cellProperties) {
                if (cellProperties.type === 'numeric') {
                    Handsontable.renderers.NumericRenderer.apply(this, arguments);
                } else if (cellProperties.type === 'password') {
                    Handsontable.renderers.PasswordRenderer.apply(this, arguments);
                } else if (cellProperties.type === 'autocomplete') {
                    Handsontable.renderers.AutocompleteRenderer.apply(this, arguments);
                } else if (cellProperties.type === 'checkbox') {
                    Handsontable.renderers.CheckboxRenderer.apply(this, arguments);
                } else {
                    Handsontable.renderers.TextRenderer.apply(this, arguments);
                }
                if (cellProperties.unsaved === 'true') {
                    console.log(cellProperties);
                    td.style.background = 'yellow';
                } else {
                    td.style.background = 'white';
                }
            };
        }
	});
    $('#results').handsontable('getInstance').addHook('afterChange', function (changes) {
        if (!changes) { return; }
        var hot = this;
        $.each(changes, function (index, element) {
            var p_key = hot.getDataAtCell(element[0], hot.getSettings().colHeaders.indexOf('p_key'));
            var field_name = hot.getSettings().colHeaders[element[1]];
            var new_val = hot.getCellMeta(element[0],element[1]).type === 'numeric' ? element[3] : "'" + element[3] + "'";
            new_val = new_val === '' ?  '0' : new_val;
            var sql = 'UPDATE ' + fullTableName + ' SET ' + field_name + '=' + new_val + ' WHERE p_key = ' + p_key;
            console.log(sql);
            //var res = client.execute_sql(con, sql);
            //console.log(res);
            //if (res.status) { hot.setCellMeta(element[0], element[1], 'unsaved', 'false'); }
            //hot.render();
        });
    });
    $('#results').handsontable('getInstance').addHook('beforeChange', function (changes, source) {
        // do validation of changes here
        var hot = this;
        validChanges = []
        $.each(changes, function (index, change) {
            console.log(change);
            var dataType = getDataTypeForCol(hot.getSettings().colHeaders[change[1]]);
            hot.setCellMeta(change[0], change[1], 'unsaved', 'true');
            unsavedData.push([change[0], change[1]]);
        });
    });
    $('#results').handsontable('getInstance').addHook('beforeKeyDown', function (event) {
        console.log(event);
        var selectedRange = $('#results').handsontable('getInstance').getSelected();
        var td = $($('#results').handsontable('getInstance').getCell(selectedRange[0], selectedRange[1]));
        // if the equals key is pressed, enter the equation environment
        if (event.keyCode === 187) {
            var div = document.createElement('div');
            div.html = "Hello"
            div.style.left = td.offset().left + td.width() + 10;
            div.style.top = td.offset().top;
            div.style.height = td.height();
            //div.style.width = 50;
            div.style.position = 'absolute';
            div.style.backgroundColor = '#e7e7e7';

            var checkbtn = document.createElement('button');
            var xbtn = document.createElement('button');
            checkbtn.onclick = function () {
                // evaluate formula for all highlighted cells


                $(div).remove();
            };
            xbtn.onclick = function () {
                $('#results').handsontable('getInstance').undo();
                $(div).remove();
            }
            $(checkbtn).html('<span class="glyphicon glyphicon-ok"></span>');
            $(xbtn).html('<span class="glyphicon glyphicon-remove"></span>');
            div.appendChild(xbtn);
            div.appendChild(checkbtn);
            document.body.appendChild(div);
        }
    });
    $('#results').handsontable('getInstance').addHook('afterCreateCol', function (index, amount) {
        var hot = this;
        // set up and present modal
        $('#addColModal').modal();
    });
    $('#addColModal').find(".go_button").click(function() {
        // do the add col sql statement
        var sql = 'ALTER TABLE ' + fullTableName + ' ADD COLUMN ' + $('#newColName').val() + ' '  + $('#colTypes').val();
        console.log(sql);
        var res = client.execute_sql(con, sql);
        console.log(client.get_schema(con, fullTableName).tuples);
        $('#results').data('handsontable').updateSettings({
            colHeaders: client.get_schema(con, fullTableName).tuples.map(function (val) { return val.cells[0] }),
        });
    });
    $(document).on('click', '#save', function() {
        // save all changes
        console.log(unsavedData);
        var hot = $('#results').handsontable('getInstance');
        // parse through unsaved data and orient it by row
        changesByRow = {};
        $.each(unsavedData, function (index, data) {
            changesByRow[data[0]] = changesByRow[data[0]] === undefined ? [data[1]] : changesByRow[data[0]].concat([data[1]]);
        });
        console.log(changesByRow);
        var stmts = [];
        $.each(changesByRow, function (rowNum, changeList) {
            // see if rowNum has a p_key (if not we add a new row)
            var p_key = hot.getDataAtCell(rowNum, hot.getSettings().colHeaders.indexOf('p_key'));
            var sql = '';
            if (p_key) {
                // update row
                sql = 'UPDATE ' + fullTableName + ' SET ';
                $.each(changeList, function (index, changeCol) {
                    var field_name = hot.getSettings().colHeaders[changeCol];
                    var new_text = hot.getDataAtCell(rowNum, changeCol);
                    var new_val = hot.getCellMeta(rowNum, changeCol).type === 'numeric' ? new_text : "'" + new_text + "'";
                    new_val = new_val === '' ?  '0' : new_val;
                    sql += field_name + '=' + new_val + (index === changeList.length -1 ? '' : ',');
                    hot.setCellMeta(rowNum, changeCol, 'unsaved', 'false'); 
                });
                sql += ' WHERE p_key = ' + p_key;
            } else {
                // create a new row
                sql = 'INSERT INTO ' + fullTableName + '(';
                var fieldNames = [];
                var newVals = [];
                $.each(changeList, function (index, changeCol) {
                    var field_name = hot.getSettings().colHeaders[changeCol];
                    var new_text = hot.getDataAtCell(rowNum, changeCol);
                    var new_val = hot.getCellMeta(rowNum,changeCol).type === 'numeric' ? new_text : "'" + new_text + "'";
                    new_val = new_val === '' ?  '0' : new_val;
                    fieldNames.push(field_name);
                    newVals.push(new_val);
                    hot.setCellMeta(rowNum, changeCol, 'unsaved', 'false'); 
                });
                sql += fieldNames + ') VALUES (' + newVals + ')';
            }
            stmts.push(sql);
        });
        console.log(stmts);
        $.each(stmts, function (index, sql) {
            var res = client.execute_sql(con, sql);
            console.log(res);
            // todo: HANDLE ERRORS
            //if (res.status) { }
        });
        hot.render();
    });

    // TODO refactor and move this out
    // prepare the add col modal
    $('#colTypes').autocomplete({ source: dataTypes, appendTo: '#addColModal#typeDiv' });
    updateRepo(repoName);
});

var getDataTypeForCol = function(colName) {
    var res = client.execute_sql(con, 'SELECT pg_typeof("' + colName + '") from ' + fullTableName + ' limit 1');
    return res.tuples[0].cells[0]
}

var formatNewVal = function(newVal, type) {
    // make appropriate formatting for string v. int v. date (etc.)
    return newVal;
}

var updateRepo = function(newRepoName, tableToShow) {
    repoName = newRepoName;
    var tables = client.list_tables(con, repoName);
    if (tableToShow == null) {
        tableToShow = accountName + "." + repoName + "." + tables.tuples[0].cells[0];
    }
    fullTableName = tableToShow;
    updateTableData(tableToShow);
    updateTableMenu(tableToShow.substr(accountName.length+1), tables);
    updateRepositoryMenu(repoName, repos);
}

var updateCurrentTable = function(repoName, tableName) {
    var tables = client.list_tables(con, repoName);
    fullTableName = accountName + "." + repoName + "." +tableName;
    updateTableData(accountName + "." + repoName + "."+ tableName);
    updateTableMenu(repoName + "." + tableName, tables);
    updateRepositoryMenu(repoName, repos);
}

var updateTableData = function(tableName) {
    try {
        var res = client.execute_sql(con, 'create view ' + tableName + '_view as select * from ' + tableName);
	} catch (err) {
        console.log(err);
    }
    var res = client.execute_sql(con, 'select * from '+tableName);//+'_view');
	var data = res.tuples.map(function (tuple) { return tuple.cells; });
    var hot = $('#results').handsontable('getInstance');

    // If the table doesn't have a primary key, add one for every row
    if (res.field_names.indexOf('p_key') === -1) {
        // Add p_key field
        var alterRes = client.execute_sql(con, 'ALTER TABLE ' + tableName + ' ADD p_key SERIAL');
        res = client.execute_sql(con, 'select * from ' + tableName);
        data = res.tuples.map(function (tuple) { return tuple.cells; });
    }
    var columns = [];
    $.each(res.field_names, function (index, colData) {
        var dataType = getDataTypeForCol(colData);
        var colDataType = 'text'
        if (numberTypes.indexOf(dataType) > -1) {
            // var colData = { type: 'numeric', allowInvalid: false };
            // if (decimalTypes.indexOf(dataType) > -1) {
            //     colData.format = '0,0.00'
            // }
            // columns.push(colData);
            colDataType = 'numeric'
        } else if (dataType === 'date') {
            colDataType = 'date'
        } 
        // run through all cells in col
        for (var i = 0; i < hot.countRows(); i++) {
            hot.getCellMeta(i, index).type = colDataType;
        }
    });
    console.log(columns);
    console.log(res.field_names);
	$('#results').data('handsontable').updateSettings({
        data: data, 
        readOnly: false, 
        colHeaders: res.field_names, 
        //columns: columns,
    });
    unsavedData = [[]];
    for (var i = 0; i < data.length; i++) {
        unsavedData[i] = new Array(columns.length + 1).join('0').split('').map(parseFloat);
    }
    console.log(unsavedData);
}

var updateTableMenu = function(currentTableName, tables) {
    $(".table-name").text(currentTableName);
    var shortTableName = currentTableName.substr(currentTableName.indexOf(".")+1);
    var table_names = tables.tuples.map(function (tuple) { return tuple.cells[0]; }).reverse();
    $(".table-link").remove();
    table_names.forEach(function (name) { 
        var midName = repoName + "." + name;
        var tableLink = $("<li class='table-link'><a href='#'>"+midName+"</a></li>");
        tableLink.find("a").click(function() {
            $('#results').handsontable('getInstance').runHooks('persistentStateReset');
            fullTableName = accountName + "." + midName;
            updateTableData(fullTableName);
            updateTableMenu(midName, tables); 
        });
        // if (name == shortTableName) {
        //     tableLink.addClass("disabled");
        // }
        $(".tables-menu").prepend(tableLink);
    });
    chart_client.setTableInfo(repoName, shortTableName);
}

var updateRepositoryMenu = function(currentRepoName, repos) {
    repoNames = repos.tuples.map(function (tuple) { return tuple.cells[0]; });
    $(".repo-link").remove();
    repoNames.forEach(function (name) {
        var repoLink = $("<li class='repo-link'><a href='#'>"+name+"</a></li>");
        repoLink.find("a").click(function() {updateRepo(name); });
        $(".tables-menu").append(repoLink);
        if (name == currentRepoName) {
            repoLink.addClass("disabled");
        }
    });
}
