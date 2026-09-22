await $.import("xsjslib", "handlers");
const { updateJobStatus, messageSuccess, messageAccepted} = $.xsjslib.handlers;
const headers = $.request.headers;
const jobId = headers.get("x-sap-job-id");
$.response.contentType = "application/json";

if (jobId) {
	$.response.status = 202;
	$.response.setBody(messageAccepted);
}

var dateObj = new Date();
var monthDes = dateObj.toLocaleString("default", { month: "long" });
var year = dateObj.toLocaleString("default", { year: "numeric" });

var last_two_digits_year = year.toString().substr(-2);

// to get names
async function fullName(name){
	var connection = await $.hdb.getConnection();
	var requestInfo =
	"SELECT \"FULL_NAME\" FROM \"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Models::CV_getUserDetails\" WHERE \"EMAILADDR\" = ? ";
	var result = await connection.executeQuery(requestInfo,name);
	return result;
}
	  
async function sendMail(attachment,email,suffix,dateTime) {
	var emailId = await fullName(email);
	if (emailId.length===0) { 
		emailId = email;
	} else {
		emailId=emailId[0].FULL_NAME;
	}

	// to get date time in yyyymmddhhmmss format 
	var filename='Accruals_'+monthDes+last_two_digits_year+'_'+suffix+'.csv';

	// to get user browser language
	var conn = await $.hdb.getConnection();
	var userLang="SELECT \"LANGUAGE\" FROM \"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_USER_LANGUAGE\" WHERE \"EMAIL_ID\" = ?";
	var userLangExc = await conn.executeQuery(userLang,email);

	if (userLangExc.length===0) {
		var userLanguage='EN';		
	}
	else {
		userLanguage=userLangExc[0].LANGUAGE;	
	}


	var userTemplate = "SELECT \"TEMPLATE_NAME\" ,\"SUBJECT\" ,\"BODY\" FROM \"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_EMAIL_TEMPLATE_CONFIG\" WHERE \"TEMPLATE_NAME\" = ? AND \"STATUS\"=? AND \"LANGUAGE\"=?";
	var result = await conn.executeQuery(userTemplate,'SOX_TEMPLATE','X',userLanguage);
	
	var senderAddrQuery = "SELECT \"CONFIG_VALUE\" FROM \"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_CONFIG_VALUES\" WHERE \"CONFIG_NAME\" = ?";
	var send = await conn.executeQuery(senderAddrQuery,'EMAIL_FROM');
	var senderAddr = send[0].CONFIG_VALUE;
	
	var subject = result[0].SUBJECT;
	subject = subject.replace("&MONTH&",monthDes);
	subject = subject.replace("&YEAR&",year);
	
	var body=result[0].BODY;
	body = body.replace("&EMAIL&",emailId);
	
	var firstPart = new $.net.Mail.Part();
	firstPart.type = $.net.Mail.Part.TYPE_ATTACHMENT;
	firstPart.data = attachment; // data1 contains the data for the excel attachment
	firstPart.contentType = "application/vnd.ms-excel";

	firstPart.fileName = filename;
	firstPart.encoding = "UTF-16le";

	var thirdPart = new $.net.Mail.Part();
	thirdPart.type = $.net.Mail.Part.TYPE_TEXT;
	thirdPart.text = body;

	thirdPart.contentType = "text/plain";
	thirdPart.encoding = "UTF-8";
	var mail = new $.net.Mail({
		sender: [{
			name: "Accrual application",
			address: senderAddr,
			nameEncoding: "UTF-8"
		}],
		to :email,
		// cc: ccMails,

		subject: subject,
		subjectEncoding: "UTF-8"
	});

	mail.parts.push(firstPart,thirdPart);
	return await mail.send();
}

