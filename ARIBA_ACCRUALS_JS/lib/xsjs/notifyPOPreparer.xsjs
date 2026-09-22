await $.import("xsjslib", "handlers");
const { updateJobStatus, messageSuccess, messageAccepted } = $.xsjslib.handlers;
// to get month and year
var dateObj = new Date();
var monthDes = dateObj.toLocaleString("default", { month: "long" });
var year = dateObj.toLocaleString("default", { year: "numeric" });

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

// to get names
async function fullName(name) {
	try {
		const connection = await $.hdb.getConnection();
		const requestInfo =
			'SELECT "FULL_NAME" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Models::CV_getUserDetails" WHERE "EMAILADDR" = ? ';
		const result = await connection.executeQuery(requestInfo, name);
		return result;
	} catch (e) {
		return e.message.toString();
	}
}

// trigger email
async function sendMail(subject, body, emails) {
	try {
		// to get sender address from table
		const connection = await $.hdb.getConnection();
		const senderAddrQuery =
			'SELECT "CONFIG_VALUE" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_CONFIG_VALUES" WHERE "CONFIG_NAME" = ?';
		const result = await connection.executeQuery(senderAddrQuery, "EMAIL_FROM");
		const senderAddr = result[0].CONFIG_VALUE;

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

		const Res_1 = await mail.send();
		var res = "Message ID = " + Res_1.messageId + ", Final Reply = " + Res_1.finalReply;
		return res;
	} catch (e) {
		return e.message.toString();
	}
}

// to get link
async function linkName() {
	try {
		const connection = await $.hdb.getConnection();
		const urlQuery =
			'SELECT "CONFIG_VALUE" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_CONFIG_VALUES" WHERE "CONFIG_NAME" = ? ';
		const result = await connection.executeQuery(urlQuery, "ACCRUALS_EDGE_LINK");
		const link = result[0].CONFIG_VALUE;
		return link;
	} catch (e) {
		return e.message.toString();
	}
}

//get PO preparer details and send mail
async function sendMailPrep(dash, email) {
	let res = "";
	try {
		let emailId = await fullName(email);
		emailId = emailId.length === 0 ? email : emailId[0].FULL_NAME;

		const url = await linkName();

		if (dash != undefined) {
			var NumberofPurchaseOrders = dash.NUMBEROFPURCHASEORDERS;
			var ServicePurchaseOrders = dash.SERVPENDINGPOCOUNT;
			var IndirectMaterialPurchaseOrders = dash.MATPENDINGPOCOUNT;
		}

		const connection = await $.hdb.getConnection();
		const userLang =
			'SELECT A."LANGUAGE" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_USER_LANGUAGE" AS A INNER JOIN "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_EMAIL_TEMPLATE_CONFIG" AS B ON A."LANGUAGE" = B."LANGUAGE" WHERE A."EMAIL_ID" = ?';
		const userLangExc = await connection.executeQuery(userLang, email);

		const userLanguage = userLangExc.length === 0 ? "EN" : userLangExc[0].LANGUAGE;

		const poPreparerQuery =
			'SELECT "TEMPLATE_NAME" ,"SUBJECT" ,"BODY" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_EMAIL_TEMPLATE_CONFIG" WHERE "TEMPLATE_NAME" = ? AND "STATUS"=? AND "LANGUAGE"=?';

		const result = await connection.executeQuery(poPreparerQuery, "NOTIFY_POPREPARER", "X", userLanguage);

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

			res = await sendMail(subject, body, email);
		} else {
			var body = result[0].BODY;
			body = body.replace("&POPREPARER&", emailId);
			body = body.replace("&MONTH&", monthDes);
			body = body.replace("&NOPO&", NumberofPurchaseOrders);
			body = body.replace("&NOSPO&", ServicePurchaseOrders);
			body = body.replace("&NOMPO&", IndirectMaterialPurchaseOrders);
			body = body.replace("&LINK&", url);
			res = await sendMail(subject, body, email);
		}
	} catch (e) {
		res = e.message.toString();
	}
	return res;
}

let connection;
let response = "Mail sent successfully";
const headers = $.request.headers;
const jobId = headers.get("x-sap-job-id");
$.response.contentType = "application/json";

if (jobId) {
	$.response.status = 202;
	$.response.setBody(messageAccepted);
}
async function jobStart() {
	try {
		connection = await $.hdb.getConnection();
		const getSchemaName = "select current_schema from dummy";
		const currentSchema = await connection.executeQuery(getSchemaName);
		const schema = currentSchema[0].CURRENT_SCHEMA;

		// to get po preparer ids
		const popreparerProcedure = await connection.loadProcedure(
			schema,
			"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::getPendingCounts"
		);
		const popreparerExec = await popreparerProcedure(5);
		const popreparerResult = popreparerExec.$resultSets[0];

		// call procedure to get job scheduler dates
		const filterProcedure = await connection.loadProcedure(
			schema,
			"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::jobSchedulerDates "
		);
		const result = await filterProcedure();
		const jobSchedule = result.$resultSets[0];
		console.log("popreparerResult ", popreparerResult);
		console.log("job schedule dates: ", jobSchedule);

		// to get current date
		var currentDateQuery = 'SELECT CURRENT_DATE FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::DUMMY"';
		var dateResult = await connection.executeQuery(currentDateQuery);
		var currDate = getNewDateString(dateResult[0].CURRENT_DATE);

		for (var y = 0; y <= jobSchedule.length; y++) {
			var jobDate = getNewDateString(jobSchedule[y].JOB_DATE);

			if (currDate !== jobDate) {
				response = "No scheduled job today";
				break;
			}

			// to run over all po preparer
			for (var i = 0; i < popreparerResult.length; i++) {
				var currentTimeQuery = await connection.executeQuery(
						'SELECT CURRENT_UTCTIMESTAMP "time" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::DUMMY"'
					);
				var currTime = currentTimeQuery[0].time;
				var podetails = popreparerResult[i].RESPONSE;
				var email = popreparerResult[i].EMAILID;
				var insertquery = await connection.executeUpdate(
					'INSERT INTO "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_EDGE_EMAIL_LOG"(EMAIL_ID, ROLE, DATE, DETAILS) values(?, ?, ?, ?)',
					email,
					"PO Preparer",
					currTime,
					podetails
				);
				var poPreparer = popreparerResult[i];
				const res = await sendMailPrep(poPreparer, popreparerResult[i].EMAILID);
				var updatequery = await connection.executeUpdate(
					'UPDATE "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_EDGE_EMAIL_LOG" SET EMAIL_RESPONSE = ? where EMAIL_ID = ? and ROLE = ? and DATE = ?',
					res,
					email,
					"PO Preparer",
					currTime
				);
			}
		}
		await connection.commit();
		if (jobId) await updateJobStatus(headers, true, `${messageSuccess} ${response}`);
	} catch (error) {
		// return error
		const failMessage = `Processing Job Error: ${error.message}`;
		if (jobId) await updateJobStatus(headers, false, failMessage);
		throw new Error(failMessage);
	} finally {
		// closing connection
		if (connection) connection.close();
	}
}
jobStart();
