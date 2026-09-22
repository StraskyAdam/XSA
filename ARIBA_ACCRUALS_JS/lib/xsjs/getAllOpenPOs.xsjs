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
// to get month and year
let dateObj = new Date();
let monthValue = dateObj.getMonth();
let day = dateObj.toLocaleString("default", { day: "2-digit" });
let monthDes = dateObj.toLocaleString("default", { month: "long" });
let year = dateObj.toLocaleString("default", { year: "numeric" });

// during freeze period display previous month in the subject
if (day < 7) {
	dateObj.setMonth(dateObj.getMonth() - 1);
	//dateObj.setMonth(0-1);     //-------------(testing purpose)
	// current day is jan then substarct year
	if (monthValue === 0) {
		//if(0===0)            //-----------------(testing purpose)
		var yearDiff = year - 1;
		year = yearDiff;
	} else {
		year = year;
	}
	monthDes = dateObj.toLocaleString("default", { month: "long" });
} else {
	monthDes = monthDes;
}

// to get names
async function fullName(name) {
	const connection = await $.hdb.getConnection();
	const requestInfo =
		'SELECT "FULL_NAME" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Models::CV_getUserDetails" WHERE "EMAILADDR" = ? ';
	const result = await connection.executeQuery(requestInfo, name);
	return result;
}

async function sendMail(attachment, email, suffix, dateTime) {
	let emailId = await fullName(email);
	emailId = emailId.length === 0 ? email : emailId[0].FULL_NAME;

	// to get date time in yyyymmddhhmmss format
	const filename = "Digital_PO_Accruals_Dashboard_" + dateTime + "_" + suffix + ".csv";

	// to get user browser language
	const conn = await $.hdb.getConnection();
	const userLang =
		'SELECT "LANGUAGE" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_USER_LANGUAGE" WHERE "EMAIL_ID" = ?';
	const userLangExc = await conn.executeQuery(userLang, email);
	const userLanguage = userLangExc.length === 0 ? "EN" : userLangExc[0].LANGUAGE;

	const userTemplate =
		'SELECT "TEMPLATE_NAME" ,"SUBJECT" ,"BODY" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_EMAIL_TEMPLATE_CONFIG" WHERE "TEMPLATE_NAME" = ? AND "STATUS"=? AND "LANGUAGE"=?';
	const result = await conn.executeQuery(userTemplate, "NOTIFY_USER_ALLPO", "X", userLanguage);

	const senderAddrQuery =
		'SELECT "CONFIG_VALUE" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_CONFIG_VALUES" WHERE "CONFIG_NAME" = ?';
	const send = await conn.executeQuery(senderAddrQuery, "EMAIL_FROM");
	const senderAddr = send[0].CONFIG_VALUE;

	let subject = result[0].SUBJECT;
	subject = subject.replace("&MONTH&", monthDes);
	subject = subject.replace("&YEAR&", year);

	let body = result[0].BODY;
	body = body.replace("&USER&", emailId);

	const firstPart = new $.net.Mail.Part();
	firstPart.type = $.net.Mail.Part.TYPE_ATTACHMENT;
	firstPart.data = attachment; // data1 contains the data for the excel attachment
	firstPart.contentType = "application/vnd.ms-excel";

	firstPart.fileName = filename;
	firstPart.encoding = "UTF16-BE";

	const thirdPart = new $.net.Mail.Part();
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
		to: email,
		subject: subject,
		subjectEncoding: "UTF-8"
	});
	mail.parts.push(firstPart, thirdPart);
	return await mail.send();
}

