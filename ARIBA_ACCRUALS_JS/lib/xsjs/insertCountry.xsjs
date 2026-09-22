try{ 
	const connection = await $.hdb.getConnection();
	const getSchemaName = "select current_schema from dummy";
	const currentSchema = await connection.executeQuery(getSchemaName);
	const schema = currentSchema[0].CURRENT_SCHEMA;

	const countryData = JSON.parse($.request.body.asString());

	const ip_countrycode = countryData.country_code;
	const ip_countryName = countryData.country_name;
	const ip_companyCode = countryData.bukrs;

	const filterProcedure = await connection.loadProcedure(schema, "ARIBA_ACCRUAL.ARIBA_ACCRUALS_DB.Procedures::insertCountryConfig");
	const result = await filterProcedure(ip_countrycode, ip_countryName, ip_companyCode);

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
