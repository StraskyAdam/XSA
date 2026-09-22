const connection = await $.hdb.getConnection();
const getSchemaName = "select current_schema from dummy";
const currentSchema = await connection.executeQuery(getSchemaName);
const schema = currentSchema[0].CURRENT_SCHEMA;

const emailTemplate = JSON.parse($.request.body.asString());

const ip_TEMPLATE_NAME = emailTemplate.TEMPLATE_NAME;
const IP_LANGUAGE = emailTemplate.LANGUAGE;

const filterProcedure = await connection.loadProcedure(
	schema,
	"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::deleteEmailTemplate"
);
const result = await filterProcedure(ip_TEMPLATE_NAME, IP_LANGUAGE);

await connection.commit();
connection.close();

$.response.contentType = "text/plain";
// $.response.contentType = "application/json";
$.response.setBody(result);
