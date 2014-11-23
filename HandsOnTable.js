$(document).ready(function () {
	transport = new Thrift.Transport("http://datahub.csail.mit.edu/service/json"),
	protocol = new Thrift.Protocol(transport),
	client = new DataHubClient(protocol),
	con_params = new ConnectionParams({'user': 'finalproject6830', 'password': 'databases'}),
	con = client.open_connection(con_params),
	res = client.execute_sql(con, 'select * from finalproject6830.test.cpw_events');

	// $('#results').append('<tr><th>' + res.field_names.join('</th><th>') + '</th></tr>');

	// $.each(res.tuples, function(tuple_idx, tuple) {
	//   $('#results').append('<tr><td>' + tuple.cells.join('</td><td>') + '</td></tr>');
	// });
	var data = res.tuples.map(function (tuple) { return tuple.cells; });
	$('#results').handsontable({
		data: data,
		minSpareRows: 1,
		colHeaders: true,
		contextMenu: true
	});
});