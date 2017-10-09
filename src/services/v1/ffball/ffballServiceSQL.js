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
			return `
				SELECT
					S.teamId,
					S.ownerName,
				    COUNT(trophyDescription) AS Trophies,
				    SUM(CASE 
						WHEN trophyDescription LIKE '%hi%h%score%' THEN 1
				        ELSE 0
					END) AS HighScoreTrophies,
				    SUM(CASE 
						WHEN trophyDescription LIKE '%Last%Man%' THEN 1
				        ELSE 0
					END) AS LastManStandingTrophies,
				    SUM(CASE 
						WHEN trophyDescription LIKE '%League%Champion%' THEN 1
				        ELSE 0
					END) AS ChampionshipTrophies
				FROM t_Trophies T
				JOIN t_Standings S ON T.teamId = S.teamId AND T.leagueId = S.leagueId
				WHERE S.leagueId = ${request.leagueId}
				${getSeasonIdWhereClause(request.seasonId, 'T')}
				GROUP BY S.teamId;`;
			break;
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
