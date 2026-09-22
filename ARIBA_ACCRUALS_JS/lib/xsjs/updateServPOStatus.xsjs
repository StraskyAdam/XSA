var axios = $.require("axios");
var http = $.require("http");
var https = $.require("https");

try {
	var connection = await $.hdb.getConnection();
	var getSchemaName = "select current_schema from dummy";
	var currentSchema = await connection.executeQuery(getSchemaName);
	var schema = currentSchema[0].CURRENT_SCHEMA;
	var statuspo = JSON.parse($.request.body.asString()).statuspo;

	statuspo.sort((a, b) => a.PONUMBER - b.PONUMBER || a.LINEITEM - b.LINEITEM);

	var filterProcedure = await connection.loadProcedure(
		schema,
		"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::updateServPOStatus"
	);
	var result = await filterProcedure(statuspo);

	await connection.commit();

	// Pushing Po Data to Ariba
	var dest = await $.net.http.readDestination("EXTERNAL_HTTP");
	// var client = new $.net.http.Client();
	var a, j;

	for (var i = 0; i < statuspo.length; i++) {
		a = 0;
		if (statuspo[i].PO_CLOSURE === "true") {
			var epnum = 'SELECT  "UNSEZ" FROM "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.synonyms::EKKO.EKKO" WHERE "EBELN" = ?';
			var epnumR = await connection.executeQuery(epnum, statuspo[i].PONUMBER);
			await connection.commit();

			var soapenvF =
				'<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:Ariba:Buyer:vsap">' +
				"<soapenv:Header>" +
				"<urn:Headers>" +
				"<urn:variant>?</urn:variant>" +
				"<urn:partition>?</urn:partition>" +
				"</urn:Headers>" +
				"</soapenv:Header>" +
				"<soapenv:Body>" +
				'<urn:LineItemsPOCloseImportRequest partition="?" variant="vrealm_1686">' +
				"<urn:ERPOrder_LineItemsPOCloseImport_Item>" +
				"<urn:item>" +
				"<urn:LineItems>";

			var soapenvIt =
				"<urn:item>" +
				"<urn:Closed>4</urn:Closed>" +
				"<urn:SAPPOLineNumber>" +
				statuspo[i].LINEITEM +
				"</urn:SAPPOLineNumber>" +
				"</urn:item>";

			for (var k = i + 1; k < statuspo.length; k++) {
				if (statuspo[k].PONUMBER === statuspo[i].PONUMBER && statuspo[k].PO_CLOSURE === "true") {
					var soapenvI =
						"<urn:item>" +
						"<urn:Closed>4</urn:Closed>" +
						"<urn:SAPPOLineNumber>" +
						statuspo[k].LINEITEM +
						"</urn:SAPPOLineNumber>" +
						"</urn:item>";
					soapenvIt = soapenvIt + soapenvI;
					a = k;
				}
			}

			var soapenvL =
				"</urn:LineItems>" +
				"<urn:UniqueName>" +
				epnumR[0].UNSEZ +
				"</urn:UniqueName>" +
				"</urn:item>" +
				"</urn:ERPOrder_LineItemsPOCloseImport_Item>" +
				"</urn:LineItemsPOCloseImportRequest>" +
				"</soapenv:Body>" +
				"</soapenv:Envelope>";

			var soapenv = soapenvF + soapenvIt + soapenvL;

			// var req = new $.web.WebRequest($.net.http.POST, "");
			// req.headers.set("Content-Type", "application/soap+xml");
			// req.headers.set("Authorization", "Basic " + dest.username + ":" + dest.password);
			// req.setBody(soapenv);
			// await client.request(req, dest.host);
			// var response = await client.getResponse();
			// console.log({ response });
			
			const response = await axios.post(dest.host, soapenv, {
				headers: { 
					"Content-Type": "application/soap+xml", 
					Authorization: "Basic " + dest.username + ":" + dest.password
				},
				httpAgent: new http.Agent({ keepAlive: true }),
				httpsAgent: new https.Agent({ keepAlive: true }),
				proxy: dest?.proxy || { protocol: 'https', host: 'pse.onetakeda.com', port: 443 },
				responseType: 'json'
			});

			$.response.status = response?.status || 500;
			if (response?.data.includes("Success")) {
				if (a > 0) {
					for (j = i; j <= a; j++) {
						if (statuspo[j].PO_CLOSURE === "true") {
							var insertProcedureS = await connection.loadProcedure(
								schema,
								"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::insertWebService"
							);
							var resultS = await insertProcedureS(
								statuspo[j].PONUMBER,
								statuspo[j].LINEITEM,
								epnumR[0].UNSEZ,
								"X",
								"Success"
							);
							await connection.commit();
						}
					}
				} else {
					var insertProcedureS = await connection.loadProcedure(
						schema,
						"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::insertWebService"
					);
					var resultS = await insertProcedureS(
						statuspo[i].PONUMBER,
						statuspo[i].LINEITEM,
						epnumR[0].UNSEZ,
						"X",
						"Success"
					);
					await connection.commit();
				}
			} else {
				if (a > 0) {
					for (j = i; j <= a; j++) {
						if (statuspo[j].PO_CLOSURE === "true") {
							var insertProcedureF = await connection.loadProcedure(
								schema,
								"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::insertWebService"
							);
							var resultF = await insertProcedureF(
								statuspo[j].PONUMBER,
								statuspo[j].LINEITEM,
								epnumR[0].UNSEZ,
								"X",
								"Fail"
							);
							await connection.commit();
						}
					}
				} else {
					var insertProcedureF = await connection.loadProcedure(
						schema,
						"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::insertWebService"
					);
					var resultF = await insertProcedureF(
						statuspo[i].PONUMBER,
						statuspo[i].LINEITEM,
						epnumR[0].UNSEZ,
						"X",
						"Fail"
					);
					await connection.commit();
				}
			}
			if (a > 0) {
				i = a;
			}
		}
	}

	connection.close();
	$.response.contentType = "application/json";
	$.response.setBody(result);
} catch (error) {
	// return error
	$.response.contentType = "application/json";
	const status = error?.status || error?.statusCode || error?.code || 500;
	$.response.status = status;
	$.response.setBody(error);
}
