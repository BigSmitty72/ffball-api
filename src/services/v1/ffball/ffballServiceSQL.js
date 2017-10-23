export function ffballServiceSQL (request, service) {
	switch (service) {
		case 'addWeekLowScore': {
			return `
				INSERT INTO t_LastManStandingLowScore(weekNum, teamId, teamPoints, seasonId, leagueId)
				SELECT distinct
					weekNum,
				    teamId,
				    teamCurrScore,
				    seasonId,
				    leagueId
				FROM t_WeeklyScores
				WHERE weekNum = ${request.weekNum}
				AND seasonId = ${request.seasonId}
				AND leagueId = ${request.leagueId}
				AND teamId NOT IN (
					SELECT teamId FROM t_LastManStandingLowScore WHERE weekNum = ${request.weekNum} AND seasonId = ${request.seasonId} AND leagueId = ${request.leagueId}
				)
				AND (SELECT COUNT(TeamId) FROM t_LastManStandingLowScore WHERE weekNum = ${request.weekNum} AND seasonId = ${request.seasonId} AND leagueId = ${request.leagueId}) < 1
				ORDER BY teamCurrScore ASC
				LIMIT 1;`
			break;
		}
		case 'getBestDrafter': {
			return `SELECT
				DP.teamName,
				CONVERT(REPLACE(draftRd, '\n\r\nROUND', ''), UNSIGNED INTEGER) AS round,
			    DP.draftNum,
			    P.playerPos,
			    P.playerName,
			    P.playerScore,
			    P.playerRank AS posRank,
			    x.DraftScore
			FROM t_DraftedPlayers DP
			JOIN t_Players P ON P.playerId = DP.playerId AND P.seasonId = DP.seasonId AND P.leagueId = DP.leagueId
			JOIN (SELECT
					DP.teamName,
					COUNT(P.playerName) AS Players,
					SUM(P.playerScore) AS DraftScore
				FROM t_DraftedPlayers DP
				JOIN t_Players P ON P.playerId = DP.playerId AND P.seasonId = DP.seasonId AND P.leagueId = DP.leagueId
				WHERE P.seasonId = ${request.seasonId}
				AND P.leagueId = ${request.leagueId}
				GROUP BY DP.teamName) AS x ON x.teamName = DP.teamName
			WHERE P.seasonId = ${request.seasonId}
			AND P.leagueId = ${request.leagueId}
			ORDER BY DraftScore DESC, CONVERT(REPLACE(draftRd, 'ROUND', ''), UNSIGNED INTEGER) ASC, draftNum ASC;`;
			break;
		}
		case 'getLastManStanding': {
			return `
				SELECT
					TS.ownerName,
					TS.teamName,
					CASE 
						WHEN LS.weekNum IS NULL AND LS.teamPoints IS NULL THEN false
						ELSE true
				    END AS eliminated,
				    CASE 
						WHEN LS.weekNum IS NULL THEN 'NA'
						ELSE LS.weekNum
				    END AS weekNum,
				    CASE 
						WHEN LS.teamPoints IS NULL THEN 'NA'
						ELSE LS.teamPoints
				    END AS teamPoints
				FROM t_Standings TS
				LEFT JOIN t_LastManStandingLowScore LS ON TS.teamId = LS.teamId AND TS.leagueId = LS.leagueId AND TS.seasonId = LS.seasonId
				WHERE TS.leagueId = ${request.leagueId}
				AND TS.seasonId = ${request.seasonId};`
			break;
		}
		case 'getTeamRanks': {
			return `SELECT teamId AS 'TeamId', teamName AS 'Team', teamW AS 'Wins', powerRank AS 'PointsRank' FROM t_Standings 
  				WHERE leagueId = ${request.leagueId} ${getSeasonIdWhereClause(request.seasonId)} ORDER BY powerRank;`;
			break;
		}
		case 'getTrophyCount': {
			const trophySql = `
				SELECT DISTINCT
					CASE
						WHEN MONTH(trophyDate) < 6 THEN YEAR(trophyDate) - 1
				        ELSE YEAR(trophyDate)
					END AS season,
					s.teamId,
					s.ownerName,
				    SUM(CASE 
						WHEN trophyDescription LIKE '%hi%score%' THEN 1
						ELSE 0
					END) AS highScore,
					SUM(CASE 
						WHEN trophyDescription LIKE '%Last%Man%' THEN 1
						ELSE 0
					END) AS lastManStanding,
					SUM(CASE 
						WHEN trophyDescription LIKE '%League%Champion%' THEN 1
						ELSE 0
					END) AS firstPlace,
				    SUM(CASE 
						WHEN trophyDescription LIKE '%Second%' THEN 1
						ELSE 0
					END) AS secondPlace,
				    SUM(CASE 
						WHEN trophyDescription LIKE '%Third%' THEN 1
						ELSE 0
					END) AS thirdPlace
				FROM t_Trophies t
				JOIN t_Standings s ON t.leagueId = s.leagueId AND t.teamId = s.teamId
				WHERE t.leagueId = ${request.leagueId}
				${ request.seasonId && !request.seasonId.toString().toLowerCase().includes('all') ? 'AND t.trophyDate BETWEEN \'' + request.seasonId + '-06-01\' AND \'' + (Number(request.seasonId) + 1) + '-06-01\'' : '' }
				GROUP BY 1, s.teamId, s.ownerName
				ORDER BY 1 DESC, ownerName;`;
			return trophySql;
			break;
		}
		case 'getTrophiesByTeam': {
			return `SELECT DISTINCT
				T.teamId,
			    T.trophyDescription,
			    T.trophyDate,
			    CASE 
					WHEN MONTH(trophyDate) < 6 THEN YEAR(trophyDate) - 1
			        ELSE YEAR(trophyDate)
				END AS season
			FROM t_Trophies T
			WHERE T.leagueId = ${request.leagueId}
			${ request.seasonId && !request.seasonId.toString().toLowerCase().includes('all') ? 'AND t.trophyDate BETWEEN \'' + request.seasonId + '-06-01\' AND \'' + (Number(request.seasonId) + 1) + '-06-01\'' : '' }
			ORDER BY teamId, trophyDate;`;
		}
		case 'getTeamPossiblePoints': {
			let sqlStr = `SELECT
				VP.weekNum,
			    VP.teamId,
			    S.teamName,
			    S.ownerName,
			    VP.teamScore,
			    VP.pointsPoss
			FROM v_teamscorepossiblepoints VP
			JOIN t_Standings S ON S.teamId = VP.teamId AND S.seasonId = VP.seasonId AND S.leagueId = VP.leagueId
			WHERE VP.seasonId = ${request.seasonId}
			AND VP.leagueId = ${request.leagueId}`;
			if (request.weekNum && request.weekNum.toString().toLowerCase() != 'all') {
				sqlStr = sqlStr.concat(` AND VP.weekNum IN (${request.weekNum})`);
			}
			sqlStr = sqlStr.concat(` ORDER BY VP.weekNum, VP.pointsPoss DESC;`);
			return sqlStr;
		}
		default: {
			return 'SELECT NOW()';
			break;
		}
	}
};

function getSeasonIdWhereClause (seasonId, tableId = '') {
	let seasonIdSql = '';
	let tableIdentifier = '';
	if (tableId.length > 0) {
		tableIdentifier = `${tableId}.`;
	}
	if (typeof seasonId === 'string') {
		if (seasonId.toLowerCase() !== 'all') {
			seasonIdSql = `AND ${tableIdentifier}seasonId = ${seasonId}`;
		}
	} else {
		seasonIdSql = `AND ${tableIdentifier}seasonId = ${seasonId}`;
	}
	return seasonIdSql;
};
