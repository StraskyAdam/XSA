await $.import("xsjslib", "handlers");
const { updateJobStatus, messageSuccess, messageAccepted } = $.xsjslib.handlers;
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

function getAttachment(rs) {
	var attachment = '"sep=|"' + "\n";
	var index = 1;
	var vals = [];
	var data = [];
	var columnNames = [
		"Company Code",
		"PONumber",
		"Line Item",
		"PO Currency",
		"Accrual Method",
		"PO Value",
		"SAP Service Completed Amount",
		"SAP Service Completed Percentage",
		"Service Completed Percentage Calculated",
		"SAP Service Completed % - Service Completed Percentage Calculated",
		"Status",
		"Message",
		"Reviewed By",
		"Changed On"
	];

	var i = 1;

	//Column Headings for Excel File
	for (i = 0; i < columnNames.length; i++) {
		attachment += columnNames[i] + "|";
	}
	attachment = attachment + "\n";

	for (i = 0; i < rs.length; i++) {
		index = 2;

		data.push(vals);
		// pushing data into respective fields

		if (rs[i].COMPANYCODE != null) {
			attachment = attachment + '"' + rs[i].COMPANYCODE + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		if (rs[i].EBELN != null) {
			attachment = attachment + '"' + rs[i].EBELN + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		if (rs[i].EBELP != null) {
			attachment = attachment + '"' + rs[i].EBELP + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		if (rs[i].CURRENCY != null) {
			attachment = attachment + '"' + rs[i].CURRENCY + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		if (rs[i].ACCRUALMETHOD != null) {
			attachment = attachment + '"' + rs[i].ACCRUALMETHOD + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		if (rs[i].POVALUE != null) {
			attachment = attachment + '"' + rs[i].POVALUE + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		if (rs[i].SAPSERVICECOMPLETED != null) {
			attachment = attachment + '"' + rs[i].SAPSERVICECOMPLETED + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		if (rs[i].SAPPERCENTAGE != null) {
			attachment = attachment + '"' + rs[i].SAPPERCENTAGE + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		if (rs[i].SERVICECOMPLETEDPERCENTAGECALCULATED != null) {
			attachment = attachment + '"' + rs[i].SERVICECOMPLETEDPERCENTAGECALCULATED + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		if (rs[i].SERVICECOMPLETEDPERCENTDIFF != null) {
			attachment = attachment + '"' + rs[i].SERVICECOMPLETEDPERCENTDIFF + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		if (rs[i].STATUS != null) {
			attachment = attachment + '"' + rs[i].STATUS + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}
		if (rs[i].MESSAGE != null) {
			attachment = attachment + '"' + rs[i].MESSAGE + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}
		if (rs[i].REVIEWEDBY != null) {
			attachment = attachment + '"' + rs[i].REVIEWEDBY + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}
		if (rs[i].CHANGED_ON != null) {
			attachment = attachment + '"' + rs[i].CHANGED_ON + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		attachment = attachment + "\n";
	}

	return attachment;
}

// trigger email
async function sendMail(attachment, senderAddr, userLangResult) {
	var connection = await $.hdb.getConnection();
	var toQuery =
		'SELECT "CONFIG_VALUE" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_CONFIG_VALUES" WHERE "CONFIG_NAME" = ?';
	var result_to = await connection.executeQuery(senderAddrQuery, "EMAIL_FROM");
	var torAddr = result_to[0].CONFIG_VALUE;

	// to get body and subject
	var tempQuery =
		'SELECT "BODY" ,"SUBJECT" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_EMAIL_TEMPLATE_CONFIG" WHERE "TEMPLATE_NAME" = ? and "LANGUAGE"=?';
	var tempQueryResult = await connection.executeQuery(tempQuery, "DISCREPANCY_RECORDS", userLangResult);
	var subject = tempQueryResult[0].SUBJECT;
	var body = tempQueryResult[0].BODY;
	body = body.replace("&NO&", length);

	var dateTime = new Date().toISOString().slice(-24).replace(/\D/g, "").slice(0, 14);
	var fileName = "Accruals_Discrepany_Report_" + dateTime + ".csv";

	var firstPart = new $.net.Mail.Part();
	firstPart.type = $.net.Mail.Part.TYPE_ATTACHMENT;
	firstPart.data = attachment; // data1 contains the data for the excel attachment
	firstPart.contentType = "application/vnd.ms-excel";

	firstPart.fileName = fileName;
	firstPart.encoding = "UTF-16le";

	var thirdPart = new $.net.Mail.Part();
	thirdPart.type = $.net.Mail.Part.TYPE_TEXT;
	thirdPart.text = body;

	thirdPart.contentType = "text/plain";
	thirdPart.encoding = "UTF-8";
	var mail = new $.net.Mail({
		sender: [
			{
				name: "Accrual application",
				address: torAddr,
				nameEncoding: "UTF-8"
			}
		],
		to: senderAddr,
		subject: subject,
		subjectEncoding: "UTF-8"
	});
	mail.parts.push(firstPart, thirdPart);

	return await mail.send();
}

let responseOutput = "";
const headers = $.request.headers;
const jobId = headers.get("x-sap-job-id");
$.response.contentType = "application/json";

if (jobId) {
	$.response.status = 202;
	$.response.setBody(messageAccepted);
}
async function jobStart() {
	try {
		var connection = await $.hdb.getConnection();
		var getSchemaName = "select current_schema from dummy";
		var currentSchema = await connection.executeQuery(getSchemaName);
		var schema = currentSchema[0].CURRENT_SCHEMA;
		let userLangResult = "EN";

		var filterProcedure = await connection.loadProcedure(
			schema,
			"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::discrepancyWTDAmounts"
		);
		const rs = await filterProcedure();
		var length = rs.$resultSets[0].length;

		await connection.commit();

		if (rs.$resultSets[0].length !== 0) {
			//  to get sender address

			var senderAddrQuery =
				'SELECT "CONFIG_VALUE" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_CONFIG_VALUES" WHERE "CONFIG_NAME" = ?';
			var result = await connection.executeQuery(senderAddrQuery, "DISCREPANCY_TO");
			var senderAddr = result[0].CONFIG_VALUE.split(/[ ,]+/);

			var i = 0;
			for (i in senderAddr) {
				// to get user browser language
				var sentAddr = senderAddr[i];
				var userLang =
					'SELECT "LANGUAGE" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_USER_LANGUAGE" WHERE "EMAIL_ID" = ?';
				var userLangExc = await connection.executeQuery(userLang, sentAddr);

				if (userLangExc.length != 0) userLangResult = userLangExc[0].LANGUAGE;

				await sendMail(getAttachment(rs.$resultSets[0]), sentAddr, userLangResult);
			}
			responseOutput = "Mail sent successfully";
		} else {
			responseOutput = "Does not have any discrepancy records";
		}
		if (jobId) await updateJobStatus(headers, true, `${messageSuccess} ${responseOutput}`);
	} catch (error) {
		// return error
		const failMessage = `Processing Job Error: ${error.message}`;
		if (jobId) await updateJobStatus(headers, false, failMessage);
		throw new Error(failMessage);
	}
}
jobStart();