async function getAttachment(rs, EMAIL, suffix, dateTime) {
	var attachment = "\uFEFF";
	// "\"sep=|\"" + "\n";
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
		"Profit Center",
		"Asset Id",
		"Region",
		"PR Number",
		"PO Creation Date",
		"Rule Type Text",
		"Rule Type",
		"PSTYPE Text",
		// mvp2
		"Exchange Rate",
		"Eligible for Closure",
		"Activity Number",
		"Split Accounting %"
	];

	var i = 1;

	//Column Headings for Excel File
	for (i = 0; i < columnNames.length; i++) {
		attachment += columnNames[i] + ",";
	}
	attachment = attachment + "\n";

	for (i = 0; i < rs.length; i++) {
		index = 2;

		data.push(vals);

		if (rs[i].PO_DASHBOARD_SECTION != null) {
			attachment = attachment + '"' + rs[i].PO_DASHBOARD_SECTION + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// Company Code
		if (rs[i].COMPANYCODE != null) {
			attachment = attachment + '"' + rs[i].COMPANYCODE + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// PO Number
		if (rs[i].PONUMBER != null) {
			attachment = attachment + '"' + rs[i].PONUMBER + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// Item Number
		if (rs[i].ITEMNO != null) {
			attachment = attachment + '"' + rs[i].ITEMNO + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// PO Description
		var poline = rs[i].POLINEDESC.replace(/"/g, '""');
		// PO Description
		if (poline != null) {
			attachment = attachment + '"' + poline.replace(/–/g, "-") + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// Supplier ID
		if (rs[i].SUPPLIERID != null) {
			attachment = attachment + '"' + rs[i].SUPPLIERID + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// Supplier Name

		var sup_name = rs[i].SUPPLIERNAME.replace(/"/g, '""');
		// PO Description
		if (sup_name != null) {
			attachment = attachment + '"' + sup_name.replace(/–/g, "-") + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}
		// if (rs[i].SUPPLIERNAME != null) {

		// 			// if(rs[i].SUPPLIERNAME)
		// 			// if(charat.rs[i].SUPPLIERNAME.length-1 == "\"") then add somthing to manage
		// 			var flag  = false;
		// 			var hasSingleQuotes = (rs[i].SUPPLIERNAME.match(/'/g)||[]).length;
		// 			var name = rs[i].SUPPLIERNAME;
		// 			if(hasSingleQuotes) {
		// 					var supplierName = name;
		// 				while (supplierName.includes("\'")) {
		// 					// supplierName = rs[i].SUPPLIERNAME.replace(/'/g, '"');
		// 					// str = str.slice(0, 3) + str.slice(4);
		// 					var indx  = rs[i].SUPPLIERNAME.indexOf("\'");
		// 					supplierName = supplierName.slice(0, indx) + supplierName.slice(indx + 1);
		// 					flag = true;
		// 					break;
		// 				}

		// 				supplierName = supplierName.slice(0, indx) + "\"\""  + supplierName.slice(indx);

		// 			} else {
		// 			supplierName = rs[i].SUPPLIERNAME;
		// 			}

		// 			var supName = (supplierName.match(/"/g)||[]).length;
		// 			if(supName == 3 && flag == true) {
		// 				flag = false;
		// 				attachment = attachment + "\"" + supplierName.replace(/'/g, '"') + "\"" + ",";
		// 			} else {
		// 				attachment = attachment + "\"" + supplierName + "\"" + ",";
		// 			}

		// } else {
		// 	attachment = attachment + "\"" + " " + "\"" + ",";
		// }

		// Document Currency
		if (rs[i].POCURRENCY != null) {
			attachment = attachment + '"' + rs[i].POCURRENCY + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// PO Value
		if (rs[i].POVALUE != null) {
			attachment = attachment + '"' + rs[i].POVALUE + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// 	"PO Value(USD)",
		if (rs[i].POVALUE_USD != null) {
			attachment = attachment + '"' + rs[i].POVALUE_USD + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}
		// Status
		if (rs[i].STATUS != null) {
			attachment = attachment + '"' + rs[i].STATUS + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// Service Start Date
		if (rs[i].WRKSTRTDATE != null) {
			attachment = attachment + '"' + getNewDateString(rs[i].WRKSTRTDATE) + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// Service End Date
		if (rs[i].WRKENDDATE != null) {
			attachment = attachment + '"' + getNewDateString(rs[i].WRKENDDATE) + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// Services Completed Amount
		if (rs[i].TOTWRKCOMPAMT != null) {
			attachment = attachment + '"' + rs[i].TOTWRKCOMPAMT + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}
		// "Services Completed Amount(USD)"
		if (rs[i].TOTWRKCOMPAMT_USD != null) {
			attachment = attachment + '"' + rs[i].TOTWRKCOMPAMT_USD + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// % Services Completed
		if (rs[i].TOTWRKCOMPPER != null) {
			attachment = attachment + '"' + rs[i].TOTWRKCOMPPER + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// Goods Receipt to Date
		if (rs[i].GRVALUE != null) {
			attachment = attachment + '"' + rs[i].GRVALUE + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}
		// "Goods Reciept to date(USD)",

		if (rs[i].GRVALUE_USD != null) {
			attachment = attachment + '"' + rs[i].GRVALUE_USD + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		//Invoice
		if (rs[i].INVVALUE != null) {
			attachment = attachment + '"' + rs[i].INVVALUE + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}
		// if (rs[i].INVOICE_CURRENCY_IN_PO_CURRENCY_AMOUNT != null) {
		// 	attachment = attachment + "\"" + rs[i].INVOICE_CURRENCY_IN_PO_CURRENCY_AMOUNT + "\"" + ",";
		// } else {
		// 	attachment = attachment + "\"" + " " + "\"" + ",";
		// }
		// "Invoice Amount to Date(USD)",
		if (rs[i].INVVALUE_USD != null) {
			attachment = attachment + '"' + rs[i].INVVALUE_USD + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}
		//Amount to be accrued
		if (rs[i].AMOUNTACCRUED != null) {
			attachment = attachment + '"' + rs[i].AMOUNTACCRUED + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}
		// "Amount to be Accrued(USD)",
		if (rs[i].AMOUNTACCRUED_USD != null) {
			attachment = attachment + '"' + rs[i].AMOUNTACCRUED_USD + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		//Straight Line Method
		if (rs[i].STRAIGHTLINEMTHD != null) {
			attachment = attachment + '"' + rs[i].STRAIGHTLINEMTHD + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// Accrual Method
		if (rs[i].ACCRUALMETHOD != null) {
			attachment = attachment + '"' + rs[i].ACCRUALMETHOD + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// PO Owner
		if (rs[i].POOWNER_EMAIL != null) {
			attachment = attachment + '"' + rs[i].POOWNER_EMAIL + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// PO Preparer
		if (rs[i].PO_PREPARER != null) {
			attachment = attachment + '"' + rs[i].PO_PREPARER + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// Reviewed By
		if (rs[i].REVIWED_BY != null) {
			attachment = attachment + '"' + rs[i].REVIWED_BY + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// Last Changed On
		if (rs[i].CHANGED_ON != null) {
			attachment = attachment + '"' + getNewTimeString(rs[i].CHANGED_ON) + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		//GL Account
		if (rs[i].GLACCOUNT != null) {
			attachment = attachment + '"' + rs[i].GLACCOUNT + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// Cost center
		if (rs[i].COSTCENTER != null) {
			attachment = attachment + '"' + rs[i].COSTCENTER + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// Management Unit
		if (rs[i].MANAGEUNIT != null) {
			attachment = attachment + '"' + rs[i].MANAGEUNIT + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// Internal Order
		if (rs[i].INTERNALORDER != null) {
			attachment = attachment + '"' + rs[i].INTERNALORDER + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// Profit Center
		if (rs[i].PROFITCENTER != null) {
			attachment = attachment + '"' + rs[i].PROFITCENTER + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// Asset ID
		if (rs[i].ASSETID != null) {
			attachment = attachment + '"' + rs[i].ASSETID + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// Region
		if (rs[i].REGION != null) {
			attachment = attachment + '"' + rs[i].REGION + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// EP number
		if (rs[i].EPNUMBER != null) {
			attachment = attachment + '"' + rs[i].EPNUMBER + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// PO Creation
		if (rs[i].POCREATEDAT != null) {
			attachment = attachment + '"' + getNewDateString(rs[i].POCREATEDAT) + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// Rule Type
		if (rs[i].RULETYPE != null) {
			attachment = attachment + '"' + rs[i].RULETYPE + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// Rule Type Text
		if (rs[i].RULETYPETEXT != null) {
			attachment = attachment + '"' + rs[i].RULETYPETEXT + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}
		//PSTYPE
		if (rs[i].PSTYPE != null) {
			attachment = attachment + '"' + rs[i].PSTYPE + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// Exchnage Rate
		if (rs[i].EXCHANGERATE != null) {
			attachment = attachment + '"' + rs[i].EXCHANGERATE + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}

		// PO Closure

		if (rs[i].PO_CLOSURE != null) {
			attachment = attachment + '"' + rs[i].PO_CLOSURE + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}
		if (rs[i].ZACTIVITYNBR != null) {
			attachment = attachment + '"' + rs[i].ZACTIVITYNBR + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}
			// Split Accounting %
		if (rs[i].DISTPERCENTAGE != null) {
			attachment = attachment + '"' + rs[i].DISTPERCENTAGE + '"' + ",";
		} else {
			attachment = attachment + '"' + " " + '"' + ",";
		}
		attachment = attachment + "\n";
	}

	await sendMail(attachment, EMAIL, suffix, dateTime);
}

try {
	var conn = await $.hdb.getConnection();
	var getSchemaName = "select current_schema from dummy";
	var currentSchema = await conn.executeQuery(getSchemaName);
	var schema = currentSchema[0].CURRENT_SCHEMA;

	var rs;
	var getOPen = JSON.parse($.request.body.asString());
	var EMAIL = getOPen.EMAIL;
	var POOWNER = getOPen.POOWNER;

	var filterProcedure = await conn.loadProcedure(schema, "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::getAllOpenPOs");
	rs = await filterProcedure(EMAIL,POOWNER);

	await conn.commit();
	conn.close();

	var dateTime = new Date().toISOString().slice(-24).replace(/\D/g,'').slice(0, 14);
	
	var start = 0;
	var end = 50000;
	var x = 0;
	var length = rs.$resultSets[0].length;

	if (length > 0) {
		var	suffix=1;
		
		while (x == 0 ) {
			if (length <= end) {
				end = length;
				var newRs = rs.$resultSets[0].slice(start, end );
				await getAttachment(newRs,EMAIL,suffix,dateTime);
				x = 1;
			}
			if (x !== 1) {

				var newRs = rs.$resultSets[0].slice(start, end );
				await getAttachment(newRs,EMAIL,suffix,dateTime);

				newRs=0;
				start = end;
				end = end + 50000;
			}
			suffix = suffix+1;
		}
	}
		
	// sendMail(getAttachment(rs.$resultSets[0]),EMAIL);
	var response ='mail sent successfully';
}
catch (err) {
  response = err;
}
$.response.contentType = "text/plain";
// $.response.contentType = "application/json";
$.response.setBody(response);
