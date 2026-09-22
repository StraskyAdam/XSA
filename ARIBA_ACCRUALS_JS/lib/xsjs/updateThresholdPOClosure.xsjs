try {
	const connection = await $.hdb.getConnection();
	const getSchemaName = "select current_schema from dummy";
	const currentSchema = await connection.executeQuery(getSchemaName);
	const schema = currentSchema[0].CURRENT_SCHEMA;
	const statuspo = JSON.parse($.request.body.asString()).statuspo;
	const filterProcedure = await connection.loadProcedure(
		schema,
		"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::updateThresholdPOClosure"
	);
	const result = await filterProcedure(statuspo);

	await connection.commit();
	connection.close();
		
	$.response.contentType = "application/json";
	$.response.setBody(result);

} catch (error){
	// return error
	$.response.contentType = "application/json";
	$.response.status = 500;
	const status = error?.status || error?.statusCode || error?.code || 500;
	$.response.setBody({error: error.message, code: status});	
}
