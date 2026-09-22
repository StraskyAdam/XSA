await $.import("xsjslib", "handlers");
const { updateJobStatus, messageSuccess, messageAccepted} = $.xsjslib.handlers;
const headers = $.request.headers;
const jobId = headers.get("x-sap-job-id");
$.response.contentType = "application/json";

if (jobId) {
	$.response.status = 202;
	$.response.setBody(messageAccepted);
}

// to get month and year
var dateObj = new Date();
var monthDes = dateObj.toLocaleString("default", { month: "long" });
var year = dateObj.toLocaleString("default", { year: "numeric" });

function getNewDateString(dateString) {
	var d = new Date(dateString);

	return d.toLocaleDateString("en-IN", {
		timeZone: "Europe/Berlin",
		hour12: false,
		day: "2-digit",
		month: "short",
		year: "numeric"
	});
}

// trigger email
async function sendMail(connection, subject, body, emails) {
	// to get sender address from table
	// const connection = await $.hdb.getConnection();
	const senderAddrQuery =
		'SELECT "CONFIG_VALUE" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_CONFIG_VALUES" WHERE "CONFIG_NAME" = ?';
	const result = await connection.executeQuery(senderAddrQuery, "EMAIL_FROM");
	const senderAddr = result?.[0]?.CONFIG_VALUE;
	if (!senderAddr) {
		throw new Error("EMAIL_FROM config missing");
	}

	const mail = new $.net.Mail({
		sender: {
			name: "Accrual application",
			address: senderAddr
		},
		to: emails,
		subject: subject,
		subjectEncoding: "UTF-8",
		parts: [
			new $.net.Mail.Part({
				type: $.net.Mail.Part.TYPE_TEXT,
				text: body,
				contentType: "text/plain",
				encoding: "UTF-8"
			})
		]
	});

	return await mail.send();
}
// to get link
async function linkName(connection) {
	// const connection = await $.hdb.getConnection();
	const urlQuery =
		'SELECT "CONFIG_VALUE" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_CONFIG_VALUES" WHERE "CONFIG_NAME" = ? ';
	const result = await connection.executeQuery(urlQuery, "ACCRUALS_EDGE_LINK");
	const link = result[0].CONFIG_VALUE;
	return link;
}

// to get names
async function fullName(connection,name) {
	// const connection = await $.hdb.getConnection();
	const requestInfo =
		'SELECT "FULL_NAME" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Models::CV_getUserDetails" WHERE "EMAILADDR" = ? ';
	const result = await connection.executeQuery(requestInfo, name);
	return result;
}

//get PO preparer details and send mail
async function sendMailPrep(connection,dash, email) {
	let emailId = await fullName(connection,email);
	emailId = emailId.length === 0 ? email : emailId[0].FULL_NAME;

	const url = await linkName(connection);

	if (dash != undefined) {
		var NumberofPurchaseOrders = dash.NUMBEROFPURCHASEORDERS;
		var ServicePurchaseOrders = dash.SERVPENDINGPOCOUNT;
		var IndirectMaterialPurchaseOrders = dash.MATPENDINGPOCOUNT;
	}

	// const connection = await $.hdb.getConnection();
	const poPreparerQuery =
		'SELECT "TEMPLATE_NAME" ,"SUBJECT" ,"BODY" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_EMAIL_TEMPLATE_CONFIG" WHERE "TEMPLATE_NAME" = ? AND "STATUS"=? AND "LANGUAGE"=?';

	const result = await connection.executeQuery(poPreparerQuery, "NOTIFY_POPREPARER", "X", "EN");

	var subject = result[0].SUBJECT;
	subject = subject.replace("&OPENPURCHASEORDERS&", NumberofPurchaseOrders);
	subject = subject.replace("&MONTH&", monthDes);
	subject = subject.replace("&YEAR&", year);

	if (NumberofPurchaseOrders === undefined || ServicePurchaseOrders === undefined) {
		var body = result[0].BODY;
		body = body.replace("&POPREPARER&", emailId);
		body = body.replace("&MONTH&", monthDes);
		body = body.replace("&NOPO&", 0);
		body = body.replace("&NOSPO&", 0);
		body = body.replace("&NOMPO&", 0);
		body = body.replace("&LINK&", url);

		await sendMail(connection,subject, body, email);
	} else {
		var body = result[0].BODY;
		body = body.replace("&POPREPARER&", emailId);
		body = body.replace("&MONTH&", monthDes);
		body = body.replace("&NOPO&", NumberofPurchaseOrders);
		body = body.replace("&NOSPO&", ServicePurchaseOrders);
		body = body.replace("&NOMPO&", IndirectMaterialPurchaseOrders);
		body = body.replace("&LINK&", url);
		await sendMail(connection,subject, body, email);
		// sendMail(subject,body,email);
	}
}

