const connection = await $.hdb.getConnection();
const getSchemaName = "select current_schema from dummy";
const currentSchema = await connection.executeQuery(getSchemaName);
const schema = currentSchema[0].CURRENT_SCHEMA;

const userRole = JSON.parse($.request.body.asString());

const USER_EMAILID = userRole.USER_EMAILID;
const COMPANY_CODE = userRole.COMPANY_CODE;

const filterProcedure = await connection.loadProcedure(
		schema,
		"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::deleteUserRoleConfig"
	),
	result = await filterProcedure(USER_EMAILID, COMPANY_CODE);

await connection.commit();
connection.close();

$.response.contentType = "text/plain";
$.response.setBody(result);
