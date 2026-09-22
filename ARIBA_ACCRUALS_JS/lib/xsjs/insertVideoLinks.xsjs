const connection = await $.hdb.getConnection();
const getSchemaName = "select current_schema from dummy";
const currentSchema = await connection.executeQuery(getSchemaName);
const schema = currentSchema[0].CURRENT_SCHEMA;

const videoLinks = JSON.parse($.request.body.asString());

const ROLE = videoLinks.ROLE;
const VIDEO_ID = videoLinks.VIDEO_ID;
const VIDEO_DESC = videoLinks.VIDEO_DESC;
const VIDEO_LINKS = videoLinks.VIDEO_LINKS;
const LANGUAGE = videoLinks.LANGUAGE;

const filterProcedure = await connection.loadProcedure(
	schema,
	"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::insertVideoLinks"
);
const result = await filterProcedure(ROLE, VIDEO_ID, VIDEO_DESC, VIDEO_LINKS, LANGUAGE);

await connection.commit();
connection.close();

$.response.contentType = "text/plain";
$.response.setBody(result);
