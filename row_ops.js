$(document).ready(function(){

	$('#addColumnButton').click(function() {
		$('.modal-title').html("Add a New Column");
		$('.modal-body').html("");
		$('.modal-body').append("<div id='expressionAlert' class='alert alert-danger hidden' role='alert'>Invalid Expression!</div>")
		$('.modal-body').append("<p>Type in an algebraic expression for the new column. It can include aggregation operations such as AVG or SUM.</p>");
		$('.modal-body').append("<input id='expressionText' type='text' class='form-control' placeholder='col0 - AVG(col0)'>");
		
		$("#go_button").click(function() {
			parseExpression($('#expressionText').val());
		});
	});
 
});

// Returns the SQL query associated with the expression
function parseExpression(text) {
	var expr = Parser.parse(text);
	console.log(expr);
	console.log(expr.toSQL());
}