const https = require("https");
const xsenv = require("@sap/xsenv");
const hana = require("@sap/hana-client");
const fs = require("fs");
const SftpUpload = require('sftp-upload');

// Load HDI container credentials
xsenv.loadEnv();
const hanaOptions = xsenv.getServices({
	hana: {
		plan: "hdi-shared"
	}
});

/**
 * Retrieves the schema name defined in the HANA service configuration.
 *
 * @function getSchema
 * @returns {string} The schema name of the connected HANA database.
 *
 * @example
 * const schema = getSchema();
 */
function getSchema() {
	return hanaOptions.hana.schema;
}

const connParams = {
	serverNode: hanaOptions.hana.host + ":" + hanaOptions.hana.port,
	uid: hanaOptions.hana.user,
	pwd: hanaOptions.hana.password,
	currentSchema: getSchema()
};

/**
 * Establishes and returns an active HANA database connection.
 * Reuses the existing connection if already connected.
 *
 * @async
 * @function getConnection
 * @returns {Promise<object>} A promise that resolves to an active HANA connection object.
 * @throws {Error} If the connection cannot be established.
 */
async function getConnection() {
	let connection;
	if (!connection || !connection.isConnected()) {
		connection = hana.createConnection();
		connection.connect(connParams);
	}
	return connection;
}

/**
 * Retrieves the details of the 'ACCRUAL_JOBSCHEDULER' service binding.
 * @returns {Object} The service binding details for 'ACCRUAL_JOBSCHEDULER'.
 * @throws {Error} If the 'ACCRUAL_JOBSCHEDULER' service is not found or an error occurs.
 */
const getJobDetails = () => {
	try {
		const serviceConfig = xsenv.getServices({
			VCAP_SERVICES: {
				name: "ACCRUAL_JOBSCHEDULER"
			}
		});

		// This check is a defensive measure in case it returns an incomplete object without throwing.
		if (!serviceConfig || !serviceConfig.VCAP_SERVICES) {
			throw new Error("Job Scheduler service 'ACCRUAL_JOBSCHEDULER' details not found or empty.");
		}

		return serviceConfig.VCAP_SERVICES;
	} catch (err) {
		console.error(`[ERROR] Failed to retrieve Job Scheduler details: ${err.message}`);
		return err;
	}
};

/**
 * Updates the job scheduler status using provided headers and result info.
 *
 * @param {Object} headers - HTTP headers containing SAP Job Scheduler metadata.
 * @param {boolean} success - Indicates if the job run was successful.
 * @param {string} message - Message to log alongside job status.
 * @returns {Promise<void>} - Resolves on successful status update; throws on failure.
 */

const statusUpdate = async (headers, success, message) => {
	try {
		const credential = getJobDetails();

		// Extract job identifiers from headers
		const jobId = headers["x-sap-job-id"];
		const scheduleId = headers["x-sap-job-schedule-id"];
		const runId = headers["x-sap-job-run-id"];
		const host = headers["x-sap-scheduler-host"];

		const [hostname, port] = host.replace("https://", "").split(":");

		const data = JSON.stringify({ success: success, message: message });

		// HTTPS request configuration for SAP Job Scheduler endpoint
		const options = {
			host: hostname,
			port,
			path: `/scheduler/jobs/${jobId}/schedules/${scheduleId}/runs/${runId}`,
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				"Content-Length": data.length,
				Authorization: "Basic " + Buffer.from(`${credential.user}:${credential.password}`).toString("base64")
			}
		};

		await new Promise((resolve, reject) => {
			const req = https.request(options, (res) => {
				const { statusCode, statusMessage } = res;
				res.setEncoding("utf8");

				if (![200, 202].includes(statusCode)) {
					return reject(
						new Error(`Failed to update status of job ${jobId}. Error: ${statusCode} - ${statusMessage}`)
					);
				}

				res.on("data", () => resolve());
			});

			req.on("error", (error) => reject(error));
			req.write(data);
			req.end();
		});
	} catch (error) {
		console.error("ERROR: Failed to update status of job:", error.message);
		throw error;
	}
};

