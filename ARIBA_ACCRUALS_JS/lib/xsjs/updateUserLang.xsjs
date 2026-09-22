var connection = await $.hdb.getConnection();
var getSchemaName = "select current_schema from dummy";
var currentSchema = await connection.executeQuery(getSchemaName);
var schema = currentSchema[0].CURRENT_SCHEMA;

var configLanguages = JSON.parse($.request.body.asString());

var EMAIL_ID = configLanguages.EMAIL_ID;
var LANGUAGE = configLanguages.LANGUAGE;

var filterProcedure = await connection.loadProcedure(
	schema,
	"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::updateUserLang"
);
const result = await filterProcedure(EMAIL_ID, LANGUAGE);

await connection.commit();

$.response.contentType = "text/plain";
$.response.setBody(result);
