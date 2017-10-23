export const capFirstLetter = (str) => {
	return str.replace(/\s\s+/g, ' ').split(' ').map((word) => {
		return word[0].toUpperCase() + word.substr(1);
	}).join(' ');
};

export const compareSort = (fieldName, ascending = true) => {
	return (
		function (a,b) {
			if (a[fieldName] < b[fieldName])
        return (ascending ? -1 : 1);
				// return -1;
			if (a[fieldName] > b[fieldName])
        return (ascending ? 1 : -1);
				// return 1;
			return 0;
		}
	)
};

export const getLeaguePayout = async (request, databaseFF) => {
  let payoutSqlStr = `SELECT payoutType, payoutAmt FROM t_Payout WHERE seasonId = ${request.seasonId} AND leagueId = ${request.leagueId};`;
  if (typeof request.seasonId === 'string') {
    if (request.seasonId.toLowerCase() === 'all') {
      payoutSqlStr = `SELECT payoutType, payoutAmt FROM t_Payout WHERE seasonId = (SELECT MAX(seasonId) FROM t_Payout WHERE leagueId = ${request.leagueId}) 
        AND leagueId = ${request.leagueId};`;
    }
  }
  const payoutRes = await databaseFF.select(payoutSqlStr);
  const payoutAmt = {};
  payoutRes.map((payout) => {
    payoutAmt[payout.payoutType] = payout.payoutAmt;
  });
  return payoutAmt;
};