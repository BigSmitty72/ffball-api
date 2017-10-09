import {Database} from '../../../../database';
import {ffballServiceSQL} from './ffballServiceSQL';

console.log(process.env);
const sqlConfigFF = {
  DB_SQL_URL: process.env.DB_SQL_URL || 'jdbc:mysql://localhost/FantasyFootball',
  DB_SQL_USERNAME: process.env.DB_SQL_USERNAME || 'ffballuser',
  DB_SQL_PASSWORD: process.env.DB_SQL_PASSWORD || 'P@ssword!',
  DB_SQL_OPTIONS: null
};
console.log('CONFIG', sqlConfigFF);
const databaseFF = new Database(sqlConfigFF);

const ffballServicesV1 = {
  getPayouts() {
    const res = databaseFF.select(`SELECT payoutType, payoutAmt, leagueId, seasonId FROM t_Payout;`);
  	return res;
  },
  getPayout(request) {
  	const res = databaseFF.select(`SELECT payoutType, payoutAmt, leagueId, seasonId FROM t_Payout  
  		WHERE leagueId = ${request.leagueId} AND seasonId = ${request.seasonId};`);
  	return res;
  },
  getTeamRanks(request) {
  	const sqlStr = ffballServiceSQL(request, 'getTeamRanks');
  	const res = databaseFF.select(sqlStr);
  	return res;
  },
  getTeamById(request) {
  	const res = databaseFF.select(`SELECT teamId, teamName, ownerName, teamPF, teamPA, teamW, teamL, teamT, powerScore, powerRank FROM t_Standings
		WHERE seasonId = ${request.seasonId} AND leagueId = ${request.leagueId} AND teamId = ${request.teamId} ORDER BY powerRank;`);
  	const teamRes = res.map((team) => {
  		return Object.assign({}, team, {ownerName: capFirstLetter(team.ownerName), teamName: capFirstLetter(team.teamName)});
  	});
  	return teamRes;
  },
  async getProjMatchups(request) {
  	const res = await databaseFF.select(`SELECT weekNum AS week, teamOneId AS teamOne, teamTwoId AS teamTwo, winProbability AS teamOffset FROM t_SeasonMatchups
		WHERE seasonId = ${request.seasonId} AND leagueId = ${request.leagueId} ORDER BY weekNum;`);
  	const matchupRes = [];
  	for (var i=0; i < res.length; i++) {
  		if (matchupRes.length === 0) {
  			matchupRes.push({
  				week: res[i].week,
  				matchups: [{
  					teamOne: res[i].teamOne,
  					teamTwo: res[i].teamTwo,
  					teamOffset: res[i].teamOffset
  				}]
  			});
  		} else {
  			for (var x=0; x <= matchupRes.length; x++) {
	  			if (x === matchupRes.length) {
	  				matchupRes.push({
		  				week: res[i].week,
		  				matchups: [{
		  					teamOne: res[i].teamOne,
		  					teamTwo: res[i].teamTwo,
		  					teamOffset: res[i].teamOffset
		  				}]
		  			});
		  			break;
	  			} else {
	  				if (res[i].week === matchupRes[x].week) {
		  				matchupRes[x].matchups.push({
		  					teamOne: res[i].teamOne,
		  					teamTwo: res[i].teamTwo,
		  					teamOffset: res[i].teamOffset
		  				})
		  				x = matchupRes.length;
		  			}
	  			}
	  		}
	  	}
  	}
  	return matchupRes;
  },
  getLeagueSettings(request) {
  	const res = databaseFF.select(`SELECT regularSeasonWeeks, playoffTeams, leagueId, seasonId
		FROM t_LeaguePlayoffSettings WHERE seasonId = ${request.seasonId} AND leagueId = ${request.leagueId};`);
  	return res;
  },
  getWeeklyHighScores(request) {
  	let weeklyHighScoreSql = `SELECT * FROM v_weeklyhighscore WHERE seasonId = ${request.seasonId} AND leagueId = ${request.leagueId}`
  	if (request.weekNum && request.weekNum.toLowerCase() !== 'all') {
  		weeklyHighScoreSql = weeklyHighScoreSql + ` AND weekNum = ${request.weekNum}`;
  	}
  	weeklyHighScoreSql = weeklyHighScoreSql + ' ORDER BY weekNum;';
  	const res = databaseFF.select(weeklyHighScoreSql);
  	return res;
  },
  getPowerRankings(request) {
  	const res = databaseFF.select(`SELECT powerRank AS 'Power Rank', rankChange AS 'Rank Change', ownerName AS 'Owner', teamPF AS 'PF', teamW AS 'W', teamL AS 'L', 
  		teamT AS 'T', powerScore AS 'Power Score' FROM v_powerRanks WHERE leagueId = ${request.leagueId} AND seasonId = ${request.seasonId} ORDER BY powerRank ASC;`);
  	const powerRankRes = res.map((team) => {
  		return Object.assign({}, team, {Owner: capFirstLetter(team.Owner)});
  	});
  	return powerRankRes;
  },
  getUserTeams(request) {
  	let sqlStr;
  	if (request.seasonId) {
  		sqlStr = `SELECT userId, teamId, leagueId, seasonId, leagueName, teamName FROM t_OwnerLeagues WHERE userId = ${request.userId} AND seasonId = ${request.seasonId};`;
  	} else {
  		sqlStr = `SELECT userId, teamId, leagueId, seasonId, leagueName, teamName FROM t_OwnerLeagues WHERE userId = ${request.userId};`;
  	}
  	const res = databaseFF.select(sqlStr);
  	return res;
  },
  async getTeamRanksHistory(request) {
  	const res = await databaseFF.select(`SELECT weekNum AS week, teamId, powerRank AS 'Power Rank', ownerName AS 'Owner', teamPF AS 'PF', teamW AS 'W', teamL AS 'L', 
  		teamT AS 'T', powerScore AS 'Power Score' FROM t_Standings_History WHERE seasonId = ${request.seasonId} AND leagueId = ${request.leagueId}
  		ORDER BY weekNum, powerScore DESC;`);

  	const powerRankRes = [];
  	for (var i=0; i < res.length; i++) {
  		if (powerRankRes.length === 0) {
  			powerRankRes.push({
  				week: res[i].week,
  				powerRank: [{
  					'Power Rank': res[i]['Power Rank'],
  					Owner: capFirstLetter(res[i].Owner),
  					PF: res[i].PF,
  					W: res[i].W,
  					L: res[i].L,
  					T: res[i].T,
  					'Power Score': res[i]['Power Score'],
  				}]
  			});
  		} else {
  			for (var x=0; x <= powerRankRes.length; x++) {
	  			if (x === powerRankRes.length) {
	  				powerRankRes.push({
		  				week: res[i].week,
		  				powerRank: [{
		  					'Power Rank': res[i]['Power Rank'],
		  					Owner: capFirstLetter(res[i].Owner),
		  					PF: res[i].PF,
		  					W: res[i].W,
		  					L: res[i].L,
		  					T: res[i].T,
		  					'Power Score': res[i]['Power Score'],
		  				}]
		  			});
		  			break;
	  			} else {
	  				if (res[i].week === powerRankRes[x].week) {
	  					powerRankRes[x].powerRank.push({
		  					'Power Rank': res[i]['Power Rank'],
		  					Owner: capFirstLetter(res[i].Owner),
		  					PF: res[i].PF,
		  					W: res[i].W,
		  					L: res[i].L,
		  					T: res[i].T,
		  					'Power Score': res[i]['Power Score'],
		  				});
		  				x = powerRankRes.length;
		  			}
	  			}
	  		}
	  	}
  	}
  	return powerRankRes;
  },
  async addWeekLowScore(request) {
  	const sqlStr = ffballServiceSQL(request, 'addWeekLowScore');
  	let addedId = {};
  	try {
  		const resId = await databaseFF.insert(sqlStr);
  		if (resId > 0) {
  			addedId = {addedId: resId};
  		} else {
  			addedId = {addedId: 'ID already exists'};
  		}
  	} catch(err) {
  		console.log(err.message);
  		return { error: err.message };
  	}
	return addedId;
  },
  async getLastManStanding(request) {
  	const sqlStr = ffballServiceSQL(request, 'getLastManStanding')
  	const res = await databaseFF.select(sqlStr);
  	const eliminatedTeams = [];
  	const remainingTeams = [];

  	let lastManStandingRes = {};
  	for (let i=0; i < res.length; i++) {
  		const team = res[i];
  		if (team.eliminated === 1) {
  			eliminatedTeams.push({ownerName: capFirstLetter(team.ownerName), teamName: capFirstLetter(team.teamName), weekNum: team.weekNum, teamPoints: team.teamPoints});
  		} else {
  			remainingTeams.push({ownerName: capFirstLetter(team.ownerName), teamName: capFirstLetter(team.teamName)});
  		}
  	}

  	remainingTeams.sort(compareSort('ownerName'));
  	eliminatedTeams.sort(compareSort('weekNum'));

  	lastManStandingRes.eliminatedTeams = eliminatedTeams;
  	lastManStandingRes.remainingTeams = remainingTeams;
  	return lastManStandingRes;
  },
  async getTeamWinnings(request) {
  	const trophySqlStr = ffballServiceSQL(request, 'getTrophyCount');
  	let payoutSqlStr = `SELECT payoutType, payoutAmt FROM t_Payout WHERE seasonId = ${request.seasonId} AND leagueId = ${request.leagueId};`;
  	const trophyRes = await databaseFF.select(trophySqlStr);
  	if (typeof request.seasonId === 'string') {
		if (request.seasonId.toLowerCase() === 'all') {
			payoutSqlStr = `SELECT payoutType, payoutAmt FROM t_Payout WHERE seasonId = (SELECT MAX(seasonId) FROM t_Payout WHERE leagueId = ${request.leagueId}) 
				AND leagueId = ${request.leagueId};`;
		}
	}
  	const payoutRes = await databaseFF.select(payoutSqlStr);
  	let payouts = {
  		'Weekly': 0,
  		'1st': 0,
  		'2nd': 0,
  		'3rd': 0,
  		'LastMan': 0
  	};

	payoutRes.map((payout) => {
		payouts[payout.payoutType] = payout.payoutAmt;
	});
  	const teamWinningsRes = [];

  	trophyRes.map((team) => {
  		const highScorePayout = team.HighScoreTrophies * payouts.Weekly || 0;
  		const lastManStandingPayout = team.LastManStandingTrophies * payouts.LastMan || 0;
  		const championshipPayout = team.ChampionshipTrophies * payouts['1st'] || 0;
  		const totalPayout = highScorePayout + lastManStandingPayout + championshipPayout;
  		teamWinningsRes.push(
  			{
	  			teamId: team.teamId,
	  			ownerName: capFirstLetter(team.ownerName),
	  			trophies: team.Trophies,
	  			highScore: team.HighScoreTrophies,
	  			highScorePayout: highScorePayout,
	  			lastManStanding: team.LastManStandingTrophies,
	  			lastManStandingPayout: lastManStandingPayout,
	  			championship: team.ChampionshipTrophies,
	  			championshipPayout: championshipPayout,
	  			totalPayout: totalPayout
	  		}
		);
  	});
  	return teamWinningsRes;
  },
  async getBestDrafter(request) {
  	const sqlStr = ffballServiceSQL(request, 'getBestDrafter');
  	const res = await databaseFF.select(sqlStr);
  	const teamsInd = [];
  	const teamsRes = [];
  	for (let i=0; i < res.length; i++) {
  		const teamIndex = teamsInd.indexOf(res[i].teamName);
  		if (teamIndex < 0) {
			teamsInd.push(res[i].teamName);
			teamsRes.push(
				{
					DraftRank: teamsInd.length,
					Team: res[i].teamName,
					DraftScore: res[i].DraftScore,
					Players: [
						{
							Rd: res[i].round,
							Pick: res[i].draftNum,
							Pos: res[i].playerPos,
							Name: res[i].playerName,
							Rank: res[i].posRank,
							Points: res[i].playerScore
						}
					]
				}
			);
		} else {
			teamsRes[teamIndex].Players.push(
				{
					Rd: res[i].round,
					Pick: res[i].draftNum,
					Pos: res[i].playerPos,
					Name: res[i].playerName,
					Rank: res[i].posRank,
					Points: res[i].playerScore
				}
			);

		}
  	}

  	return teamsRes;
  },
  async getTeamPossiblePoints(request) {
  	const sqlStr = ffballServiceSQL(request, 'getTeamPossiblePoints');
  	const res = await databaseFF.select(sqlStr);
  	const weeklyRes = {};
  	res.map((week) => {
  		if (!weeklyRes[`week${week.weekNum.toString()}`]) {
  			weeklyRes[`week${week.weekNum.toString()}`] = [];
  		}
  		weeklyRes[`week${week.weekNum.toString()}`].push(week);
  	});
  	return weeklyRes;
  }
 //  getEspnCookies(request) {
	// var fs = require( 'fs' ),
	//     path = 'C:\\Users\\jason.smith\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Cookies';;
 //    console.log(process.platform);

	// // switch( process.platform ) {
	// //   case 'darwin':
	// //     path = process.env.HOME + '/Library/Application Support/Google/Chrome/Default/Cookies';
	// //     break;
	// //   case 'linux':
	// //     path = process.env.HOME + '/.config/google-chrome/Default';
	// //     break;
	// //   default:
	// //     console.error( 'Currently your OS is not supported!' );
	// //     process.exit( 1 );
	// // }

	// var url = 'http://games.espn.com',
	//     matches = url.match( /:\/\/([\w\.-]+)/ );

	// if( !matches ) {
	//   console.error( 'Invalid url! Please provide a valid url' );
	//   process.exit( 1 );
	// }

	// console.log(path);

	// if( !fs.existsSync( path ) ) {
	//   console.error( 'I don\'t think you have Google Chrome installed!' );
	//   process.exit( 1 );
	// }

	// var sqlite3 = require( 'sqlite3' ).verbose(),
	//     db = new sqlite3.DatabaseFF(path),
	//     tld = require( 'tldjs' ),
	//     host = '.' + tld.getDomain( matches[1] );

 //    host = 'espn';

	// db.serialize(function() {
	//   db.each( "SELECT host_key, path, secure, expires_utc, name, value FROM cookies where host_key like '%" + host + "%'", function( err, cookie ) {
	//     if ( err ) {
	//       throw err;
	//     }
	//     var out = cookie.host_key + '\t' +
	//     ( cookie.host_key.indexOf( host ) === 0 ? 'TRUE' : 'FALSE' ) + '\t' +
	//     cookie.path + '\t' +
	//     ( !!cookie.secure ? 'TRUE' : 'FALSE') + '\t' +
	//     ( !!cookie.expires_utc ? cookie.expires_utc : '0') + '\t' +
	//     cookie.name + '\t' +
	//     cookie.value + '\n';
	//     console.log( out );
	//   });
	// });

	// db.close();

 //  	return {"test": "duh"};
 //  }
};

const capFirstLetter = (str) => {
	return str.replace(/\s\s+/g, ' ').split(' ').map((word) => {
		return word[0].toUpperCase() + word.substr(1);
	}).join(' ');
}

const compareSort = (fieldName) => {
	return (
		function (a,b) {
			if (a[fieldName] < b[fieldName])
				return -1;
			if (a[fieldName] > b[fieldName])
				return 1;
			return 0;
		}
	)
}

export default ffballServicesV1;
