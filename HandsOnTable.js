var tableName = "finalproject6830.test.countries";
var accountName = "finalproject6830";
var repoName = "test";
$(document).ready(function () {
	transport = new Thrift.Transport("http://datahub.csail.mit.edu/service/json"),
	protocol = new Thrift.Protocol(transport),
	client = new DataHubClient(protocol),
	con_params = new ConnectionParams({'user': 'finalproject6830', 'password': 'databases'}),
	con = client.open_connection(con_params),
    tables = client.list_tables(con, repoName);

    updateTableData(tableName);
    updateTableMenu(tableName.substr(accountName.length+1), tables);
});

var updateTableData = function(tableName) {
	var res = client.execute_sql(con, 'select * from '+tableName);
	var data = res.tuples.map(function (tuple) { return tuple.cells; });
	$('#results').handsontable({
		data: data,
		minSpareRows: 1,
		colHeaders: res.field_names,
		contextMenu: true
	});
}

var updateTableMenu = function(currentTableName, tables) {
    $(".table-name").text(currentTableName);
    var shortTableName = currentTableName.substr(currentTableName.indexOf(".")+1);
    var table_names = tables.tuples.map(function (tuple) { return tuple.cells[0]; });
    $(".table-link").remove();
    table_names.forEach(function (name) { 
        if (name != shortTableName) {
            var midName = repoName + "." + name;
            var tableLink = $("<li class='table-link'><a href='#'>"+midName+"</a></li>");
            tableLink.find("a").click(function() {
                updateTableData(accountName+"."+midName);
                updateTableMenu(midName, tables); 
            });
            $(".tables-menu").prepend(tableLink);
        }
    });
}
