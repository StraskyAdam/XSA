await $.import("xsjslib", "handlers");
const { updateJobStatus, messageSuccess, messageAccepted} = $.xsjslib.handlers;

// to get month and year
var dateObj = new Date();
var monthDes = dateObj.toLocaleString("default", {
	month: "long"
});
var year = dateObj.toLocaleString("default", {
	year: "numeric"
});

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

function getAttachment(rs) {
	// var attachment = "\"sep=,\"" + "\n";
	var attachment = '"sep=~"' + "\n";
	var index = 1;
	var vals = [];
	var data = [];
	var columnNames = [
		"PO OWNER",
		"PO NUMBER",
		"PO LINE",
		"PO LINE DESCRIPTION",
		"PO VALUE USD",
		"LAST UPDATE ON",
		"PO DASHBOARD SECTION",
		"SUPPLIER NAME",
		"PO CREATION DATE",
		"ACCRUAL METHOD",
		"SERVICE START DATE",
		"SERVICE END DATE"
	];

	var i = 1;
	// var colCount = meta.getColumnCount();

	//Column Headings for both Email Body and Excel File
	for (i = 0; i < columnNames.length; i++) {
		// emailoutput = emailoutput + "<th>" + meta.getColumnName(i) + "</th>";
		attachment += columnNames[i] + "~";
	}
	attachment = attachment + "\n";
	for (i = 0; i < rs.length; i++) {
		index = 2;

		data.push(vals);

		if (rs[i].POOWNER != null) {
			attachment = attachment + '"' + rs[i].POOWNER + '"' + "~";
		} else {
			attachment = attachment + '"' + " " + '"' + "~";
		}

		if (rs[i].PONUMBER != null) {
			attachment = attachment + '"' + rs[i].PONUMBER + '"' + "~";
		} else {
			attachment = attachment + '"' + " " + '"' + "~";
		}

		if (rs[i].POLINE != null) {
			attachment = attachment + '"' + rs[i].POLINE + '"' + "~";
		} else {
			attachment = attachment + '"' + " " + '"' + "~";
		}

		if (rs[i].POLINEDESC != null) {
			attachment = attachment + '"' + rs[i].POLINEDESC + '"' + "~";
		} else {
			attachment = attachment + '"' + " " + '"' + "~";
		}

		if (rs[i].POVALUE_USD != null) {
			attachment = attachment + '"' + rs[i].POVALUE_USD + '"' + "~";
		} else {
			attachment = attachment + '"' + " " + '"' + "~";
		}

		if (rs[i].CHANGED_ON != null) {
			attachment = attachment + '"' + rs[i].CHANGED_ON + '"' + "~";
		} else {
			attachment = attachment + '"' + " " + '"' + "~";
		}

		if (rs[i].PO_DASHBOARD_SECTION != null) {
			attachment = attachment + '"' + rs[i].PO_DASHBOARD_SECTION + '"' + "~";
		} else {
			attachment = attachment + '"' + " " + '"' + "~";
		}

		if (rs[i].SUPPLIERNAME != null) {
			attachment = attachment + '"' + rs[i].SUPPLIERNAME + '"' + "~";
		} else {
			attachment = attachment + '"' + " " + '"' + "~";
		}

		if (rs[i].POCREATEDAT != null) {
			attachment = attachment + '"' + rs[i].POCREATEDAT + '"' + "~";
		} else {
			attachment = attachment + '"' + " " + '"' + "~";
		}

		if (rs[i].ACCRUALMETHOD != null) {
			attachment = attachment + '"' + rs[i].ACCRUALMETHOD + '"' + "~";
		} else {
			attachment = attachment + '"' + " " + '"' + "~";
		}

		if (rs[i].WRKSTRTDATE != null) {
			attachment = attachment + '"' + rs[i].WRKSTRTDATE + '"' + "~";
		} else {
			attachment = attachment + '"' + " " + '"' + "~";
		}

		if (rs[i].WRKENDDATE != null) {
			attachment = attachment + '"' + rs[i].WRKENDDATE + '"' + "~";
		} else {
			attachment = attachment + '"' + " " + '"' + "~";
		}

		attachment = attachment + "\n";
	}
	return attachment;
}

