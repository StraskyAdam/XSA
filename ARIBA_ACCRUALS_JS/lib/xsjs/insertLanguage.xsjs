try{
	const connection = await $.hdb.getConnection();
	const getSchemaName = "select current_schema from dummy";
	const currentSchema = await connection.executeQuery(getSchemaName);
	const schema = currentSchema[0].CURRENT_SCHEMA;

	const configLanguages = JSON.parse($.request.body.asString());

	const LANG_CODE = configLanguages.LANG_CODE;
	const LANGUAGE = configLanguages.LANGUAGE;

	const filterProcedure = await connection.loadProcedure(
		schema,
		"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::insertConfigLanguages"
	);
	const result = await filterProcedure(LANG_CODE, LANGUAGE);

	await connection.commit();
	connection.close();

	$.response.contentType = "text/plain";
	$.response.setBody(result);
}catch(error){
	// return error
	$.response.contentType = "application/json";
	$.response.status = 500;
	const status = error?.status || error?.statusCode || error?.code || 500;
	$.response.setBody({error: error.message, code: status});	
}
