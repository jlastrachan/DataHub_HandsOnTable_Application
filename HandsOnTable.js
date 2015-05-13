var repoName = "test";
var fullTableName = "";
var dataTypes = ['bigint', 'bit', 'decimal', 'int', 'money', 'numeric', 'smallint', 'smallmoney', 'tinyint', 'float', 'real', 'date', 'datetime2', 'datetime', 'datetimeoffset', 'smalldatetime', 'time',
                'char', 'text', 'varchar', 'nchar', 'ntext', 'nvarchar', 'binary', 'image', 'varbinary', 'cursor', 'hierarchyid', 'sql_variant', 'table', 'timestamp', 'uniqueidentifier', 'xml'];
var numberTypes = ["bigint", "bit", "decimal", "int", "integer", "money", "numeric", "smallint", "smallmoney", "tinyint", "float", "real", "double", "double precision"]
var decimalTypes = ["decimal", "money", "numeric", "smallmoney", "float", "real", "double", "double precision"]

$(document).ready(function () {

    // handle error banner
	var displayErrorMessage = function (errorMsg, errorSubMsg) {
        $('#error_msg').text(errorMsg);
        $('#error_submsg').text((errorSubMsg ? errorSubMsg : 'No more information about this error.'));
        $('#error_alert').show();
    }
    $('.alert .close').on('click', function(e) {
        $(this).parent().hide();
    });


    repos = listRepos();
    var unsavedData = [];

    chart_client = charts(accountName, client, con);
    $('#chart_menu').click(chart_client.openModal);

    $('#results').handsontable({
		minSpareRows: 1,
        manualColumnMove: true,
        //manualRowMove: true, // MESSES UP SAVING BY ROW
        manualColumnResize: true,
        manualRowResize: true,
        columnSorting: true,
        rowHeaders: true,
        // needs testing to see how slow with good wifi
        persistentState: true,
		contextMenu: ['remove_col', 'row_above', 'row_below', 'col_left', 'col_right', 'remove_row'],
		afterRemoveCol: function (index, amount) {
            for (var i = index; i < index + amount; i++) {
                var colHeader = this.getColHeader(i);
                executeSQL(buildSelectQuery(fullTableName, [colHeader], 0), function (res) {
                    getViewFields(fullTableName + '_view', function (fields_set) {
                        fieldName = fullTableName.slice(fullTableName.lastIndexOf('.') + 1) + '.' + colHeader;
                        delete fields_set[fieldName];
                        replaceView(fullTableName + '_view', fields_set);
                        executeSQL(buildDropColumnQuery(fullTableName, colHeader, true), function (res) {
                            // TODO (jennya)
                            return;
                        }, function (err) {
                            displayErrorMessage('Unable to remove column "' + colHeader + '"', err.message);
                            return;
                        });
                    }); 
                }, function (err) {
                    removeColFromView(fullTableName + '_view', colHeader);
                });
            }
		},
        cells: function(row, col, prop) {
            this.renderer = function (instance, td, row, col, prop, value, cellProperties) {
                value = (value === "None" ? '' : value);
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
                    //console.log(cellProperties);
                    td.style.background = 'yellow';
                // } else if (cellProperties.error === 'true') {
                //     td.style.background = 'red';
                } else {
                    td.style.background = 'white';
                }
            };
        }
	});

    // Code for autosaving changes, can be uncommented for functionality
    // $('#results').handsontable('getInstance').addHook('afterChange', function (changes, source) {
    //     if (!changes || source !== 'edit') { return; }
    //     var hot = this;
    //     $.each(changes, function (index, element) {
    //         var p_key = hot.getDataAtCell(element[0], getPKColNum(hot));
    //         var field_name = hot.getColHeader(element[1]);
    //         var new_val = hot.getCellMeta(hot.sortIndex[element[0]][0],element[1]).type === 'numeric' ? element[3] : "'" + element[3] + "'";
    //         new_val = new_val === '' ?  '0' : new_val;

    //         executeSQL(buildUpdateQuery(fullTableName, { field_name: new_val }, p_key), function (res) {
    //             // TODO (jennya)
    //             return;
    //         }, function (err) {
    //             // TODO (jennya)
    //             return;
    //         });
    //     });
    // });
    $('#results').handsontable('getInstance').addHook('beforeChange', function (changes, source) {
        var hot = this;
        $.each(changes, function (index, change) {
            console.log(change);
            hot.setCellMeta(hot.sortIndex[change[0]][0], change[1], 'unsaved', 'true');
            unsavedData.push([change[0], hot.getSettings().colHeaders[change[1]]]);
        });
    });
    $('#results').handsontable('getInstance').addHook('beforeRemoveRow', function (index, amount) {
        console.log(index + ' ' + amount);
        if (unsavedData.length > 0) {
            // TODO (jennya)
            // error message that can't delete row with unsaved data
            return false;
        }
        // do the delete
        var hot = this;
        for (var i = index; i < index + amount; i++) {
            // i is index of row in view
            var pKeyCol = getPKColNum(hot);
            console.log('deleting row with pkey' + hot.getDataAtCell(i, pKeyCol));
        }
    });

    $('#results').handsontable('getInstance').addHook('beforeRemoveCol', function (index, amount) {
        // Don't allow a user to remove the p_key column
        pKeyCol = getPKColNum(this);
        if (pKeyCol >= index && pKeyCol < index + amount) {
            // TODO (jennya)
            // error handle here before returning false
            displayErrorMessage('Can\'t delete the primary key column');
            return false;
        }
    });
    $('#results').handsontable('getInstance').addHook('beforeKeyDown', function (event) {
        var hot = this;
        var selectedRange = hot.getSelected();
        var td = $(hot.getCell(selectedRange[0], selectedRange[1]));
        // if the equals key is pressed, enter the equation environment
        if (event.keyCode === 187) {
            hot.setCellMeta(hot.sortIndex[selectedRange[0]][0], selectedRange[1], 'type', 'text');
            var div = document.createElement('div');
            div.style.left = td.offset().left + td.width() + 10;
            div.style.top = td.offset().top;
            div.style.height = td.height();
            //div.style.width = 50;
            div.style.position = 'absolute';
            div.style.backgroundColor = '#e7e7e7';
            div.class = 'editButtons';

            var checkbtn = document.createElement('button');
            var xbtn = document.createElement('button');
            checkbtn.onclick = function () {
                // evaluate formula for all highlighted cells
                var col_header = hot.getColHeader(selectedRange[1]);
                if (col_header !== 'p_key') {
                    console.log(hot.getDataAtCell(selectedRange[0], selectedRange[1]));
                    console.log(hot.getDataAtCell(hot.sortIndex[selectedRange[0]][0], selectedRange[1]));
                    addColToView(fullTableName + '_view', hot.getDataAtCell(selectedRange[0], selectedRange[1]).substr(1), col_header);
                    
                    // remove old column
                    executeSQL(buildDropColumnQuery(fullTableName, col_header, true), function (res) {
                        refreshCellMeta(fullTableName);
                    }, function (err) {
                        // TODO (jennya)
                        displayErrorMessage('Could not delete column "' + col_header + '"', err.message);
                        return;
                    });
                }
                $(div).remove();
                $('.editButtons').remove();
            };
            xbtn.onclick = function () {
                hot.undo();
                $(div).remove();
            }
            $(checkbtn).html('<span class="glyphicon glyphicon-ok"></span>');
            $(xbtn).html('<span class="glyphicon glyphicon-remove"></span>');
            div.appendChild(xbtn);
            div.appendChild(checkbtn);
            document.body.appendChild(div);
        }
    });
    $('#results').handsontable('getInstance').addHook('afterCellMetaReset', function () {
        refreshCellMeta(fullTableName);
    });
    $('#results').handsontable('getInstance').addHook('afterCreateCol', function (index, amount) {
        $('#newColName').val('');
        $('#colTypes').val('');
        $('#addColModal').modal();
    });
    $('#addColModal').find(".go_button").click(function() {
        // do the add col sql statement
        executeSQL(buildAddColumnQuery(fullTableName, $('#newColName').val(), $('#colTypes').val()), function (res) {
            getColumnNames(fullTableName, function (columnNames) {
                if (!columnNames) {
                    // TODO (jennya): handle error
                }
                $('#results').data('handsontable').updateSettings({
                    colHeaders: columnNames,
                });
                refreshView(fullTableName + '_view');
            });
        }, function (err) {
            // TODO (jennya)
            return;
        });
        
    });
    $(document).on('click', '#save', function() {
        // save all changes
        console.log(unsavedData);
        var hot = $('#results').handsontable('getInstance');
        // parse through unsaved data and orient it by row
        changesByRow = {};
        getColumnNames(fullTableName, function (realCols) {
            // Create a list of rows and for each row store an object 
            // with the fields that need to be updated
            $.each(unsavedData, function (index, data) {
                var row = data[0];
                var colHeader = data[1];
                if (realCols.indexOf(colHeader) > -1) {
                    changesByRow[row] = changesByRow[row] === undefined ? {} : changesByRow[row];
                    changesByRow[row][colHeader] = true;
                }
            });

            // Execute a SQL statement for each row, either create a new row or update an existing one
            var stmts = [];
            $.each(changesByRow, function (rowNum, changeObj) {
                // see if rowNum has a p_key (if not we add a new row)
                var p_key = hot.getDataAtCell(rowNum, getPKColNum(hot));
                var sql = '';
                if (p_key) {
                    // update row
                    changesObj = {};
                    $.each(changeObj, function (v, i) {
                        var field_name = v;
                        var changeCol = getColNum(hot, field_name);
                        var new_text = hot.getDataAtCell(rowNum, changeCol);
                        var new_val = hot.getCellMeta(rowNum, changeCol).type === 'numeric' ? new_text : "'" + new_text + "'";
                        new_val = new_val === '' ?  '0' : new_val;
                        changesObj[field_name] = new_val;
                        hot.setCellMeta(hot.sortIndex[rowNum][0], changeCol, 'unsaved', 'false'); 
                    });
                    sql = buildUpdateQuery(fullTableName, changesObj, p_key);
                } else {
                    // create a new row
                    var fieldNames = [];
                    var newVals = [];
                    $.each(changeObj, function (v, i) {
                        var field_name = v;
                        var changeCol = getColNum(hot, field_name);
                        var new_text = hot.getDataAtCell(rowNum, changeCol);
                        var new_val = hot.getCellMeta(rowNum,changeCol).type === 'numeric' ? new_text : "'" + new_text + "'";
                        new_val = new_val === '' ?  '0' : new_val;
                        fieldNames.push(field_name);
                        newVals.push(new_val);
                        hot.setCellMeta(hot.sortIndex[rowNum][0], changeCol, 'unsaved', 'false'); 
                    });
                    sql = buildInsertQuery(fullTableName, fieldNames, newVals);
                }
                stmts.push(sql);
            });
            console.log(stmts);
            $.each(stmts, function (index, sql) {
                executeSQL(sql, function (res) {
                    // TODO (jennya)
                    return;
                }, function (err) {
                    // TODO (jennya)
                    return;
                });
            });
            unsavedData = [];
            updateTableData(fullTableName);
        });
    });

    // prepare the add col modal
    $('#colTypes').autocomplete({ source: dataTypes, appendTo: '#addColModal#typeDiv' });
    updateRepo(repoName);
});

