await $.import("xsjslib", "handlers");
const { updateJobStatus, messageSuccess, messageAccepted} = $.xsjslib.handlers;

//  to get date in dd MMM yyyy format
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
// to get date and time
function getNewTimeString(dateString) {
	var d = new Date(dateString);

	return d.toLocaleTimeString("en-IN", {
		timeZone: "Europe/Berlin",
		hour12: true
		// day: "2-digit",
		// month: "short",
		// year: "numeric"
	});
}

// // Mail Function Starts
// //Attachments
async function getAttachment(connection,poValues, b,attachment) {
	var vals = [];
	var data = [];

	var reviewedBy =
		'SELECT  "REVIWED_BY" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_EDGE_SERVICEPO_STATUS" WHERE "PONUMBER" = ? and "LINEITEM" = ?';
	var resReviewed = await connection.executeQuery(reviewedBy, poValues.PONUMBER, poValues.LINEITEM);

	if (b === 0) {
		attachment = '"sep=|"' + "\n";
		var columnNames = ["PONUMBER", "LINEITEM", "EPNUMBER", "SENDDATE", "SENDTIME(UTC)", "POCLOSEDBY", "STATUS"];

		//Column Headings for Excel File
		for (var l = 0; l < columnNames.length; l++) {
			attachment += columnNames[l] + "|";
		}
	}
	attachment = attachment + "\n";

	data.push(vals);

	// PONumber
	if (poValues.PONUMBER !== null) {
		attachment = attachment + '"' + poValues.PONUMBER + '"' + "|";
	} else {
		attachment = attachment + '"' + " " + '"' + "|";
	}

	// Item Number
	if (poValues.LINEITEM !== null) {
		attachment = attachment + '"' + poValues.LINEITEM + '"' + "|";
	} else {
		attachment = attachment + '"' + " " + '"' + "|";
	}

	// EP Number
	if (poValues.EPNUMBER !== null) {
		attachment = attachment + '"' + poValues.EPNUMBER + '"' + "|";
	} else {
		attachment = attachment + '"' + " " + '"' + "|";
	}

	// Send Date
	if (poValues.SENTDATE !== null) {
		attachment = attachment + '"' + getNewDateString(poValues.SENTDATE) + '"' + "|";
	} else {
		attachment = attachment + '"' + " " + '"' + "|";
	}

	// Send Time
	if (poValues.SENTTIME !== null) {
		attachment = attachment + '"' + getNewTimeString(poValues.SENTTIME) + '"' + "|";
	} else {
		attachment = attachment + '"' + " " + '"' + "|";
	}

	// Po CLosure Name
	if (resReviewed[0].REVIWED_BY !== null) {
		attachment = attachment + '"' + resReviewed[0].REVIWED_BY + '"' + "|";
	} else {
		attachment = attachment + '"' + " " + '"' + "|";
	}

	// EP Number
	if (poValues.STATUS !== null) {
		attachment = attachment + '"' + poValues.STATUS + '"' + "|";
	} else {
		attachment = attachment + '"' + " " + '"' + "|";
	}

	return attachment;
}

// trigger email
async function sendMail(connection,attachment, senderAddr, userLangResult) {
	var connectionMail = await $.hdb.getConnection();
	var toQuery =
		'SELECT "CONFIG_VALUE" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_CONFIG_VALUES" WHERE "CONFIG_NAME" = ?';
	var resultTo = await connectionMail.executeQuery(toQuery, "EMAIL_FROM");
	var torAddr = resultTo[0].CONFIG_VALUE;

	// to get body and subject

	var tempQuery =
		'SELECT "BODY" ,"SUBJECT" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_EMAIL_TEMPLATE_CONFIG" WHERE "TEMPLATE_NAME" = ? and "LANGUAGE"=?';
	var tempQueryResult = await connection.executeQuery(tempQuery, "WEBSERVICE_EMAIL", userLangResult);
	var subject = tempQueryResult[0].SUBJECT;
	var body = tempQueryResult[0].BODY;

	var dateTime = new Date().toISOString().slice(-24).replace(/\D/g, "").slice(0, 14);
	var fileName = "WebService_PO_Success_Failure" + dateTime + ".csv";

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
// Mail Function Ends

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
		var responseOutput, attachment, b, userLangResult, mailStatus;
	
		var cusAribaQuery =
			'SELECT  "PONUMBER", "LINEITEM", "EPNUMBER", "SENTDATE", "SENTTIME", "FLAG", "STATUS" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_REC_ARIBA_STAT" WHERE "FLAG" = ?';
		var result = await connection.executeQuery(cusAribaQuery, "X");
	
		if (result.length !== 0) {
			for (var i = 0; i < result.length; i++) {
				b = i;
				await getAttachment(connection,result[i], b,attachment);
			}
			var senderAddrQuery =
				'SELECT "CONFIG_VALUE" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_CONFIG_VALUES" WHERE "CONFIG_NAME" = ?';
			var resultWeb = await connection.executeQuery(senderAddrQuery, "WEBSERVICE_EMAIL_TO");
			var senderAddr = resultWeb[0].CONFIG_VALUE.split(/[ ,]+/);
	
			var m = 0;
			for (m in senderAddr) {
				var sentAddr = senderAddr[m];
				var userLang =
					'SELECT "LANGUAGE" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_USER_LANGUAGE" WHERE "EMAIL_ID" = ?';
				var userLangExc = await connection.executeQuery(userLang, sentAddr);
				if (userLangExc.length === 0) {
					userLangResult = "EN";
				} else {
					userLangResult = userLangExc[0].LANGUAGE;
				}
				await sendMail(connection,attachment, sentAddr, userLangResult);
				mailStatus = "X";
			}
	
			for (var k = 0; k < result.length; k++) {
				var insertProcedure = await connection.loadProcedure(
					schema,
					"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::insertWebService"
				);
				var resultP = await insertProcedure(
					result[k].PONUMBER,
					result[k].LINEITEM,
					result[k].EPNUMBER,
					" ",
					result[k].STATUS
				);
				await connection.commit();
			}
			if (mailStatus === "X") {
				responseOutput = "Mail sent successfully";
			}
		} else {
			responseOutput = " No Records were found";
		}
		connection.close();
		if (jobId) await updateJobStatus(headers, true, `${messageSuccess} : ${responseOutput}`);
	} catch (error){
		$.response.contentType = "application/json";
		$.response.status = 500;

		const failMessage = error.message || "Unknown error occurred";
		if (jobId) await updateJobStatus(headers, false, failMessage);
	}
}

jobStart();
