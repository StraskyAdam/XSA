/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
/*eslint-env node, es6 */
"use strict";

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

function getAddress(client, req, res, att, pwd) {

	var cl = client;

	cl.prepare(

		"SELECT \"CONFIG_VALUE\" FROM \"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_CONFIG_VALUES\" WHERE \"CONFIG_NAME\" = ?",
		(err, statement) => {
			if (err) {
				cl.close();
				return res.type("text/plain").status(500).send(`ERROR: ${err.message.toString()}`);
			}
			statement.exec(['FTP_REMOTE_DIR'],
				(err, results) => {
					if (err) {
						cl.close();
						return res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
					} else {
						var result = JSON.stringify({
							ARIBA: results
						});
						cl.close();

						console.log(results);
						checkFTP(att, req, res, pwd, results[0].CONFIG_VALUE);

					}
				});
			return null;

		});
	return null;

}

function getPassword(client, req, res, att) {

	var cl = client;

	cl.prepare(

		"SELECT \"CONFIG_VALUE\" FROM \"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_CONFIG_VALUES\" WHERE \"CONFIG_NAME\" = ?",
		(err, statement) => {
			if (err) {
				cl.close();
				return res.type("text/plain").status(500).send(`ERROR: ${err.message.toString()}`);
			}
			statement.exec(['FTP_PWD'],
				(err, results) => {
					if (err) {
						cl.close();
						return res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
					} else {
						var result = JSON.stringify({
							ARIBA: results
						});
						// cl.close();

						console.log(results);
						getAddress(cl, req, res, att, results[0].CONFIG_VALUE);
						// checkFTP(att,req,res,results[0].CONFIG_VALUE);

					}
				});
			return null;

		});
	return null;

}
var express = require("express");

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
// checking  FTP Server details
function checkFTP(att, req, res, pwd, remote) {
	var fs = require("fs");
	try {
		fs.mkdirSync("ACCRUAL", {
			recursive: true
		});
	} catch (err) {
		console.log(err);
	}
	try {
		// to get date time in yyyymmddhhmmss format 
		var dateTime = new Date().toISOString().slice(-24).replace(/\D/g, '').slice(0, 14);

		var fileName = "Accrual_EUC_" + dateTime + ".csv";
		var pathName = './ACCRUAL/' + fileName;
		var data = fs.writeFileSync(pathName, att, 'utf8');

	} catch (err) {
		console.error(err);
	}

	var SftpUpload = require('sftp-upload');

	var options = {
			host: 'sfpac99.nycomed.local',
			username: 'xH2_service_user',
			path: pathName,
			remoteDir: remote,
			password: pwd
		},
		sftp = new SftpUpload(options);

	sftp.on('error', function (err) {
			res.end(err);
			throw err;
		})
		.on('uploading', function (progress) {
			console.log('Uploading', progress.file);
			console.log(progress.percent + '% completed');
		})
		.on('completed', function () {
			res.type("text/plain").status(200).send(`Upload Completed`);
			let systemName = "FTP";

		})
		.upload();

}
// calling procedure and loading data to csv and triggering mail 
module.exports = function () {
	var app = express.Router();

	//Hello Router
	app.get("/", (req, res) => {
		return res.type("text/plain").status(200).send("Hello World Node.js");
	});

	//FTP check
	app.get("/checkFTP", (req, res) => {
		let client = req.db; //to access db
		let cl = client;

		var hdbext = require("@sap/hdbext");

		var inputParams = "";

		inputParams = {
			IP_FILE: '1'
		};
		hdbext.loadProcedure(cl, null, "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::getOpenPOCSV", (err, sp) => {
			if (err) {
				// sendmail("err", (err.message).toString());
				cl.close();
				return res.type("text/plain").status(500).send(`ERROR: ${err.message.toString()}`);
				// return;
			}
			//(Input Parameters, callback(errors, Output Scalar Parameters, [Output Table Parameters])
			sp(inputParams, (err, parameters, results) => {
				if (err) {
					// sendmail("err", (err.message).toString());
					cl.close();
					return res.type("text/plain").status(500).send(`ERROR: ${err.message.toString()}`);
				}
				var result = JSON.stringify({
					UPDATEDB: results
				});
				// cl.close();
				getPassword(client, req, res, getAttachment(results));
				console.log("UpdateDB Function success");
			});
		});
		let systemName = "FTP";

	});
	return app;
};