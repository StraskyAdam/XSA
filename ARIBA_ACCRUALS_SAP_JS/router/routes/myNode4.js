/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
/*eslint-env node, es6 */
"use strict";
const {  statusUpdate, getConnection, callProcedure, getPassword } = require("./utils/handlers");
const { messageAccepted, messageSuccess} = require("./utils/constants");
const express = require("express");
const app = express.Router();

function getAttachment(rs) {

	var attachment = "\"sep=|\"" + "\n";
	var index = 1;
	var vals = [];
	var data = [];
	var columnNames = [
		"Company Code",
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
			attachment = attachment + "\"" + rs[i].KEYDAY + "\"" + "|";
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

		var poline = (rs[i].POLINEDESC).replace(/[|]/g, ',');
		poline = poline.replace(/"/g, '""');

		if (poline != null) {
			attachment = attachment + "\"" + poline.replace(/–/g, '-') + "\"" + "|";
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
			attachment = attachment + "\"" + rs[i].WRKSTRTDATE + "\"" + "|";
		} else {
			attachment = attachment + "\"" + " " + "\"" + "|";
		}

		if (rs[i].WRKENDDATE != null) {
			attachment = attachment + "\"" + rs[i].WRKENDDATE + "\"" + "|";
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

	return attachment;
}

module.exports = function () {
	//Hello Router
	app.get("/", (req, res) => {
		return res.type("text/plain").status(200).send("Hello World Node.js");
	});

	//FTP check
	app.get("/checkFTP", async (req, res) => {
		let client;
		let outputMessage = "UpdateDB Function success";
		const inputParams = { IP_FILE: '4' };
		const filePrefix = "Accrual_US4";
		const isJob = Boolean(req.headers["x-sap-job-id"]);
		try {
			client = await getConnection();
			// early response;
			if (isJob) res.status(202).send(messageAccepted);

			const results  = await callProcedure( client, "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::getOpenPOCSV", inputParams);

			if (!results || results.length === 0) {
				outputMessage = "No records to process";
				if (isJob) {
					await statusUpdate(req.headers, true, `${messageSuccess}: ${outputMessage}`);
					return;
				}
				return res.type("application/json").status(200).send(`${messageSuccess}: ${outputMessage}`);
			}
			const result = JSON.stringify({ UPDATEDB: results });
			const date = new Date();
			const currentdate = new Date().toISOString().slice(0, 10);
			const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString().slice(0, 10);
			let path = "./ACCRUAL/Backup/";

			if (currentdate === lastDay) path ="./ACCRUAL/";
	
			const uploadMessage = await getPassword(client, getAttachment(results), path, filePrefix);
			console.log("UpdateDB Function success", uploadMessage);
			const finalOutputMessage = `${messageSuccess} ${outputMessage}: ${uploadMessage}`;
			if (isJob) {
				await statusUpdate(req.headers, true, finalOutputMessage);
			} else {
				return res.type("application/json").status(200).send(finalOutputMessage);
			}
		} catch (error) {
				const ErrorMessage = error.message;
			if (isJob) {
				await statusUpdate(req.headers, false, ErrorMessage);
			} else {
				return res.type("application/json").status(500).send(`ERROR: ${ErrorMessage}`);
			}	
		} finally {
		try {
			if (client) client.close();
		  } catch (e) {}
		}
	});
	return app;
};