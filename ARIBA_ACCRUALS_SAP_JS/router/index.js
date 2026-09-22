/*eslint no-console: 0, no-unused-vars: 0, no-undef:0, no-process-exit:0*/
/*eslint-env node, es6 */
"use strict";

module.exports = (app, server) => {
	app.use("/test", require("./routes/monthlyPosting")());
	app.use("/node", require("./routes/myNode")());
	app.use("/node2", require("./routes/myNode2")());
	app.use("/node3", require("./routes/myNode3")());
	app.use("/node4", require("./routes/myNode4")());
	app.use("/node5", require("./routes/myNode5")());			/*Daily Network Job*/	

	app.use( (err, req, res, next) => {
		console.error(JSON.stringify(err));
		res.status(500).send(`System Error ${JSON.stringify(err)}`);
	});

};