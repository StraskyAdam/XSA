const connection = await $.hdb.getConnection();
const getSchemaName = "select current_schema from dummy";
const currentSchema = await connection.executeQuery(getSchemaName);
const schema = currentSchema[0].CURRENT_SCHEMA;

const threshold = JSON.parse($.request.body.asString());

const CURRENCY = threshold.CURRENCY;
const COMPANY_CODE = threshold.COMPANY_CODE;

const filterProcedure = await connection.loadProcedure(
	schema,
	"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::deletePoThreshold"
);
const result = await filterProcedure(CURRENCY, COMPANY_CODE);

await connection.commit();
connection.close();
$.response.contentType = "text/plain";
// $.response.contentType = "application/json";
$.response.setBody(result);
