const axios = $.require("axios");

/**
 * Retrieve Job Scheduler credentials from environment variables.
 */
function getJobDetails() {
	try {
		const env = $.require("process").env;
		const services = JSON.parse(env.VCAP_SERVICES);
		const { credentials = {} } = services["jobscheduler"][0];
		return credentials;
	} catch (err) {
		throw new Error("Failed to get job details: " + err.message);
	}
}

/**
 * Update job status in SAP Job Scheduler.
 * @param {object} headers - Request headers (XSJS $.request.headers).
 * @param {boolean} success - Status flag.
 * @param {string} message - Status message.
 * @returns {object} Response data from the Job Scheduler.
 */
async function updateJobStatus(headers, success, message) {
	const jobInfo = getJobDetails();
	const jobId = headers.get("x-sap-job-id");
	const scheduleId = headers.get("x-sap-job-schedule-id");
	const runId = headers.get("x-sap-job-run-id");
	const host = headers.get("x-sap-scheduler-host");

	if (!jobId || !scheduleId || !runId || !host) throw new Error("Missing required job scheduler headers.");

	const url = `${host}/scheduler/jobs/${jobId}/schedules/${scheduleId}/runs/${runId}`;
	const auth = $.util.codec.encodeBase64(jobInfo.user + ":" + jobInfo.password);

	try {
		const result = await axios({
			method: "put",
			url,
			headers: {
				"Content-Type": "application/json",
				Authorization: "Basic " + auth
			},
			data: { success, message }
		});
		return result?.data;
	} catch (err) {
		const code = err?.response?.status || err?.code || 500;
		throw new Error("Failed to update job status (jobId=" + jobId + ", code=" + code + "): " + err.message);
	}
}

const messageSuccess = "Processing complete.";
const messageAccepted = "Accepted async job, operation is now running.";

export default { getJobDetails, updateJobStatus, messageSuccess, messageAccepted };