/**
 * Calls a stored procedure in the HANA database with the given parameters.
 *
 * @async
 * @function callProcedure
 * @param {object} connection - An active HANA connection object.
 * @param {string} procedureName - The fully qualified name of the procedure (without schema).
 * @param {Array<any>} params - Array of parameters to pass to the stored procedure.
 * @returns {Promise<object[]>} A promise that resolves with the result set of the procedure.
 * @throws {Error} If the procedure execution fails.
 *
 * @example
 * const conn = await getConnection();
 * const result = await callProcedure(conn, 'SP_GET_USERS', ['John']);
 */
async function callProcedure(connection, procedureName, params, count = 1) {
	const currentSchema = getSchema();
	const placeholders = !params
		? ""
		: Array.isArray(params)
			? params.length > 0
				? params.map(() => "?").join(",")
				: Array(count).fill("?").join(",")
			: typeof params === "object"
				? Object.keys(params).length > 0
					? Object.values(params).join(",")
					: Array(count).fill("?").join(",")
				: Array(count).fill("?").join(",");
	const sql = `CALL "${procedureName}"(${placeholders})`;
	return new Promise((resolve, reject) => {
		connection.exec(sql, params, (err, result) => {
			if (err) {
				console.error("Procedure call failed:", err);
				reject(err);
			} else {
				resolve(result);
			}
		});
	});
}

function getFTPDetails() {
	let options = {};
	try {
		options = Object.assign(options, xsenv.getServices({
			ftp: {
				"name": "ftp" // File name has to take
			}
		}));
	} catch (err) {
		console.log("[WARN]", err.message);
		throw err;
	}
	return options;
}

// checking  FTP Server details
async function checkFTP(att, remote, path, filePrefix) {
	const ftp = getFTPDetails();
	fs.mkdirSync("ACCRUAL", { recursive: true });
	fs.mkdirSync("ACCRUAL/Backup", { recursive: true });

	// to get date time in yyyymmddhhmmss format 
	const dateTime = new Date().toISOString().slice(-24).replace(/\D/g, '').slice(0, 14);
	const pathName = `${path}${filePrefix}_${dateTime}.csv`;
	fs.writeFileSync(pathName, att, 'utf8');

	const sftp = new SftpUpload ({
			host: ftp.ftp.url,
			username: ftp.ftp.user,
			path: pathName,
			remoteDir: remote,
			password: ftp.ftp.password
		});

	return new Promise((resolve, reject) => {
		sftp.on('error', (err) => reject(new Error(`SFTP upload failed: ${err}`)))
			.on('uploading', ({ file, percent }) => console.log(`Uploading ${file} — ${percent}% completed`))
			.on('completed', () => resolve(`${pathName} uploaded successfully`))
			.upload();
	});
}

const preparedStatement = "SELECT \"CONFIG_VALUE\" FROM \"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::ZT_CONFIG_VALUES\" WHERE \"CONFIG_NAME\" = ?";

async function getAddress(client, att, pwd, path, filePrefix) {
    return new Promise((resolve, reject) => {
        const remoteDirConfigName = path === "./ACCRUAL/Backup/" ? 'FTP_REMOTE_DIR_BACKUP' : 'FTP_REMOTE_DIR';
        client.prepare(
            preparedStatement,
            (error, statement) => {
                if (error) return reject(new Error(`Prepare error: ${error.toString()}`));

                statement.exec([remoteDirConfigName], async (error, results) => {
                    if (error) return reject(new Error(`Exec error: ${error.toString()}`));
                    
                    try {
                        const uploadResult = await checkFTP(att, results[0].CONFIG_VALUE, path, filePrefix);
                        return resolve(uploadResult);
                    } catch (err) {
                        reject(err);
                    }
                });
            }
        );
    });
}

async function getPassword(client, att, path, filePrefix) {
   return new Promise((resolve, reject) => {
        client.prepare(
            preparedStatement,
            (error, statement) => {
                if (error) return reject(new Error(`Prepare error: ${error.toString()}`));
                
                statement.exec(['FTP_PWD'], async (error, results) => {
                    if (error) return reject(new Error(`Exec error: ${error.toString()}`));
                    
                    try {
                        const uploadResult = await getAddress(client, att, results[0].CONFIG_VALUE, path, filePrefix);
                        return resolve(uploadResult);
                    } catch (err) {
                        reject(err);
                    }
                });
            }
        );
    });
}

module.exports = {
	statusUpdate,
	getJobDetails,
	getConnection,
	callProcedure,
	getSchema,
	getFTPDetails,
	getPassword
};
