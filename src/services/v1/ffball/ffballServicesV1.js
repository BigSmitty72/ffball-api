import { Database } from '../../../../database';
import { ffballServiceSQL } from './ffballServiceSQL';
import { capFirstLetter, compareSort, getLeaguePayout } from './common';

// const sqlConfigFF = {
//   DB_SQL_URL: process.env.DB_SQL_URL || 'jdbc:mysql://ffballsql01.cuoa8z2qgrrc.us-east-2.rds.amazonaws.com/FantasyFootball',
//   DB_SQL_USERNAME: process.env.DB_SQL_USERNAME || 'ffballDBA',
//   DB_SQL_PASSWORD: process.env.DB_SQL_PASSWORD || 'Starcraft5',
//   DB_SQL_OPTIONS: null
// };

const sqlConfigFF = {
  DB_SQL_URL: process.env.DB_SQL_URL || 'jdbc:mysql://localhost/FantasyFootball',
  DB_SQL_USERNAME: process.env.DB_SQL_USERNAME || 'ffballuser',
  DB_SQL_PASSWORD: process.env.DB_SQL_PASSWORD || 'P@ssword!',
  DB_SQL_OPTIONS: null
};
// console.log(process.env);
// console.log('CONFIG', sqlConfigFF);
const databaseFF = new Database(sqlConfigFF);

