
var accountName = "finalproject6830";
var password = 'databases';

transport = new Thrift.Transport("http://datahub.csail.mit.edu/service/json"),	
protocol = new Thrift.Protocol(transport),
client = new DataHubClient(protocol),
con_params = new ConnectionParams({'user': accountName, 'password': password}),
con = client.open_connection(con_params);

var executeSQL = function (sqlString, successCallback, failureCallback) {
	try {
		var res = client.execute_sql(con, sqlString);
	} catch (err) {
		console.log('failure on ' + sqlString);
		console.log(err);
		failureCallback(err);
		return;
	}
	successCallback(res);
}

var executeSQLQuietFail = function (sqlString, callback) {
	try {
		client.execute_sql(con, sqlString);
	} catch (err) {
		// do nothing
	}
	callback();
}

var listRepos = function () {
	return client.list_repos(con);
}

var buildSelectQuery = function (tableName, selectFields, limit) {
	return 'SELECT ' + selectFields.join(', ') + ' FROM ' + tableName + (limit ? ' limit ' + limit : '');
}

var buildDropColumnQuery = function (tableName, columnName, shouldCascade) {
	return 'ALTER TABLE ' + tableName + ' DROP COLUMN ' + columnName + (shouldCascade ? ' CASCADE' : '');
}

var buildUpdateQuery = function (tableName, changesObj, pKey) {
	changesStrings = $.map(Object.keys(changesObj), function (key, index) {
		return key + '=' + changesObj[key];
	});
	return 'UPDATE ' + tableName + ' SET ' + changesStrings.join(',') + (pKey !== undefined ? ' WHERE p_key = ' + pKey : '');
}

var buildAddColumnQuery = function (tableName, columnName, columnType) {
	return 'ALTER TABLE ' + tableName + ' ADD COLUMN ' + columnName + ' ' + columnType;
}

var buildInsertQuery = function (tableName, columns, values) {
	return 'INSERT INTO ' + tableName + ' (' + columns.join(',') + ') VALUES (' + values.join(',') + ')';
}

var buildCreateViewQuery = function (viewName, queryString) {
	return 'CREATE VIEW ' + viewName + ' AS ' + queryString;
}

var buildGetViewDefQuery = function (viewName) {
	return 'SELECT pg_get_viewdef(\'' + viewName + '\', true)';
}

var buildDropViewQuery = function (viewName, shouldCascade) {
	return 'DROP VIEW ' + viewName + (shouldCascade ? ' CASCADE' : '');
}

var buildDeleteRowQuery = function (tableName, pKey) {
	return 'DELETE FROM ' + tableName + ' WHERE p_key = ' + pKey;
}

var getDataTypeForCol = function(colName, callback) {
	var sqlString = 'SELECT pg_typeof("' + colName + '") from ' + fullTableName + ' limit 1';
    var res = client.execute_sql(con, sqlString);
    return res.tuples[0].cells[0]
}

var getColumnNames = function (tableName, callback) {
	executeSQL(buildSelectQuery(tableName, ['*'], 0), function (res) {
		callback(res.field_names);
	}, function (err) {
		// TODO (jennya):
		return;
	});
}