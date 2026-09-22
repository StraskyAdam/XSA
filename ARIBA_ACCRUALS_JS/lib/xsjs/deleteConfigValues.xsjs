const connection = await $.hdb.getConnection();
const getSchemaName = "select current_schema from dummy";
const currentSchema = await connection.executeQuery(getSchemaName);
const schema = currentSchema[0].CURRENT_SCHEMA;

const configData = JSON.parse($.request.body.asString());

const ip_name = configData.name;
const ip_value = configData.value;

const filterProcedure = await connection.loadProcedure(
	schema,
	"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::deleteConfigValues"
);
const result = await filterProcedure(ip_name, ip_value);

await connection.commit();
connection.close();

$.response.contentType = "text/plain";
$.response.setBody(result);
