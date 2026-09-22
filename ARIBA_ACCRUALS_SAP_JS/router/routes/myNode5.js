/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
/*eslint-env node, es6 */
"use strict";
const {  statusUpdate, getConnection, callProcedure, getFTPDetails } = require("./utils/handlers");
const { messageAccepted, messageSuccess} = require("./utils/constants");
const express = require("express");
const fs = require("fs");
const SftpUpload = require('sftp-upload');
const app = express.Router();

function getAttachment(rs) {

	var attachment = "\"sep=|\"" + "\n";
	var index = 1;
	var vals = [];
	var data = [];
	var columnNames = [
		"PO Number",
		"Line Item"
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

		attachment = attachment + "\n";
	}

	return attachment;
}
// checking FTP Server details
async function checkFTP(att, req, res) {
	const ftp = getFTPDetails();
	fs.mkdirSync("ACCRUAL", {recursive: true});

	// to get date time in yyyymmddhhmmss format 
	const dateTime = new Date().toISOString().slice(-24).replace(/\D/g, "").slice(0, 14);
	const pathName = "./Accrual_US_" + dateTime + ".csv";
	fs.writeFileSync(pathName, att);

	const sftp = new SftpUpload ({
			// Change the host name, username, path, remoteDir and password
			host: ftp.ftp.url,
			username: ftp.ftp.user,
			path: pathName,
			remoteDir: ftp.ftp.Po_Closure_Dir,
			password: ftp.ftp.password
		});

	return new Promise((resolve, reject) => {
		sftp.on('error', (err) => reject(new Error(`SFTP upload failed: ${err}`)))
			.on('uploading', ({ file, percent }) => console.log(`Uploading ${file} — ${percent}% completed`))
			.on('completed', () => resolve(`${pathName} uploaded successfully`))
			.upload();
	});
}

// calling procedure and loading data to csv and triggering mail 
module.exports = function () {
	//Hello Router
	app.get("/", (req, res) => {
		return res.type("text/plain").status(200).send("Hello World Node.js");
	});

	//FTP check
	app.get("/checkFTP", async (req, res) => {
		let client;
		let outputMessage = "UpdateDB Function success";
		const isJob = Boolean(req.headers["x-sap-job-id"]);

		try {
			client = await getConnection();
			// early response;
			if (isJob) res.status(202).send(messageAccepted);

			const results  = await callProcedure( client, "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::POClosureEmail", null);

			console.log("Procedure results: ", results);
			if (!results || results.length === 0) {
				outputMessage = "No records to process";
				if (isJob) {
					await statusUpdate(req.headers, true, `${messageSuccess}: ${outputMessage}`);
					return;
				}
				return res.type("application/json").status(200).send(`${messageSuccess}: ${outputMessage}`);
			}

			const result = JSON.stringify({ UPDATEDB: results });
			const uploadMessage = await checkFTP(getAttachment(results), req, res);
			console.log("UpdateDB Function success");

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
		}
	});
	return app;
};