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

// calling stored procedure
async function executeDbQuery(statuspo) {
	// Get Connection
	const connection = await $.hdb.getConnection();
	const getSchemaName = "select current_schema from dummy";
	const currentSchema = await connection.executeQuery(getSchemaName);
	const schema = currentSchema[0].CURRENT_SCHEMA;

	const user = JSON.parse($.request.body.asString()).user;

	const filterProcedure = await connection.loadProcedure(
		schema,
		"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::reviewPOLine"
	);
	const reviewPOList = await filterProcedure(statuspo, user);
	await connection.commit();
	return reviewPOList.$resultSets[0];
}

// CSV data loading
function getAttachment(rs) {
	var attachment = '"sep=|"' + "\n";
	var index = 1;
	var vals = [];
	var data = [];
	var columnNames = ["Purchase Order Number", "Item Number", "Posting Date", "Company Code"];

	var i = 1;

	//Column Headings for Excel File
	for (i = 0; i < columnNames.length; i++) {
		attachment += columnNames[i] + "|";
	}
	attachment = attachment + "\n";

	for (i = 0; i < rs.length; i++) {
		index = 2;

		data.push(vals);

		if (rs[i].PONUMBER != null) {
			attachment = attachment + '"' + rs[i].PONUMBER + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		if (rs[i].ITEMNO != null) {
			attachment = attachment + '"' + rs[i].ITEMNO + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		if (rs[i].KEYDAY != null) {
			attachment = attachment + '"' + getNewDateString(rs[i].KEYDAY) + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		if (rs[i].COMPANYCODE != null) {
			attachment = attachment + '"' + rs[i].COMPANYCODE + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		attachment = attachment + "\n";
	}

	return attachment;
}

// - Function to get the full name
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

// Function to send the email
async function sendMail(attachment, fileName, emails, userLang) {
	const user = JSON.parse($.request.body.asString()).user;

	let salutation = await fullName(emails);
	salutation = salutation.length === 0 ? emails : salutation[0].FULL_NAME;

	let tbsUser = await fullName(user);
	tbsUser = tbsUser.length === 0 ? user : tbsUser[0].FULL_NAME;

	// to get sender address
	const connection = await $.hdb.getConnection();
	const senderAddrQuery =
		'SELECT "CONFIG_VALUE" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_CONFIG_VALUES" WHERE "CONFIG_NAME" = ?';
	const senderAddrQueryResult = await connection.executeQuery(senderAddrQuery, "EMAIL_FROM");
	const senderAddr = senderAddrQueryResult[0].CONFIG_VALUE;

	// to get link
	const urlQuery =
		'SELECT "CONFIG_VALUE" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_CONFIG_VALUES" WHERE "CONFIG_NAME" = ? ';
	const urlQueryResult = await connection.executeQuery(urlQuery, "ACCRUALS_EDGE_LINK");
	const link = urlQueryResult[0].CONFIG_VALUE;

	// to get email template
	const reviewPoQuery =
		'SELECT "TEMPLATE_NAME" ,"SUBJECT" ,"BODY" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_EMAIL_TEMPLATE_CONFIG" WHERE "TEMPLATE_NAME" = ? AND "STATUS"=? AND "LANGUAGE"=?';
	const reviewPoQueryResult = await connection.executeQuery(reviewPoQuery, "REVIEW_PO", "X", userLang);
	
	var subject = reviewPoQueryResult[0].SUBJECT;
	subject = subject.replace("&MONTH&", monthDes);
	subject = subject.replace("&YEAR&", year);

	var body = reviewPoQueryResult[0].BODY;
	body = body.replace("&POOWNER&", salutation);
	body = body.replace("&USER&", tbsUser);
	body = body.replace("&MONTH&", monthDes);
	body = body.replace("&LINK&", link);

	// var emailFinal= emails;
	var firstPart = new $.net.Mail.Part();
	firstPart.type = $.net.Mail.Part.TYPE_ATTACHMENT;
	firstPart.data = attachment; // data1 contains the data for the excel attachment
	firstPart.contentType = "application/vnd.ms-excel";

	firstPart.fileName = fileName + ".csv";
	firstPart.encoding = "UTF-16le";

	var thirdPart = new $.net.Mail.Part();
	thirdPart.type = $.net.Mail.Part.TYPE_TEXT;

	thirdPart.text = body;

	thirdPart.contentType = "text/plain";
	thirdPart.encoding = "UTF-8";
	const mail = new $.net.Mail({
		sender: [
			{
				name: "Accrual application",
				address: senderAddr,
				nameEncoding: "UTF-8"
			}
		],
		to: emails,
		subject: subject,
		subjectEncoding: "UTF-8"
	});
	mail.parts.push(firstPart, thirdPart);

	return await mail.send();
}

// var dateObj = new Date();
// var monthDes = dateObj.getUTCMonth() + 1;

var dateObj = new Date();
var monthDes = dateObj.toLocaleString("default", { month: "long" });
var year = dateObj.toLocaleString("default", { year: "numeric" });

let responseOutput = "";
let connection;
try {
	var reviewPOList;
	var returnMessage = "";
	var returnMessage1 = "";
	var returnMessage2 = "";
	var statuspo = JSON.parse($.request.body.asString()).statuspo;
	var user = JSON.parse($.request.body.asString()).user;
	reviewPOList = await executeDbQuery(statuspo);

	// to get user language
	connection = await $.hdb.getConnection();
	const userLang =
		'SELECT "LANGUAGE" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_USER_LANGUAGE" WHERE "EMAIL_ID" = ?';
	const userLangExc = await connection.executeQuery(userLang, user);
	// default English
	const userLangResult = userLangExc.length === 0 ? "EN" : userLangExc[0].LANGUAGE;

	// get text based on language
	const userText_noEmail =
		'SELECT "TEXT_TRANSLATIONS" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_TEXT_TRANSLATIONS" WHERE "TEXT_ID" = ? AND "LANGUAGE"=?';
	const userTextExc_noEmail = await connection.executeQuery(userText_noEmail, "NOTIFY_NO_EMAIL", userLangResult);

	const userText_sent =
		'SELECT "TEXT_TRANSLATIONS" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_TEXT_TRANSLATIONS" WHERE "TEXT_ID" = ? AND "LANGUAGE"=?';
	const userTextExc_sent = await connection.executeQuery(userText_sent, "NOTIFY_SENT", userLangResult);

	const userText_24 =
		'SELECT "TEXT_TRANSLATIONS" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_TEXT_TRANSLATIONS" WHERE "TEXT_ID" = ? AND"LANGUAGE"=?';
	const userTextExc_24 = await connection.executeQuery(userText_noEmail, "NOTIFIED_24", userLangResult);

	// Get the list POs where there is NO POOwner / Preparer email
	var reviewPOList_noemail = reviewPOList.filter((obj) => {
		return obj.POOWNER_EMAIL === " " && obj.PO_PREPARER === " ";
	});
	for (var i = 0; i < reviewPOList_noemail.length; i++) {
		returnMessage1 =
			returnMessage1 +
			reviewPOList_noemail[i].PONUMBER +
			" - " +
			reviewPOList_noemail[i].ITEMNO +
			" - " +
			userTextExc_noEmail[0].TEXT_TRANSLATIONS +
			"\n";
	}
	responseOutput = returnMessage1;

	// Get the list of POs to be notified
	var reviewPOList_notify = reviewPOList.filter((obj) => {
		return obj.NOTIFY === "X";
	});

	// Get the list of POs to be notified
	var reviewPOList_nonotify = reviewPOList.filter((obj) => {
		return obj.NOTIFY === "";
	});

	for (var i = 0; i < reviewPOList_nonotify.length; i++) {
		returnMessage =
			returnMessage +
			reviewPOList_nonotify[i].PONUMBER +
			" - " +
			reviewPOList_nonotify[i].ITEMNO +
			" - " +
			userTextExc_24[0].TEXT_TRANSLATIONS +
			"\n";
	}
	responseOutput = responseOutput + returnMessage;

	// to get UNIQUE poowner and po preparer//
	var lookup = {};
	var reviewerQuery = [];

	for (var item, i = 0; (item = reviewPOList_notify[i++]); ) {
		var POOWNER_EMAIL = item.POOWNER_EMAIL;
		var PO_PREPARER = item.PO_PREPARER;
		if (!(POOWNER_EMAIL in lookup) || !(PO_PREPARER in lookup)) {
			lookup[POOWNER_EMAIL] = 1;
			reviewerQuery.push(POOWNER_EMAIL, PO_PREPARER);
		}
	}
	reviewerQuery = reviewerQuery.filter(function (str) {
		return /\S/.test(str);
	});

	// to validate email
	function validateEmail(emailAdress) {
		let regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		if (regexEmail.test(emailAdress)) {
			return emailAdress;
		} else {
			return "";
		}
	}

	// to get poowner and po preparer
	var distinctMap = {};
	for (var i = 0; i < reviewerQuery.length; i++) {
		var value = validateEmail(reviewerQuery[i]);
		distinctMap[value] = "";
	}
	var unique_values = Object.keys(distinctMap);

	if (reviewPOList_notify != null) {
		// to get data based on poowner and po preparer from SP result
		for (var i = 0; i < unique_values.length; i++) {
			var result = reviewPOList_notify.filter((obj) => {
				return obj.POOWNER_EMAIL === unique_values[i] || obj.PO_PREPARER === unique_values[i];
			});
			if (unique_values[i] != "") {
				// connection = $.hdb.getConnection();
				const userLang1 =
					'SELECT "LANGUAGE" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_USER_LANGUAGE" WHERE "EMAIL_ID" = ?';
				const userLangExc1 = await connection.executeQuery(userLang1, unique_values[i]);

				const userLanguage1 = userLangExc1.length === 0 ? "EN" : userLangExc1[0].LANGUAGE;

				await sendMail(getAttachment(result), "OpenPOs", unique_values[i], userLanguage1);
			}
			for (var j = 0; j < result.length; j++) {
				//returnMessage2	= returnMessage2 + result[j].PONUMBER + ' -' +  result[j].ITEMNO + ' - Mail Sent \n';
				returnMessage2 =
					returnMessage2 +
					result[j].PONUMBER +
					" - " +
					result[j].ITEMNO +
					" - " +
					unique_values[i] +
					" - " +
					userTextExc_sent[0].TEXT_TRANSLATIONS +
					"\n";
			}
		}
		responseOutput = responseOutput + returnMessage2;
	}
	
	$.response.contentType = "application/json";
	$.response.setBody(responseOutput);

} catch(error){
	console.log('reviewPOLine', error);
	// return error
	$.response.contentType = "application/json";
	$.response.status = 500;
	const status = error?.status || error?.statusCode || error?.code || 500;
	$.response.setBody(error);	
}
finally {
	// closing connection
	if (connection) connection.close();
}

