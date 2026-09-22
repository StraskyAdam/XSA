$.response.contentType = "application/json";
let result = "";
try {
  const conn = await $.hdb.getConnection();
  if (conn) {
    result = "Server is up!";
  } else {
    result = "Server is down!";
  }
  
} catch (error) {
	console.log(error.message)
  result = { message: error?.message, code: error?.code || error?.status };
}

$.response.setBody(result);