async function getAttachment(rs,EMAIL,suffix,dateTime) {
	var attachment = "\"sep=|\"" + "\n";
	var index = 1;
	var vals = [];
	var data = [];
	var columnNames = [
		"Company Code",
		"Activity Number",
		"Cost Center",
		"GLAccount",
		"PO Owner",
		"Posting Date",
		"Split Accounting Number",
		"PO Number",
		"Line Item",
		"Internal Order",
		"Purchase Order Date",
		"PO line Description",
		"Supplier Code",
		"Supplier Name",
		"SAP Vendor Number",
		// "Purchasing Org",
		"Asset ID",
		"Profit Center",
		"Service Start Date",
		"Service End Date",
		"Company Code Currency",
		"Document Currency",
		"Order Quantity",
		"Net Price",
		"Invoice Amount",
		"Exchange Rate",
		"Amount to be Accrued (Company Code Currency)",
		"Amount to be Accrued (Document Currency)"
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
			attachment = attachment + "\"" + rs[i].COMPANYCODE + "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}

		if (rs[i].ZACTIVITYNBR != null) {
			attachment = attachment + "\"" + rs[i].ZACTIVITYNBR + "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}
		
		if (rs[i].COSTCENTER != null) {
			attachment = attachment + "\"" + rs[i].COSTCENTER + "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}
		
		if (rs[i].GLACCOUNT != null) {
			attachment = attachment + "\"" + rs[i].GLACCOUNT + "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}

		if (rs[i].POOWNER_EMAIL != null) {
			attachment = attachment + "\"" + rs[i].POOWNER_EMAIL + "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}
		
		if (rs[i].KEYDAY != null) {
			attachment = attachment + "\"" +rs[i].KEYDAY + "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}
		
		if (rs[i].BBP_ACC_NO != null) {
			attachment = attachment + "\"" + rs[i].BBP_ACC_NO + "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}

		if (rs[i].PONUMBER != null) {
			attachment = attachment + "\"" + rs[i].PONUMBER + "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}
		
		if (rs[i].ITEMNO != null) {
			attachment = attachment + "\"" + rs[i].ITEMNO + "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}

		if (rs[i].INTERNALORDER != null) {
			attachment = attachment + "\"" + rs[i].INTERNALORDER + "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}
		
		if (rs[i].DOCUMENTDATE != null) {
			attachment = attachment + "\"" + rs[i].DOCUMENTDATE + "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}

		var poline =(rs[i].POLINEDESC).replace(/[|]/g, ',') ;
		 poline =poline.replace(/"/g, '""') ;
		 
		if (poline!= null) {
			attachment = attachment + "\""+ poline.replace(/–/g,'-')  + "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}
		
		if (rs[i].SUPPLIERID != null) {
			attachment = attachment + "\"" + rs[i].SUPPLIERID + "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}

		if (rs[i].SUPPLIERNAME != null) {
			attachment = attachment + "\"" + rs[i].SUPPLIERNAME + "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}
		
		if (rs[i].VENDOR != null) {
			attachment = attachment + "\"" + rs[i].VENDOR + "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}

		// if (rs[i].PURCHASINGORGANIZATION != null) {
		// 	attachment = attachment + "\"" + rs[i].PURCHASINGORGANIZATION + "\"" + "|";
		// } else {
		// 	attachment = attachment + "\"" + " " + "\"" + "|";
		// }
		
		if (rs[i].ASSETID != null) {
			attachment = attachment + "\"" + rs[i].ASSETID + "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}

		if (rs[i].PROFITCENTER != null) {
			attachment = attachment + "\"" + rs[i].PROFITCENTER + "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}
		
		if (rs[i].WRKSTRTDATE != null) {
			attachment = attachment + "\"" + rs[i].WRKSTRTDATE+ "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}
		
		if (rs[i].WRKENDDATE != null) {	
			attachment = attachment + "\"" + rs[i].WRKENDDATE+ "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}
		
		if (rs[i].COCDECURR != null) {
			attachment = attachment + "\"" + rs[i].COCDECURR + "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}

		if (rs[i].POCURRENCY != null) {
			attachment = attachment + "\"" + rs[i].POCURRENCY + "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}
		
		if (rs[i].ORDERQUANTITY != null) {
			attachment = attachment + "\"" + rs[i].ORDERQUANTITY + "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}
		
			
		if (rs[i].POVALUE != null) {
			attachment = attachment + "\"" + rs[i].POVALUE + "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}
		
		if (rs[i].INVOICEAMOUNTCLEAREDORIG != null) {
			attachment = attachment + "\"" + rs[i].INVOICEAMOUNTCLEAREDORIG + "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}
		
		if (rs[i].EXCHANGERATE != null) {
			attachment = attachment + "\"" + rs[i].EXCHANGERATE + "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}
		
		if (rs[i].AMOUNTTOBEACCRUEDORIG != null) {
			attachment = attachment + "\"" + rs[i].AMOUNTTOBEACCRUEDORIG + "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}
		
		if (rs[i].AMOUNTTOBEACCRUEDORIG != null) {
			attachment = attachment + "\"" + rs[i].AMOUNTTOBEACCRUEDORIG + "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}
	
		attachment = attachment + "\n";
	}
	await sendMail(attachment,EMAIL,suffix,dateTime);
}

async function jobStart() {
	try {
		var conn = await $.hdb.getConnection();
		var getSchemaName = "select current_schema from dummy";
		var currentSchema = await conn.executeQuery(getSchemaName);
		var schema = currentSchema[0].CURRENT_SCHEMA;
		var date = new Date();
		var currentdate = new Date().toISOString().slice(0, 10);
		var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString().slice(0, 10);
		var rs;
	
		var filterProcedure = await conn.loadProcedure(schema, "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::monthlyPointInTime");
		rs = await filterProcedure();
		
		// to get toAddress 
		if (currentdate === lastDay) {
			var toAddrQuery= "SELECT \"CONFIG_VALUE\"  FROM \"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_CONFIG_VALUES\" WHERE \"CONFIG_NAME\" = ?";
			var toAddrQueryResult = await conn.executeQuery(toAddrQuery,'SOX_EMAIL_TO');
			var emailsTo= toAddrQueryResult[0].CONFIG_VALUE;
			var EMAIL=emailsTo.split(/[ ,]+/);
		} else {
			var toAddrQuery= "SELECT \"CONFIG_VALUE\"  FROM \"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_CONFIG_VALUES\" WHERE \"CONFIG_NAME\" = ?";
			var toAddrQueryResult = await conn.executeQuery(toAddrQuery,'DAILY_SOX_EMAIL_TO');
			var emailsTo= toAddrQueryResult[0].CONFIG_VALUE;
			var EMAIL=emailsTo.split(/[ ,]+/);
		}
		
		await conn.commit();
		conn.close();
		var pos=0;
		
		for (pos in EMAIL) {
			var dateTime = new Date().toISOString().slice(-24).replace(/\D/g,'').slice(0, 14);
			var start = 0;
			var end = 50000;
			var x = 0;
			var length = rs.$resultSets[0].length;
			if (length > 0) {
				var	suffix = 1;
				
				while (x == 0 ){
					if (length <= end) {
						end = length;
						var newRs = rs.$resultSets[0].slice(start, end);
						await getAttachment(newRs,EMAIL[pos],suffix,dateTime);
						x = 1;
					}
					if (x !== 1) {
						var newRs = rs.$resultSets[0].slice(start, end );
						await getAttachment(newRs,EMAIL[pos],suffix,dateTime);
						newRs=0;
						start = end;
						end = end + 50000;
					}
					suffix = suffix+1;
				}
			}
		}
			
		// sendMail(getAttachment(rs.$resultSets[0]),EMAIL);
		var response ='mail sent successfully';
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
	$.response.contentType = "text/plain";
	// $.response.contentType = "application/json";
	$.response.setBody(response);
}

jobStart();
	
