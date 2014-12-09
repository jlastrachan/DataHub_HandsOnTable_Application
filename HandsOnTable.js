var accountName = "finalproject6830";
var password = 'databases'
var repoName = "test";
var fullTableName = "";
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
		afterChange: function(changes, source) {
			if (!changes) return;
			changes.forEach(function (change) {
				// save the results to DataHub
				// var row = data[change[0]];
				// var field_names = client.get_schema(con, tableName);
				// var field_name = field_names[change[1]];
				// var new_val = change[3];
				// var sql = 'UPDATE ' + tableName + ' SET ' + field_name + '="' + new_val + '" WHERE ';
				// row.forEach(function (col, index) {
				// 	sql += field_names[index] + '="' + col + '"';
				// 	if (index !== row.length - 1) {
				// 		sql += ' AND ';
				// 	}
				// });
				// client.execute_sql(con, sql);
			});
		}, 
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

    updateRepo(repoName);


});

var updateRepo = function(newRepoName) {
    repoName = newRepoName;
    var tables = client.list_tables(con, repoName);
    var firstTableName = accountName + "." + repoName + "." + tables.tuples[0].cells[0];
    updateTableData(firstTableName);
    updateTableMenu(firstTableName.substr(accountName.length+1), tables);
    updateRepositoryMenu(repoName, repos);
    fullTableName = firstTableName;
}

var updateCurrentTable = function(repoName, tableName) {
    var tables = client.list_tables(con, repoName);
    console.log(tableName);
    updateTableData(accountName + "." + repoName + "."+ tableName);
    updateTableMenu(tableName, tables);
    updateRepositoryMenu(repoName, repos);
    fullTableName = accountName + "." + repoName + "." +tableName;
}

var updateTableData = function(tableName) {
	var res = client.execute_sql(con, 'select * from '+tableName);
	var data = res.tuples.map(function (tuple) { return tuple.cells; });
	$('#results').data('handsontable').updateSettings({ data: data, readOnly: true, colHeaders: res.field_names });

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
