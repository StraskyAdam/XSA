const connection = await $.hdb.getConnection();
const getSchemaName = "select current_schema from dummy";
const currentSchema = await connection.executeQuery(getSchemaName);
const schema = currentSchema[0].CURRENT_SCHEMA;

const helpLinks = JSON.parse($.request.body.asString());

const ROLE = helpLinks.ROLE;
const HELP_ID = helpLinks.HELP_ID;
const LANGUAGE = helpLinks.LANGUAGE;

const filterProcedure = await connection.loadProcedure(
	schema,
	"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::deleteHelpLinks"
);
const result = await filterProcedure(ROLE, HELP_ID, LANGUAGE);

await connection.commit();
connection.close();

$.response.contentType = "text/plain";
$.response.setBody(result);
