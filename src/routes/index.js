import ffballServicesV1 from '../services/v1/ffball/ffballServicesV1';
import rocketLeagueServicesV1 from '../services/v1/rocketLeague/rocketLeagueServicesV1';
const routes = require('express').Router();
//const router = express.Router();

routes.use(function (req, res, next) {
	//TODO: Logging
	//TODO: API Validation?
	console.log('request made: logging'); //, res);
	// Website you wish to allow to connect
	res.setHeader('Access-Control-Allow-Origin', process.env.FFBALL_URL || 'http://localhost:3000');

	// Request methods you wish to allow
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

	// Request headers you wish to allow
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	res.setHeader('Access-Control-Allow-Credentials', true);
	next();
});

routes.all('/secret', function (req, res, next) {
  console.log('Accessing the secret section ...')
  next() // pass control to the next handler
})

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
routes.get('/', function(req, res) {
    res.send({ message: 'hooray! welcome to our api!' });   
});

routes.get('/ffball/v1/Payout', async function(req, res) {
	const response = await ffballServicesV1.getPayouts();
	res.send(response);
});

routes.post('/ffball/v1/Payout', async function(req, res) {
	const response = await ffballServicesV1.getPayout(req.body);
	res.send(response);
});

routes.post('/ffball/v1/AddWeekLowScore', async function(req, res) {
	const response = await ffballServicesV1.addWeekLowScore(req.body);
	res.send(response);
});

routes.post('/ffball/v1/BestDrafter', async function(req, res) {
	const response = await ffballServicesV1.getBestDrafter(req.body);
	res.send(response);
});

routes.post('/ffball/v1/Teams', async function(req, res) {
	const response = await ffballServicesV1.getTeamRanks(req.body);
	res.status('200').send(response);
});

routes.post('/ffball/v1/Team', async function(req, res) {
	const response = await ffballServicesV1.getTeamById(req.body);
	res.send(response);
});

routes.post('/ffball/v1/TeamPossiblePoints', async function(req, res) {
	const response = await ffballServicesV1.getTeamPossiblePoints(req.body);
	res.send(response);
});

routes.post('/ffball/v1/TeamWinnings', async function(req, res) {
	const response = await ffballServicesV1.getTeamWinnings(req.body);
	res.send(response);
});

routes.post('/ffball/v1/Matchups', async function(req, res) {
	const response = await ffballServicesV1.getProjMatchups(req.body);
	res.send(response);
});

routes.post('/ffball/v1/LeagueSettings', async function(req, res) {
	const response = await ffballServicesV1.getLeagueSettings(req.body);
	res.send(response);
});

routes.post('/ffball/v1/LastManStanding', async function(req, res) {
	const response = await ffballServicesV1.getLastManStanding(req.body);
	res.send(response);
});

routes.post('/ffball/v1/PowerRankings', async function(req, res) {
	const response = await ffballServicesV1.getPowerRankings(req.body);
	res.send(response);
});

routes.post('/ffball/v1/WeeklyHighScores', async function(req, res) {
	const response = await ffballServicesV1.getWeeklyHighScores(req.body);
	res.send(response);
});

routes.post('/ffball/v1/PowerRankingsHistory', async function(req, res) {
	const response = await ffballServicesV1.getTeamRanksHistory(req.body);
	res.send(response);
});

routes.post('/ffball/v1/UserTeams', async function(req, res) {
	const response = await ffballServicesV1.getUserTeams(req.body);
	res.send(response);
});

routes.post('/rocketLeague/v1/GetItemList', async function(req, res) {
	const response = await rocketLeagueServicesV1.getItemList(req.body);
	res.send(response);
});

routes.post('/rocketLeague/v1/AddItemHistory', async function(req, res) {
	const response = await rocketLeagueServicesV1.addItemHistory(req.body);
	res.send(response);
});

routes.post('/rocketLeague/v1/GoogleSpreadsheetData', async function(req, res) {
	const response = await rocketLeagueServicesV1.getGoogleSpreadsheet(req.body);
	res.send(response);
});

routes.post('/v1/cookieEspn', async function(req, res) {
	const response = await ffballServicesV1.getEspnCookies(req.body);
	res.send(response);
});

module.exports = routes;