//getPo Admin details and send mail
async function sendMailAdmin(connection,dash, email) {
	let emailId = await fullName(connection,email);
	emailId = emailId.length === 0 ? email : emailId[0].FULL_NAME;

	const url = await linkName(connection);

	if (dash != undefined) {
		var NumberofPurchaseOrders = dash.NUMBEROFPURCHASEORDERS;
		var ServicePurchaseOrders = dash.SERVPENDINGPOCOUNT;
		var IndirectMaterialPurchaseOrders = dash.MATPENDINGPOCOUNT;
		var companyCode = dash.COMPANYCODE;
	}
	// const connection = await $.hdb.getConnection();
	const poRequestorQuery =
		'SELECT "TEMPLATE_NAME" ,"SUBJECT" ,"BODY" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_EMAIL_TEMPLATE_CONFIG" WHERE "TEMPLATE_NAME" = ? AND "STATUS"=? AND "LANGUAGE"=?';

	const result = await connection.executeQuery(poRequestorQuery, "NOTIFY_ADMIN", "X", "EN");

	var subject = result[0].SUBJECT;
	subject = subject.replace("&OPENPURCHASEORDERS&", NumberofPurchaseOrders);
	subject = subject.replace("&MONTH&", monthDes);
	subject = subject.replace("&YEAR&", year);

	if (NumberofPurchaseOrders === undefined || ServicePurchaseOrders === undefined) {
		var body = result[0].BODY;
		body = body.replace("&POADMIN&", emailId);
		body = body.replace("&MONTH&", monthDes);
		body = body.replace("&NOPO&", 0);
		body = body.replace("&NOSPO&", 0);
		body = body.replace("&NOMPO&", 0);
		body = body.replace("&COMPANYCODES&", companyCode);
		body = body.replace("&LINK&", url);
		// body=body.replace("undefined",0);
		await sendMail(connection,subject, body, email);
	} else {
		var body = result[0].BODY;
		body = body.replace("&POADMIN&", emailId);
		body = body.replace("&MONTH&", monthDes);
		body = body.replace("&NOPO&", NumberofPurchaseOrders);
		body = body.replace("&NOSPO&", ServicePurchaseOrders);
		body = body.replace("&NOMPO&", IndirectMaterialPurchaseOrders);
		body = body.replace("&COMPANYCODES&", companyCode);
		body = body.replace("&LINK&", url);
		// body=body.replace("undefined",0);
		await sendMail(connection,subject, body, email);
	}
}
//getPo TBS details and send mail
async function sendMailTbs(connection,dash, email) {
	let emailId = await fullName(connection,email);
	emailId = emailId.length === 0 ? email : emailId[0].FULL_NAME;

	const url = await linkName(connection);

	if (dash != undefined) {
		var NumberofPurchaseOrders = dash.NUMBEROFPURCHASEORDERS;
		var ServicePurchaseOrders = dash.SERVPENDINGPOCOUNT;
		var IndirectMaterialPurchaseOrders = dash.MATPENDINGPOCOUNT;
		var companyCode = dash.COMPANYCODE;
	}
	// const connection = await $.hdb.getConnection();
	const poRequestorQuery =
		'SELECT "TEMPLATE_NAME" ,"SUBJECT" ,"BODY" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_EMAIL_TEMPLATE_CONFIG" WHERE "TEMPLATE_NAME" = ? AND "STATUS"=? AND "LANGUAGE"=?';

	const result = await connection.executeQuery(poRequestorQuery, "NOTIFY_TBS_FINANCE", "X", "EN");

	var subject = result[0].SUBJECT;
	subject = subject.replace("&OPENPURCHASEORDERS&", NumberofPurchaseOrders);
	subject = subject.replace("&MONTH&", monthDes);
	subject = subject.replace("&YEAR&", year);

	if (NumberofPurchaseOrders === undefined || ServicePurchaseOrders === undefined) {
		var body = result[0].BODY;
		body = body.replace("&TBS_FINANCE&", emailId);
		body = body.replace("&MONTH&", monthDes);
		body = body.replace("&NOPO&", 0);
		body = body.replace("&NOSPO&", 0);
		body = body.replace("&NOMPO&", 0);
		body = body.replace("&COMPANYCODES&", companyCode);
		body = body.replace("&LINK&", url);
		// body=body.replace("undefined",0);
		await sendMail(connection,subject, body, email);
	} else {
		var body = result[0].BODY;
		body = body.replace("&TBS_FINANCE&", emailId);
		body = body.replace("&MONTH&", monthDes);
		body = body.replace("&NOPO&", NumberofPurchaseOrders);
		body = body.replace("&NOSPO&", ServicePurchaseOrders);
		body = body.replace("&NOMPO&", IndirectMaterialPurchaseOrders);
		body = body.replace("&COMPANYCODES&", companyCode);
		body = body.replace("&LINK&", url);
		// body=body.replace("undefined",0);
		await sendMail(connection,subject, body, email);
	}
}
//  get PO requestor/oowner details and send mail
async function sendMailreq(connection,dash, email) {
	let emailId = await fullName(connection,email);
	emailId = emailId.length === 0 ? email : emailId[0].FULL_NAME;

	const url = await linkName(connection);

	if (dash != undefined) {
		var NumberofPurchaseOrders = dash.NUMBEROFPURCHASEORDERS;
		var ServicePurchaseOrders = dash.SERVPENDINGPOCOUNT;
		var IndirectMaterialPurchaseOrders = dash.MATPENDINGPOCOUNT;
	}
	// const connection = await $.hdb.getConnection();
	const poRequestorQuery =
		'SELECT "TEMPLATE_NAME" ,"SUBJECT" ,"BODY" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_EMAIL_TEMPLATE_CONFIG" WHERE "TEMPLATE_NAME" = ? AND "STATUS"=? AND "LANGUAGE"=?';

	const result = await connection.executeQuery(poRequestorQuery, "NOTIFY_POOWNER", "X", "EN");

	var subject = result[0].SUBJECT;
	subject = subject.replace("&OPENPURCHASEORDERS&", NumberofPurchaseOrders);
	subject = subject.replace("&MONTH&", monthDes);
	subject = subject.replace("&YEAR&", year);

	if (NumberofPurchaseOrders === undefined || ServicePurchaseOrders === undefined) {
		var body = result[0].BODY;
		body = body.replace("&POOWNER&", emailId);
		body = body.replace("&MONTH&", monthDes);
		body = body.replace("&NOPO&", 0);
		body = body.replace("&NOSPO&", 0);
		body = body.replace("&NOMPO&", 0);
		body = body.replace("&LINK&", url);
		// body=body.replace("undefined",0);
		await sendMail(connection,subject, body, email);
	} else {
		var body = result[0].BODY;
		body = body.replace("&POOWNER&", emailId);
		body = body.replace("&MONTH&", monthDes);
		body = body.replace("&NOPO&", NumberofPurchaseOrders);
		body = body.replace("&NOSPO&", ServicePurchaseOrders);
		body = body.replace("&NOMPO&", IndirectMaterialPurchaseOrders);
		body = body.replace("&LINK&", url);
		// body=body.replace("undefined",0);
		await sendMail(connection,subject, body, email);
		// sendMail(subject,body,email);
	}
}

