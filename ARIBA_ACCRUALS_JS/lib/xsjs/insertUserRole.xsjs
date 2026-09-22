const connection = await $.hdb.getConnection();
const getSchemaName = "select current_schema from dummy";
const currentSchema = await connection.executeQuery(getSchemaName);
const schema = currentSchema[0].CURRENT_SCHEMA;

const userRoleData = JSON.parse($.request.body.asString());

const USER_ROLE = userRoleData.USER_ROLE;
const USER_EMAILID = userRoleData.USER_EMAILID;
const USER_ACCESS = userRoleData.USER_ACCESS;
const COMPANY_CODE = userRoleData.COMPANY_CODE;
const MANAGEMENT_UNIT = userRoleData.MANAGEMENT_UNIT;
const COST_CENTER = userRoleData.COST_CENTER;

const filterProcedure = await connection.loadProcedure(
	schema,
	"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::insertUserRoleConfig"
);
const result = await filterProcedure(USER_ROLE, USER_EMAILID, USER_ACCESS, COMPANY_CODE, MANAGEMENT_UNIT, COST_CENTER);

await connection.commit();
connection.close();

$.response.contentType = "text/plain";
$.response.setBody(result);
