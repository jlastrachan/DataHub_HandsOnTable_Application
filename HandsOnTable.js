var accountName = "finalproject6830";
var password = 'databases'
var repoName = "test";
var fullTableName = "";
var numberTypes = ["bigint", "bit", "decimal", "int", "integer", "money", "numeric", "smallint", "smallmoney", "tinyint", "float", "real", "double", "double precision"]
var decimalTypes = ["decimal", "money", "numeric", "smallmoney", "float", "real", "double", "double precision"]

$(document).ready(function () {
	transport = new Thrift.Transport("http://datahub.csail.mit.edu/service/json"),	protocol = new Thrift.Protocol(transport),
	client = new DataHubClient(protocol),
	con_params = new ConnectionParams({'user': accountName, 'password': password}),
	con = client.open_connection(con_params),
    repos = client.list_repos(con);

    chart_client = charts(accountName, client, con);
    $('#chart_menu').click(chart_client.openModal);

    $('#results').handsontable({
		minSpareRows: 1,
		contextMenu: ['remove_col'],
		afterRemoveCol: function (index, amount) {
			console.log($(this));
			console.log(index + ' ' + amount)
			var field_names = client.get_schema(con, fullTableName);
			console.log(field_names);
			for (var i = index; i < index + amount; i++) {
				if (field_names.tuples.length > i) {
					var field_name = field_names.tuples[i].cells[0];
					client.execute_sql(con, 'ALTER TABLE ' + fullTableName + ' DROP COLUMN ' + field_name);
				}
			}
		},
	});
    $('#results').handsontable('getInstance').addHook('afterChange', function (changes) {
        if (!changes) { return; }
        var hot = this;
        console.log(hot);
        $.each(changes, function (index, element) {
            console.log(element);
            var p_key = hot.getDataAtCell(element[0], hot.getSettings().colHeaders.indexOf('p_key'));
            var field_name = hot.getSettings().colHeaders[element[1]];
            var new_val = hot.getSettings().columns[element[1]].type === 'numeric' ? element[3] : '"' + element[3] + '"';
            var sql = 'UPDATE ' + fullTableName + ' SET ' + field_name + '=' + new_val + ' WHERE p_key = ' + p_key;
            var res = client.execute_sql(con, sql);
            console.log(res);

        });
    });
    $('#results').handsontable('getInstance').addHook('beforeChange', function (changes, source) {
        // do validation of changes here
        var hot = this;
        validChanges = []
        $.each(changes, function (index, change) {
            var dataType = getDataTypeForCol(hot.getSettings().colHeaders[change[1]]);
        });
    });
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
	var res = client.execute_sql(con, 'select * from '+tableName);
	var data = res.tuples.map(function (tuple) { return tuple.cells; });

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
        console.log(dataType);
        if (numberTypes.indexOf(dataType) > -1) {
            var colData = { type: 'numeric', allowInvalid: false };
            if (decimalTypes.indexOf(dataType) > -1) {
                colData.format = '0,0.00'
            }
            columns.push(colData);
        } else if (dataType === 'date') {
            columns.push({ type: 'date', allowInvalid: false });
        } else {
            columns.push({ });
        }
    });
    console.log(columns);
	$('#results').data('handsontable').updateSettings({ data: data, readOnly: false, colHeaders: res.field_names, columns: columns });
    console.log($('#results').data('handsontable').getData());
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
            fullTableName = accountName + "." + midName;
            updateTableData(fullTableName);
            updateTableMenu(midName, tables); 
        });
        if (name == shortTableName) {
            tableLink.addClass("disabled");
        }
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
