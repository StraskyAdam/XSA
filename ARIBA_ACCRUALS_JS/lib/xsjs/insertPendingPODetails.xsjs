await $.import("xsjslib", "handlers");
const { updateJobStatus, messageSuccess, messageAccepted} = $.xsjslib.handlers;

function getNewDateString(dateString) {
	try {
		var d = new Date(dateString);
	} catch (e) {
		d = e.message.toString();
	}
	return d.toLocaleDateString("en-IN", {
		timeZone: "Europe/Berlin",
		hour12: false,
		day: "2-digit",
		month: "short",
		year: "numeric"
	});
}
const headers = $.request.headers;
const jobId = headers.get("x-sap-job-id");
$.response.contentType = "application/json";

if (jobId) {
	$.response.status = 202;
	$.response.setBody(messageAccepted);
}
async function jobStart() {
	let response = "";
	let connection;
	try {
		connection = await $.hdb.getConnection();
		const getSchemaName = "select current_schema from dummy";
		const currentSchema = await connection.executeQuery(getSchemaName);
		const schema = currentSchema[0].CURRENT_SCHEMA;
	
		// call procedure to get job scheduler dates
		const filterProcedure = await connection.loadProcedure(
			schema,
			"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::jobSchedulerWD2Dates"
		);
		const result = await filterProcedure();
		const jobSchedule = result.$resultSets[0];
		const jobDate = getNewDateString(jobSchedule[0].JOB_DATE);
	
		// to get current date
		const currentDateQuery = 'SELECT CURRENT_DATE FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::DUMMY"';
		const dateResult = await connection.executeQuery(currentDateQuery);
		const currDate = getNewDateString(dateResult[0].CURRENT_DATE);
	
		if (currDate === jobDate) {
			//For local testing
			// to run over all po oowners
			var truncatquery = await connection.executeUpdate(
				'DELETE FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::TB_PENDING_PO_DETAILS"'
			);
			var insertquery = await connection.executeUpdate(
				'INSERT INTO "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::TB_PENDING_PO_DETAILS" SELECT * FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Functions::TF_getPendingPO"()'
			);
			await connection.commit();
		}
	
		response = "Data insert successfully";
		if (jobId) await updateJobStatus(headers, true, `${messageSuccess} : ${response}`);
	} catch (error) {
		$.response.contentType = "application/json";
		$.response.status = 500;

		const failMessage = error.message || "Unknown error occurred";
		if (jobId) await updateJobStatus(headers, false, failMessage);
	} finally {
		// closing connection
		if (connection) connection.close();
	}
}

jobStart();

