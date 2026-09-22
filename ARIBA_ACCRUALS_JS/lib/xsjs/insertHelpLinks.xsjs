try{

	const connection = await $.hdb.getConnection();
	const getSchemaName = "select current_schema from dummy";
	const currentSchema = await connection.executeQuery(getSchemaName);
	const schema = currentSchema[0].CURRENT_SCHEMA;

	const helpLinks = JSON.parse($.request.body.asString());

	const ROLE = helpLinks.ROLE;
	const HELP_ID = helpLinks.HELP_ID;
	const HELP_DESC = helpLinks.HELP_DESC;
	const HELP_LINKS = helpLinks.HELP_LINKS;
	const LANGUAGE = helpLinks.LANGUAGE;

	const filterProcedure = await connection.loadProcedure(schema,"ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::insertHelpLinks");
	const result = await filterProcedure(ROLE, HELP_ID, HELP_DESC, HELP_LINKS, LANGUAGE);

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
