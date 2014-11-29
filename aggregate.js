$(document).ready(function(){

$('#aggregateButton').click (function() {
	$('.modal-title').html("Create aggregation");
	$('.modal-body').append("<div id='aggregateSelectionDiv'><form class='form-horizontal'><fieldset id='aggregateFieldset'></fieldset></form></div>");
	$("#aggregateFieldset").append('<div class="aggregateSection"> </div>');
	addAggregateSection(0);
	addGroupBySection ();
})
 
});

function addAggregateSection (rowNumber) {

	$(".addMoreButton").hide();
	$(".aggregateSection").append('<div class="control-group">'+ 
		'<label class="control-label" for="aggregateType">Aggregate Type</label>'+
  		'<div class="controls">'+
    		'<select id="aggregateType'+rowNumber+'" name="aggregateType" class="input-xlarge">'+
      			'<option>Sum</option>'+
      			'<option>average</option>'+
    		'</select>'+
  		'</div></div>');

		$(".aggregateSection").append('<div class="control-group">'+ 
		'<label class="control-label" for="aggregateType">Column</label>'+
  		'<div class="controls">'+
    		'<select id="aggregateColumn'+rowNumber+'" name="aggregateType" class="input-xlarge">'+
    		'</select>'+
  		'</div></div>');
	
	var columns = $("#results").handsontable("getColHeader");
	console.log(columns);
	i=0;
	for (var i = 0; i < columns.length; i++) { 
		// console.log(i);
		$("#aggregateColumn"+rowNumber).append('<option>'+columns[i]+'</option>');
	}

	rowNumber = rowNumber+1;

	$(".aggregateSection").append("<a class='addMoreButton' onclick='addAggregateSection("+rowNumber+")'>+Add more</a>");
	// toreturn= '<div class="container-fluid"> <div class="row aggregateSection"><div class="col-md-4">Aggregate: </br> Column:'+
	// '</br>&nbsp<a onclick="addAggregateOption('+rowNumber+')">+Add more</a></div><div class="col-md-8">'
	// toreturn+= ' <select class="dropdown input-xlarge" id="aggregateSection'+rowNumber+
	// 	'"><option value="sum">Sum</option>'+
 //  		'<option value="average">Average</option>'+
 //  		'<option value="count">Count</option>'+
 //  		'<option value="min">Min</option>'+
 //  		'<option value="max">Max</option>'+
	// 	'</select>'

	// toreturn+='</br> <select class="dropdown" id="aggregateColumn'+rowNumber+'">';
	// var columns = $("#results").handsontable("getColHeader");
	// for (i = 0; i < columns.length; i++) { 
 //    	toreturn += '<option value="'+columns[i]+'">'+columns[i]+'</option>';
	// }

	// toreturn +="</div></div></div>";
	// return toreturn;
}

function addGroupBySection () {
	$("#aggregateFieldset").append('<div class="container-fluid"> <div class="row aggregateGroupBySection"></div></div>');
	$(".aggregateGroupBySection").append('<div class="control-group">'+ 
		'<label class="control-label" for="aggregateType">Group By</label>'+
  		'<div class="controls">'+
    		'<select id="groupByColumn" name="aggregateType" class="input-xlarge">'+
    		'</select>'+
  		'</div></div>');
	// $(".aggregateGroupBySection").append('<div class="col-md-4" id="groupByTitles"></div><div class="col-md-8" id="groupByValues"></div>');
	// $("#groupByTitles").html("Group by: ");
	// $("#groupByValues").append('<div id="groupByDropdown" class="dropdown">');
	// $("#groupByDropdown").append('<a data-target="#" data-toggle="dropdown" id="groupByDisplay" class="dropdown-toggle">Choose column <b class="caret"></b></a><ul id="groupByDropdownUl" class="dropdown-menu"></ul>');

	// toreturn= '<div class="container-fluid"> <div class="row aggregateGroupBySection"><div class="col-md-4">Group by </div><div class="col-md-8">'

	// toreturn+='<select class="dropdown" id="aggregateGroupByColumn">';
	var columns = $("#results").handsontable("getColHeader");
	// console.log(columns);
	for (i = 0; i < columns.length; i++) { 
		$("#groupByColumn").append('<option>'+columns[i]+'</option>');
    	// toreturn += '<option value="'+columns[i]+'">'+columns[i]+'</option>';
	}

	// toreturn +="</div></div></div>";
	// return toreturn;
}

function addAggregateOption (rowNumber) {
	$('#aggregateSelectionDiv').append("</br>"+generateAggregateSection(rowNumber));
}

function executeAggregateQuery(query) {
	transport = new Thrift.Transport("http://datahub.csail.mit.edu/service/json"),
	protocol = new Thrift.Protocol(transport),
	client = new DataHubClient(protocol),
	con_params = new ConnectionParams({'user': 'finalproject6830', 'password': 'databases'}),
	con = client.open_connection(con_params),
	// res = client.execute_sql(con, 'select col0 from finalproject6830.test.cpw_events group by col0');
	res = client.execute_sql(con, query);

	$(".modal-body").html("<table id='aggregateResults'></table>");
	var data = res.tuples.map(function (tuple) { return tuple.cells; });
	$('#aggregateResults').handsontable({
		data: data,
		minSpareRows: 1,
		colHeaders: true,
		contextMenu: true
	});
}