const ffballServicesV1 = {
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
  getLeagueSettings(request) {
    const res = databaseFF.select(`SELECT regularSeasonWeeks, playoffTeams, leagueId, seasonId
    FROM t_LeaguePlayoffSettings WHERE seasonId = ${request.seasonId} AND leagueId = ${request.leagueId};`);
    return res;
  },
  async getPayout(request) {
    const res = await databaseFF.select(`SELECT payoutType, payoutAmt, leagueId, seasonId FROM t_Payout  
      WHERE leagueId = ${request.leagueId} AND seasonId = ${request.seasonId};`);
    const payoutRes = { leagueId: request.leagueId, seasonId: request.seasonId, payouts: {} };
    res.map((payout) => {
      payoutRes.payouts[payout.payoutType] = payout.payoutAmt;
    });
    return payoutRes;
  },
  getPayouts() {
    const res = databaseFF.select(`SELECT payoutType, payoutAmt, leagueId, seasonId FROM t_Payout;`);
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
  getTeamById(request) {
    const res = databaseFF.select(`SELECT teamId, teamName, ownerName, teamPF, teamPA, teamW, teamL, teamT, powerScore, powerRank FROM t_Standings
    WHERE seasonId = ${request.seasonId} AND leagueId = ${request.leagueId} AND teamId = ${request.teamId} ORDER BY powerRank;`);
    const teamRes = res.map((team) => {
      return Object.assign({}, team, {ownerName: capFirstLetter(team.ownerName), teamName: capFirstLetter(team.teamName)});
    });
    return teamRes;
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
  },
  getTeamRanks(request) {
  	const sqlStr = ffballServiceSQL(request, 'getTeamRanks');
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
  async getTeamWinnings(request) {
    const trophySqlStr = ffballServiceSQL(request, 'getTrophyCount');
    const trophyRes = await databaseFF.select(trophySqlStr);
    const payoutAmt = await getLeaguePayout(request, databaseFF);
    const trophyPayoutRes = { All: [] };
    const totalPerTeam = {};

    trophyRes.map((team) => {
      if (!trophyPayoutRes[team.season]) {
        trophyPayoutRes[team.season] = [];
      }
      const newTeamPayout = {
        teamId: team.teamId,
        ownerName: capFirstLetter(team.ownerName),
        totalPayout: (team.firstPlace * payoutAmt.firstPlace) + (team.secondPlace * payoutAmt.secondPlace) + (team.thirdPlace * payoutAmt.thirdPlace) + (team.highScore * payoutAmt.highScore) + (team.lastManStanding * payoutAmt.lastManStanding),
        payouts: {
          firstPlace: team.firstPlace * payoutAmt.firstPlace,
          secondPlace: team.secondPlace * payoutAmt.secondPlace,
          thirdPlace: team.thirdPlace * payoutAmt.thirdPlace,
          highScore: team.highScore * payoutAmt.highScore,
          lastManStanding: team.lastManStanding * payoutAmt.lastManStanding
        }
      };
      trophyPayoutRes[team.season].push(newTeamPayout);
      if (!totalPerTeam[team.teamId]) {
        totalPerTeam[team.teamId] = { ownerName: newTeamPayout.ownerName, totalPayout: 0, payouts: { firstPlace: 0, secondPlace: 0, thirdPlace: 0, highScore: 0, lastManStanding: 0 } };
      }
      totalPerTeam[team.teamId].totalPayout = totalPerTeam[team.teamId].totalPayout + newTeamPayout.totalPayout;
      totalPerTeam[team.teamId].payouts.firstPlace = totalPerTeam[team.teamId].payouts.firstPlace + newTeamPayout.payouts.firstPlace;
      totalPerTeam[team.teamId].payouts.secondPlace = totalPerTeam[team.teamId].payouts.secondPlace + newTeamPayout.payouts.secondPlace;
      totalPerTeam[team.teamId].payouts.thirdPlace = totalPerTeam[team.teamId].payouts.thirdPlace + newTeamPayout.payouts.thirdPlace;
      totalPerTeam[team.teamId].payouts.highScore = totalPerTeam[team.teamId].payouts.highScore + newTeamPayout.payouts.highScore;
      totalPerTeam[team.teamId].payouts.lastManStanding = totalPerTeam[team.teamId].payouts.lastManStanding + newTeamPayout.payouts.lastManStanding;
    });
    for (const teamId in totalPerTeam) {
      const team = Object.assign({}, {teamId: teamId}, totalPerTeam[teamId]);
      trophyPayoutRes['All'].push(team);
    }
    for (const trophyYear in trophyPayoutRes) {
      trophyPayoutRes[trophyYear].sort(compareSort('totalPayout', false));
    }
    return trophyPayoutRes;
  },
  async getTrophiesByTeam(request) {
    const trophySqlStr = ffballServiceSQL(request, 'getTrophiesByTeam');
    const trophyRes = await databaseFF.select(trophySqlStr);
    const payoutAmt = await getLeaguePayout(request, databaseFF);
    const trophyPayoutRes = { All: {} };

    trophyRes.map((trophy) => {
      !trophyPayoutRes[trophy.season] ? trophyPayoutRes[trophy.season] = {} : '';
      !trophyPayoutRes[trophy.season][trophy.teamId] ? trophyPayoutRes[trophy.season][trophy.teamId] = [] : '';
      !trophyPayoutRes['All'][trophy.teamId] ? trophyPayoutRes['All'][trophy.teamId] = [] : '';

      let payout;
      if (trophy.trophyDescription.toLowerCase().includes('week')) {
        payout = payoutAmt.highScore;
      } else if (trophy.trophyDescription.toLowerCase().includes('league champion')) {
        payout = payoutAmt.firstPlace;
      } else if (trophy.trophyDescription.toLowerCase().includes('second')) {
        payout = payoutAmt.secondPlace;
      } else if (trophy.trophyDescription.toLowerCase().includes('third')) {
        payout = payoutAmt.thirdPlace;
      } else if (trophy.trophyDescription.toLowerCase().includes('standing')) {
        payout = payoutAmt.lastManStanding;
      }
      trophyPayoutRes[trophy.season][trophy.teamId].push({description: trophy.trophyDescription, date: trophy.trophyDate, payout: payout});
      trophyPayoutRes['All'][trophy.teamId].push({description: trophy.trophyDescription, date: trophy.trophyDate, payout: payout});
    })
    return trophyPayoutRes;
  },
  getUserTeams(request) {
    const sqlStr = `SELECT userId, teamId, leagueId, seasonId, leagueName, teamName FROM t_OwnerLeagues WHERE userId = ${request.userId}
      ${ request.seasonId ? 'AND seasonId = ' + request.seasonId + ';' : ';' }`;
    const res = databaseFF.select(sqlStr);
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
  }  
};

export default ffballServicesV1;