async function jobStart() {
	let response = "";
	let connection;
	try {
		connection = await $.hdb.getConnection();
		const getSchemaName = "select current_schema from dummy";
		const currentSchema = await connection.executeQuery(getSchemaName);
		const schema = currentSchema[0].CURRENT_SCHEMA;
	
		// to get tbs ids
		const tbsProcedure = await connection.loadProcedure(
			schema,
			"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::notifyOpenPOUsersList_CA"
		);
		const tbsExec = await tbsProcedure(1);
		await connection.commit();
		const tbsResult = tbsExec.$resultSets[0];
	
		// to get finance ids
		const financeProcedure = await connection.loadProcedure(
				schema,
				"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::notifyOpenPOUsersList_CA"
			)
		const financeExec = await financeProcedure(2);
		await connection.commit();
		const financeResult = financeExec.$resultSets[0];
	
		// to get admin ids
		const adminProcedure = await connection.loadProcedure(
			schema,
			"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::notifyOpenPOUsersList_CA"
		);
		const adminExec = await adminProcedure(3);
		await connection.commit();
		const adminResult = adminExec.$resultSets[0];
	
		// to get po oowner ids
		const poownerProcedure = await connection.loadProcedure(
			schema,
			"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::notifyOpenPOUsersList_CA"
		);
		const poownerExec = await poownerProcedure(4);
		await connection.commit();
		const poownerResult = poownerExec.$resultSets[0];
	
		// to get po preparer ids
		const popreparerProcedure = await connection.loadProcedure(
			schema,
			"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::notifyOpenPOUsersList_CA"
		);
	
		const popreparerExec = await popreparerProcedure(5);
		await connection.commit();
		const popreparerResult = popreparerExec.$resultSets[0];
	
		// call procedure to get job scheduler dates
		const filterProcedure = await connection.loadProcedure(
			schema,
			"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::jobSchedulerDates "
		);
		const result = await filterProcedure();
		const jobSchedule = result.$resultSets[0];
	
		// to get current date
		const currentDateQuery = 'SELECT CURRENT_DATE FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::DUMMY"';
		const dateResult = await connection.executeQuery(currentDateQuery);
		const currDate = getNewDateString(dateResult[0].CURRENT_DATE);
	
		for (var y = 0; y <= jobSchedule.length; y++) {
			var jobDate = getNewDateString(jobSchedule[y].JOB_DATE);

			if (currDate === jobDate) {
				// to run over all po preparer
				for (var i = 0; i < popreparerResult.length; i++) {
					var poPreparer = popreparerResult[i];
					await sendMailPrep(connection,poPreparer, popreparerResult[i].PO_PREPARER);
				}
	
				// to run over all po oowners
				for (var j = 0; j < poownerResult.length; j++) {
					var poRequestor = poownerResult[j];
					await sendMailreq(connection,poRequestor, poownerResult[j].POOWNER_EMAIL);
				}
	
				// to run over admin ids
				for (var k = 0; k < adminResult.length; k++) {
					var poAdmin = adminResult[k];
					await sendMailAdmin(connection,poAdmin, adminResult[k].EMAILID);
				}
				// to run over TBS/Finance ids
				for (var l = 0; l < tbsResult.length; l++) {
					var poTbs = tbsResult[l];
					await sendMailTbs(connection,poTbs, tbsResult[l].EMAILID);
				}
				// to run over TBS/Finance ids
				for (var m = 0; m < financeResult.length; m++) {
					var poFinance = financeResult[m];
					await sendMailTbs(connection,poFinance, financeResult[m].EMAILID);
				}
			}
		}
		response = "mail sent successfully";
		if (jobId) await updateJobStatus(headers, true, `${messageSuccess}: ${response}`);
		$.response.contentType = "text/html";
		$.response.setBody(response);
	
	} catch(error){
		// return error
		$.response.contentType = "application/json";
		$.response.status = 500;
		const status = error?.status || error?.statusCode || error?.code || 500;
		$.response.setBody({error: error.message, code: status});	
	} finally {
		// closing connection
		if (connection) {
		    await connection.close();
		}
	}
}
jobStart();