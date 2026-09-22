try{
	const connection = await $.hdb.getConnection();
	const getSchemaName = "select current_schema from dummy";
	const currentSchema = await connection.executeQuery(getSchemaName);
	const schema = currentSchema[0].CURRENT_SCHEMA;

	const filterProcedure = await connection.loadProcedure(schema, "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::cutOffCheck");
	const result = await filterProcedure();

	await connection.commit();
	connection.close();
	// return data
	$.response.contentType = "text/plain";	
	console.log(result);
	$.response.setBody(result?.$resultSets[0]);	

}catch(error){
	// return error
	$.response.contentType = "application/json";
	$.response.status = 500;
	$.response.setBody({error: error.message, code: error?.status || error?.code || error?.statusCode});	
}