// trigger email
async function sendMail(subject, body, emails, manager, attachment) {
	try {
		// to get sender address from table
		var connection = await $.hdb.getConnection();
		var senderAddrQuery =
			'SELECT "CONFIG_VALUE" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_CONFIG_VALUES" WHERE "CONFIG_NAME" = ?';
		var result = await connection.executeQuery(senderAddrQuery, "EMAIL_FROM");
		var senderAddr = result[0].CONFIG_VALUE;

		var firstPart = new $.net.Mail.Part();
		firstPart.type = $.net.Mail.Part.TYPE_ATTACHMENT;
		firstPart.data = attachment; // data1 contains the data for the excel attachment
		firstPart.contentType = "application/vnd.ms-excel";
		firstPart.fileName = "POOwners_Consolidated_Pending_PO.csv";
		firstPart.encoding = "UTF-16le";

		var secondPart = new $.net.Mail.Part();
		secondPart.type = $.net.Mail.Part.TYPE_TEXT;
		secondPart.text = body;
		secondPart.contentType = "text/plain";
		secondPart.encoding = "UTF-8";
		var mail = new $.net.Mail({
			sender: {
				name: "Accrual application",
				address: senderAddr
			},
			to: manager,
			cc: emails,
			subject: subject,
			subjectEncoding: "UTF-8"
		});
		mail.parts.push(firstPart, secondPart);

		var Res_1 = await mail.send();
		const res = "Message ID = " + Res_1.messageId + ", Final Reply = " + Res_1.finalReply;
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

//  get PO oowner manager details and send mail
async function sendMailreq(email, manager, managerName, attachment) {
	try {
		const url = await linkName();

		const connection = await $.hdb.getConnection();
		const userLang =
			'SELECT A."LANGUAGE" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_USER_LANGUAGE" AS A INNER JOIN "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_EMAIL_TEMPLATE_CONFIG" AS B ON A."LANGUAGE" = B."LANGUAGE" WHERE A."EMAIL_ID" = ?';
		const userLangExc = await connection.executeQuery(userLang, manager);

		const userLanguage = userLangExc.length === 0 ? "EN" : userLangExc[0].LANGUAGE;

		const poRequestorQuery =
			'SELECT "TEMPLATE_NAME" ,"SUBJECT" ,"BODY" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_EMAIL_TEMPLATE_CONFIG" WHERE "TEMPLATE_NAME" = ? AND "STATUS"=? AND "LANGUAGE"=?';

		const result = await connection.executeQuery(poRequestorQuery, "NOTIFY_POMANAGER", "X", userLanguage);

		var subject = result[0].SUBJECT;
		subject = subject.replace("&MONTH&", monthDes);
		subject = subject.replace("&YEAR&", year);

		var body = result[0].BODY;
		body = body.replace("&POOWNER&", email);
		body = body.replace("&POMANAGER&", managerName);
		body = body.replace("&MONTH&", monthDes);
		body = body.replace("&LINK&", url);

		const res = await sendMail(subject, body, email, manager, getAttachment(attachment));
		return res;
	} catch (e) {
		return e.message.toString();
	}
}

let result;
const headers = $.request.headers;
const jobId = headers.get("x-sap-job-id");
$.response.contentType = "application/json";

if (jobId) {
	$.response.status = 202;
	$.response.setBody(messageAccepted);
}
async function jobStart() {
	let connection;
	let response = "";
	try {
		connection = await $.hdb.getConnection();
		var getSchemaName = "select current_schema from dummy";
		var currentSchema = await connection.executeQuery(getSchemaName);
		var schema = currentSchema[0].CURRENT_SCHEMA;

		// to get manager and po owner details
		var poownerProcedure = await connection.loadProcedure(
			schema,
			"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::getEmailManagersperPO"
		);
		const poownerExec = await poownerProcedure();
		await connection.commit();
		var poownerResult = poownerExec.$resultSets[0];

		// call procedure to get job scheduler dates
		var filterProcedure = await connection.loadProcedure(
			schema,
			"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::jobSchedulerWD2Dates"
		);
		const result = await filterProcedure();
		var jobSchedule = result.$resultSets[0];
		var jobDate = getNewDateString(jobSchedule[0].JOB_DATE);

		// to get current date
		var currentDateQuery = 'SELECT CURRENT_DATE FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::DUMMY"';
		var dateResult = await connection.executeQuery(currentDateQuery);
		var currDate = getNewDateString(dateResult[0].CURRENT_DATE);

		//For local testing set currDate !== jobDate
		if (currDate === jobDate) {
			// to run over all po oowners / poownerResult.length
			for (var j = 0; j < poownerResult.length; j++) {
				var currentTimeQuery = await connection.executeQuery(
					'SELECT CURRENT_UTCTIMESTAMP "time" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::DUMMY"'
				);
				var currTime = currentTimeQuery[0].time;
				var manager = poownerResult[j].MANAGERSID;
				var email = poownerResult[j].EMAILID;
				var managerName = poownerResult[j].MANAGERNAME;
				var poownerdetails =
					"SELECT MANAGERSID,POOWNER,PONUMBER,POLINE,POLINEDESC,POVALUE_USD,TO_VARCHAR(CHANGED_ON,'DD Mon YYYY') AS CHANGED_ON,PO_DASHBOARD_SECTION,SUPPLIERNAME,TO_VARCHAR(POCREATEDAT,'DD Mon YYYY') AS POCREATEDAT,ACCRUALMETHOD,TO_VARCHAR(WRKSTRTDATE,'DD Mon YYYY') AS WRKSTRTDATE,TO_VARCHAR(WRKENDDATE,'DD Mon YYYY') AS WRKENDDATE FROM \"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::TB_PENDING_PO_DETAILS\" WHERE MANAGERSID = ? GROUP BY MANAGERSID,POOWNER,PONUMBER,POLINE,POLINEDESC,POVALUE_USD,CHANGED_ON,PO_DASHBOARD_SECTION,SUPPLIERNAME,POCREATEDAT,ACCRUALMETHOD,WRKSTRTDATE,WRKENDDATE ORDER BY POOWNER ASC";
				var poownerMResult = await connection.executeQuery(poownerdetails, manager);

				var res = await sendMailreq(email, manager, managerName, poownerMResult);
				var poownerlogs = 'SELECT * FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Functions::TF_getPendingPODetails"(?)';
				var poownerMlogs = await connection.executeQuery(poownerlogs, manager);

				for (var i = 0; i < poownerMlogs.length; i++) {
					var podetails = poownerMlogs[i].POOWNER + " |" + poownerMlogs[i].DETAILS;
					var poManagerIds = poownerMlogs[i].MANAGERSID + "_" + i;
					var insertquery = await connection.executeUpdate(
						'INSERT INTO "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_EDGE_EMAIL_LOG"(EMAIL_ID, ROLE, EMAIL_RESPONSE, DATE, DETAILS) values(?, ?, ?, ?, ?)',
						poManagerIds,
						"PO Manager",
						res,
						currTime,
						podetails
					);
				}
				await connection.commit();
			}
			response = "mail sent successfully";
		}else {
			response = "The job scheduler is not configured for today’s date. No email notifications will be sent."
		}

		if (jobId) await updateJobStatus(headers, true, `${messageSuccess} : ${response}`);

	} catch (error) {
		$.response.contentType = "application/json";
		$.response.status = 500;

		const failMessage = error.message || "Unknown error occurred";

		if (jobId) await updateJobStatus(headers, false, failMessage);

		throw new Error(failMessage);
	} finally {
		// closing connection
		if (connection) connection.close();
	}
}

jobStart();