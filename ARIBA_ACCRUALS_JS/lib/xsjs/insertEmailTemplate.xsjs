const connection = await $.hdb.getConnection();
const getSchemaName = "select current_schema from dummy";
const currentSchema = await connection.executeQuery(getSchemaName);
const schema = currentSchema[0].CURRENT_SCHEMA;

const emailTemplate = JSON.parse($.request.body.asString());

const TEMPLATE_NAME = emailTemplate.TEMPLATE_NAME;
const LANGUAGE = emailTemplate.LANGUAGE;
const SUBJECT = emailTemplate.SUBJECT;
const BODY = emailTemplate.BODY;
const STATUS = emailTemplate.STATUS;

const filterProcedure = await connection.loadProcedure(
	schema,
	"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::insertEmailTemplate"
);
const result = await filterProcedure(TEMPLATE_NAME, LANGUAGE, SUBJECT, BODY, STATUS);

await connection.commit();
connection.close();

$.response.contentType = "text/plain";
$.response.setBody(result);
