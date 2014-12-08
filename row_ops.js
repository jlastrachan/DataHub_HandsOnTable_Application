$(document).ready(function(){

	$(document).on('click', '#addColumnButton', function() {
		$('#columnModal').find('.modal-title').html("Add a New Column");
		$('#columnModal').find('#expressionText').val("");
		
		$('#columnModal').find("#go_button").click(function() {
			parseExpression($('#expressionText').val());
		});
	});
 
});

// Returns the SQL query associated with the expression
function parseExpression(text) {
	var expr = Parser.parse(text);
	sql_commands = expr.toSQL();
	console.log(sql_commands);
	var res;
	sql_commands.forEach(function (sql) {
		res = client.execute_sql(con, sql);
	});
	console.log(res);
	// // TODO: correct field?
	// client.execute_sql(con, 'ALTER TABLE ' + fullTableName + ' ADD COLUMN aggCol float');
	// client.execute_sql(con, 'UPDATE ' + fullTableName + ' SET aggCol = newCol.avg FROM newCol');
};