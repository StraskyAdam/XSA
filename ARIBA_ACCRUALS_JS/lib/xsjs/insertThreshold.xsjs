const connection = await $.hdb.getConnection();
const getSchemaName = "select current_schema from dummy";
const currentSchema = await connection.executeQuery(getSchemaName);
const schema = await currentSchema[0].CURRENT_SCHEMA;

const threshold = JSON.parse($.request.body.asString());

const CURRENCY = threshold.CURRENCY;
const PO_THRESHOLD = threshold.PO_THRESHOLD;
const COMPANY_CODE = threshold.COMPANY_CODE;

const filterProcedure = await connection.loadProcedure(
	schema,
	"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::insertPoThreshold"
);
const result = await filterProcedure(CURRENCY, PO_THRESHOLD, COMPANY_CODE);

await connection.commit();
connection.close();

$.response.contentType = "text/plain";
$.response.setBody(result);
