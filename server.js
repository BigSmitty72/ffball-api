// server.js

// set using env variables
// const sqlConfig = {
//   DB_SQL_URL: 'jdbc:mysql://localhost/FantasyFootball',
//   DB_SQL_USERNAME: 'ffballuser',
//   DB_SQL_PASSWORD: 'P@ssword!',
//   DB_SQL_OPTIONS: null
// };

// BASE SETUP
// =============================================================================

// call the packages we need
import database from './database';
const routes = require('./src/routes');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

// let database;

// if (sqlConfig.DB_SQL_URL) {
//   database = new Database(sqlConfig);
//   console.log('Created database connection');
// } else {
//   console.log('No database connection defined');
// }

// module.exports(database);

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

const port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
// const router = express.Router();              // get an instance of the express Router

// router.use(function(req, res, next) {
// 	//TODO: Logging
// 	//TODO: API Validation?
// 	console.log('request made: ', res);
// 	next();
// });

// // test route to make sure everything is working (accessed at GET http://localhost:8080/api)
// router.get('/', function(req, res) {
//     res.json({ message: 'hooray! welcome to our api!' });   
// });

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', routes);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);