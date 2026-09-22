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
		hour12: true,
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
		"PO Dashboard Section",
		"Company Code",
		"PO Number",
		"Line Item",
		"PO line Description",
		"Supplier Code",
		"Supplier Name",
		"Document Currency",
		"PO Value",
		"PO Value(USD)",
		"Status",
		"Service Start Date",
		"Service End Date",
		"Services Completed Amount",
		"Services Completed Amount(USD)",
		"% of Services Completed",
		"Goods Reciept to date",
		"Goods Reciept to date(USD)",
		"Invoice Amount to Date",
		"Invoice Amount to Date(USD)",
		"Amount to be Accrued",
		"Amount to be Accrued(USD)",
		"Straight Line Method",
		"Accrual Method",
		"PO Owner",
		"PO Preparer",
		"Reviewed By",
		"Last Update On",
		"GL Account",
		"Cost Center",
		"Management Unit",
		"Internal Order",
		"Profit Center"
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

		if (rs[i].PO_DASHBOARD_SECTION != null) {
			attachment = attachment + '"' + rs[i].PO_DASHBOARD_SECTION + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		// Company Code
		if (rs[i].COMPANYCODE != null) {
			attachment = attachment + '"' + rs[i].COMPANYCODE + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		// PO Number
		if (rs[i].PONUMBER != null) {
			attachment = attachment + '"' + rs[i].PONUMBER + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		// Item Number
		if (rs[i].ITEMNO != null) {
			attachment = attachment + '"' + rs[i].ITEMNO + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		// PO Description
		var poline = rs[i].POLINEDESC.replace(/"/g, '""');
		// PO Description
		if (poline != null) {
			attachment = attachment + '"' + poline.replace(/–/g, "-") + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		// Supplier ID
		if (rs[i].SUPPLIERID != null) {
			attachment = attachment + '"' + rs[i].SUPPLIERID + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		// Supplier Name
		if (rs[i].SUPPLIERNAME != null) {
			attachment = attachment + '"' + rs[i].SUPPLIERNAME + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		// Document Currency
		if (rs[i].POCURRENCY != null) {
			attachment = attachment + '"' + rs[i].POCURRENCY + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		// PO Value
		if (rs[i].POVALUE != null) {
			attachment = attachment + '"' + rs[i].POVALUE + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		// 	"PO Value(USD)",
		if (rs[i].POVALUE_USD != null) {
			attachment = attachment + '"' + rs[i].POVALUE_USD + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}
		// Status
		if (rs[i].STATUS != null) {
			attachment = attachment + '"' + rs[i].STATUS + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		// Service Start Date
		if (rs[i].WRKSTRTDATE != null) {
			attachment = attachment + '"' + getNewDateString(rs[i].WRKSTRTDATE) + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		// Service End Date
		if (rs[i].WRKENDDATE != null) {
			attachment = attachment + '"' + getNewDateString(rs[i].WRKENDDATE) + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		// Services Completed Amount
		if (rs[i].TOTWRKCOMPAMT != null) {
			attachment = attachment + '"' + rs[i].TOTWRKCOMPAMT + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}
		// "Services Completed Amount(USD)"
		if (rs[i].TOTWRKCOMPAMT_USD != null) {
			attachment = attachment + '"' + rs[i].TOTWRKCOMPAMT_USD + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		// % Services Completed
		if (rs[i].TOTWRKCOMPPER != null) {
			attachment = attachment + '"' + rs[i].TOTWRKCOMPPER + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		// Goods Receipt to Date
		if (rs[i].GRVALUE != null) {
			attachment = attachment + '"' + rs[i].GRVALUE + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}
		// "Goods Reciept to date(USD)",

		if (rs[i].GRVALUE_USD != null) {
			attachment = attachment + '"' + rs[i].GRVALUE_USD + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		// Invoice
		if (rs[i].INVVALUE != null) {
			attachment = attachment + '"' + rs[i].INVVALUE + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}
		// "Invoice Amount to Date(USD)",
		if (rs[i].INVVALUE_USD != null) {
			attachment = attachment + '"' + rs[i].INVVALUE_USD + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}
		//Amount to be accrued
		if (rs[i].AMOUNTACCRUED != null) {
			attachment = attachment + '"' + rs[i].AMOUNTACCRUED + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}
		// "Amount to be Accrued(USD)",
		if (rs[i].AMOUNTACCRUED_USD != null) {
			attachment = attachment + '"' + rs[i].AMOUNTACCRUED_USD + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		//Straight Line Method
		if (rs[i].STRAIGHTLINEMTHD != null) {
			attachment = attachment + '"' + rs[i].STRAIGHTLINEMTHD + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		// Accrual Method
		if (rs[i].ACCRUALMETHOD != null) {
			attachment = attachment + '"' + rs[i].ACCRUALMETHOD + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		// PO Owner
		if (rs[i].POOWNER_EMAIL != null) {
			attachment = attachment + '"' + rs[i].POOWNER_EMAIL + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		// PO Preparer
		if (rs[i].PO_PREPARER != null) {
			attachment = attachment + '"' + rs[i].PO_PREPARER + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		// Reviewed By
		if (rs[i].REVIWED_BY != null) {
			attachment = attachment + '"' + rs[i].REVIWED_BY + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		// Last Changed On
		if (rs[i].CHANGED_ON != null) {
			attachment = attachment + '"' + getNewTimeString(rs[i].CHANGED_ON) + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		//GL Account
		if (rs[i].GLACCOUNT != null) {
			attachment = attachment + '"' + rs[i].GLACCOUNT + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		// Cost center
		if (rs[i].COSTCENTER != null) {
			attachment = attachment + '"' + rs[i].COSTCENTER + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		// Management Unit
		if (rs[i].MANAGEUNIT != null) {
			attachment = attachment + '"' + rs[i].MANAGEUNIT + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		// Internal Order
		if (rs[i].INTERNALORDER != null) {
			attachment = attachment + '"' + rs[i].INTERNALORDER + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		// Profit Center
		if (rs[i].PROFITCENTER != null) {
			attachment = attachment + '"' + rs[i].PROFITCENTER + '"' + "|";
		} else {
			attachment = attachment + '"' + " " + '"' + "|";
		}

		attachment = attachment + "\n";
	}

	return attachment;
}

// trigger email
async function sendMail(attachment, senderAddr, userLangResult) {
	const connection = await $.hdb.getConnection();
	const toQuery =
		'SELECT "CONFIG_VALUE" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_CONFIG_VALUES" WHERE "CONFIG_NAME" = ?';
	const result_to = await connection.executeQuery(toQuery, "EMAIL_FROM");
	const torAddr = result_to[0].CONFIG_VALUE;

	// to get body and subject
	const tempQuery =
		'SELECT "BODY" ,"SUBJECT" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_EMAIL_TEMPLATE_CONFIG" WHERE "TEMPLATE_NAME" = ? and "LANGUAGE"=?';
	const tempQueryResult = await connection.executeQuery(tempQuery, "POCLOSURE_EMAIL", userLangResult);
	const subject = tempQueryResult[0].SUBJECT;
	const body = tempQueryResult[0].BODY;

	var dateTime = new Date().toISOString().slice(-24).replace(/\D/g, "").slice(0, 14);
	var fileName = "Accruals_POClosure_" + dateTime + ".csv";

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
	const mail = new $.net.Mail({
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

const headers = $.request.headers;
const jobId = headers.get("x-sap-job-id");
$.response.contentType = "application/json";

if (jobId) {
	$.response.status = 202;
	$.response.setBody(messageAccepted);
}

async function jobStart() {
	var dateObj = new Date();
	let connection;
	let responseOutput = "";
	
	try {
		connection = await $.hdb.getConnection();
		const getSchemaName = "select current_schema from dummy";
		const currentSchema = await connection.executeQuery(getSchemaName);
		const schema = currentSchema[0].CURRENT_SCHEMA;
	
		const filterProcedure = await connection.loadProcedure(
			schema,
			"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::POClosureEmail"
		);
		const rs = await filterProcedure();
		const res = rs.$resultSets[0];
	
		await connection.commit();
	
		if (res.length !== 0) {
			//  to get sender address
	
			var senderAddrQuery =
				'SELECT "CONFIG_VALUE" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_CONFIG_VALUES" WHERE "CONFIG_NAME" = ?';
			var result = await connection.executeQuery(senderAddrQuery, "POCLOSURE_EMAIL_TO");
			var senderAddr = result[0].CONFIG_VALUE.split(/[ ,]+/);
	
			var i = 0;
			for (i in senderAddr) {
				// to get user browser language
				var sentAddr = senderAddr[i];
				var userLang =
					'SELECT "LANGUAGE" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_USER_LANGUAGE" WHERE "EMAIL_ID" = ?';
				var userLangExc = await connection.executeQuery(userLang, sentAddr);
	
				if (userLangExc.length === 0) {
					userLangResult = "EN";
				} else {
					var userLangResult = userLangExc[0].LANGUAGE;
				}
	
				await sendMail(getAttachment(res), sentAddr, userLangResult);
			}
			responseOutput = "Mail sent successfully";
		} else {
			responseOutput = "Does not have any  records";
		}
		
		if (jobId) await updateJobStatus(headers, true, `${messageSuccess} : ${responseOutput}`);
	
	} catch(error){
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