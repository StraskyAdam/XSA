await $.import("xsjslib", "handlers");
const { updateJobStatus, messageSuccess, messageAccepted} = $.xsjslib.handlers;
const headers = $.request.headers;
const jobId = headers.get("x-sap-job-id");
$.response.contentType = "application/json";

if (jobId) {
	$.response.status = 202;
	$.response.setBody(messageAccepted);
}

async function jobStart() {
	const connection = await $.hdb.getConnection();
	const getSchemaName = "select current_schema from dummy";
	const currentSchema = await connection.executeQuery(getSchemaName);
	const schema = currentSchema[0].CURRENT_SCHEMA;
	
	const filterProcedure = await connection.loadProcedure(
		schema,
		"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::populateExchangeRate"
	);
	const result = await filterProcedure();
	
	await connection.commit();
	connection.close();
	if (jobId) await updateJobStatus(headers, true, `${messageSuccess}`);
	$.response.contentType = "text/plain";
	$.response.setBody(result);
	
}
jobStart();