var updateRepo = function(newRepoName, tableToShow) {
    repoName = newRepoName;
    var tables = client.list_tables(con, repoName);
    var i = 0;
    while (tableToShow == null) {
        tableToShow = accountName + "." + repoName + "." + tables.tuples[i].cells[0];
        console.log(tableToShow);
        if (tableToShow.indexOf('_view') > -1) { tableToShow = null; }
        i++;
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
    executeSQLQuietFail(buildCreateViewQuery(tableName + '_view', buildSelectQuery(tableName, ['*'])), function () {
        getColumnNames(tableName, function (colNames) {
            var buildData = function () {
                executeSQL(buildSelectQuery(tableName + '_view', ['*']), function (res) {
                    console.log(res);
                    var data = res.tuples.map(function (tuple) { return tuple.cells; });
                    var hot = $('#results').handsontable('getInstance');
                    console.log(data);
                    $('#results').data('handsontable').updateSettings({
                        data: data, 
                        //readOnly: false, 
                        colHeaders: res.field_names, 
                        //columns: columns,
                    });
                }, function (err) {
                    // TODO (jennya)
                    return;
                });
            }
            // decide if we need to create a p_key
            if (colNames.indexOf('p_key') === -1) {
                // Add p_key field
                    executeSQL(buildAddColumnQuery(tableName, 'p_key', 'SERIAL'), function (res) {
                        buildData();
                    }, function (err) {
                        // TODO (jennya)
                        return;
                    });
            } else {
                buildData();
            }
        });        
    });
    
    unsavedData = [];
}
var refreshCellMeta = function (tableName) {
    var hot = $('#results').handsontable('getInstance');
    getColumnNames(tableName, function (realCols) {
        $.each(hot.getSettings().colHeaders, function (index, colData) {
            var hasType = (realCols.indexOf(colData) > -1) ? true : false;
            if (hasType) {
                var dataType = getDataTypeForCol(colData);
                var colDataType = { type: 'text' };
                if (numberTypes.indexOf(dataType) > -1) {
                    // allowInvalid: false
                    colDataType = { type: 'numeric', format: '0,0[.]00' };
                } else if (dataType === 'date') {
                    colDataType = { type: 'date', dateFormat: 'MM/DD/YYYY', correctFormat: true};
                }
            }
            // run through all cells in col
            for (var i = 0; i < hot.countRows(); i++) {
                if (hasType) { 
                    $.each(Object.keys(colDataType), function (data_type_key_index, dataType) {
                        hot.setCellMeta(hot.sortIndex[i][0], index, dataType, colDataType[dataType]);
                    });
                    //hot.setCellMeta(i, index, 'type', colDataType); 
                }
                if (colData === 'p_key' || !hasType) {
                    hot.setCellMeta(hot.sortIndex[i][0], index, 'format', '0,0[.]00');
                    hot.setCellMeta(hot.sortIndex[i][0], index, 'type', 'numeric');
                    hot.setCellMeta(hot.sortIndex[i][0], index, 'readOnly', true);
                } 
            }
        });
        hot.render();
    });
}
var updateTableMenu = function(currentTableName, tables) {
    $(".table-name").text(currentTableName);
    var shortTableName = currentTableName.substr(currentTableName.indexOf(".")+1);
    var table_names = tables.tuples.map(function (tuple) { return tuple.cells[0]; }).reverse();
    $(".table-link").remove();
    table_names.forEach(function (name) { 
        if (name.indexOf('_view') === -1) {
            var midName = repoName + "." + name;
            var tableLink = $("<li class='table-link'><a href='#'>"+midName+"</a></li>");
            tableLink.find("a").click(function() {
                //$('#results').handsontable('getInstance').runHooks('persistentStateReset');
                fullTableName = accountName + "." + midName;
                updateTableData(fullTableName);
                updateTableMenu(midName, tables); 
            });
            $(".tables-menu").prepend(tableLink);
        }
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
var addColToView = function (viewName, colExpr, colName) {
    getViewFields(viewName, function (fields_set) {
        tName = viewName.slice(viewName.lastIndexOf('.') + 1, viewName.indexOf('_view'));
        console.log(tName + '.' + colName);
        delete fields_set[tName + '.' + colName];
        fields_set['(' + colExpr + ') as ' + colName] = true;

        replaceView(viewName, fields_set);
    });
}

var removeColFromView = function (viewName, colName) {
    getViewFields(viewName, function (fields_set) {
        var fieldToRemove = '';
        $.each(Object.keys(fields_set), function (index, key) {
            if (key.substr(key.indexOf('AS') + 3) === colName) {
                fieldToRemove = key;
            }
        });
        console.log('removing ' + fieldToRemove);
        delete fields_set[fieldToRemove];
        replaceView(viewName, fields_set);
    });
}

var getViewFields = function (viewName, callback) {
    executeSQL(buildGetViewDefQuery(viewName), function (res) {
        var sql = res.tuples[0].cells[0];
        sql = sql.slice(sql.indexOf('SELECT') + 7, sql.indexOf('FROM'));
        var fields = sql.split(',');
        var fields_set = {};
        $.each(fields, function (index, element) {
            if (!fields_set[element.trim()]) {
                fields_set[element.trim()] = true;
            }
        });
        console.log(fields_set);
        callback(fields_set);
    }, function (err) {
        // TODO (jennya)
        return;
    });
    
}

var refreshView = function (viewName) {
    var tName = viewName.slice(viewName.lastIndexOf('.') + 1, viewName.indexOf('_view'));
    getViewFields(viewName, function (fields_set) {
        console.log(fields_set);
        getColumnNames(viewName.slice(0, viewName.indexOf('_view')), function (fieldNames) {
            $.each(fieldNames, function (index, element) {
                if (fields_set[element] === undefined) {
                    fields_set[tName + '.' + element] = true;
                }
            });
            replaceView(viewName, fields_set);
        });
    });
}

var replaceView = function (viewName, fields_set) {
    var new_cols = Object.keys(fields_set);
    console.log(new_cols);
    // first drop existing view
    executeSQL(buildDropViewQuery(viewName, true), function (res) {
        // now create with new query
        executeSQL(buildCreateViewQuery(viewName, buildSelectQuery(viewName.slice(0, viewName.indexOf('_view')), new_cols)), function (res) {
            updateTableData(viewName.slice(0, viewName.indexOf('_view')));
        }, function (err) {
            // TODO (jennya)
            return;
        });
    }, function (err) {
        // TODO (jennya)
        return;
    });
}

var getPKColNum = function (hot) {
    return getColNum(hot, 'p_key');
}

var getColNum = function (hot, colName) {
    for (var i = 0; i < hot.getSettings().colHeaders.length; i++) {
        if (hot.getColHeader(i) === colName) {
            return i;
        }
    }
    return -1;
}
