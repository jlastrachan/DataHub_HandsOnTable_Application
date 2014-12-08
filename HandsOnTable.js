var accountName = "finalproject6830";
var repoName = "test";
var fullTableName = "";
$(document).ready(function () {
	transport = new Thrift.Transport("http://datahub.csail.mit.edu/service/json"),
	protocol = new Thrift.Protocol(transport),
	client = new DataHubClient(protocol),
	con_params = new ConnectionParams({'user': 'finalproject6830', 'password': 'databases'}),
	con = client.open_connection(con_params),
    repos = client.list_repos(con);

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

var updateTableData = function(tableName) {
	var res = client.execute_sql(con, 'select * from '+tableName);
	var data = res.tuples.map(function (tuple) { return tuple.cells; });
	$('#results').handsontable({
		data: data,
		minSpareRows: 1,
		colHeaders: res.field_names,
		contextMenu: true,
		afterChange: function(changes, source) {
			if (!changes) return;
			changes.forEach(function (change) {
				// save the results to DataHub
				var row = data[change[0]];
				var field_name = res.field_names[change[1]];
				var new_val = change[3];
				var sql = 'UPDATE ' + tableName + ' SET ' + field_name + '="' + new_val + '" WHERE ';
				row.forEach(function (col, index) {
					sql += res.field_names[index] + '="' + col + '"';
					if (index !== row.length - 1) {
						sql += ' AND ';
					}
				});
				client.execute_sql(con, sql);
			});
		}, 
		afterCreateCol: function (index, amount) {
			// index is first newly created column in the data source
			// amount is num newly created columns
		},
		afterCreateRow: function (index, amount) {

		},
		afterRemoveCol: function (index, amount) {

		},
		afterRemoveRow: function (index, amount) {

		},
	});
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
