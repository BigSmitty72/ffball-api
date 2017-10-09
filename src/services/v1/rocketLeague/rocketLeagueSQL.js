export function rocketLeagueSQL (request, service) {
	switch (service) {
		case 'addItemHistory': {
			return `INSERT INTO FullItemList (ItemName, CategoryId, PaintDisabled, DateAdded)
				SELECT '${request.itemName}', ${request.categoryId}, ${request.paintDisabled}, NOW() WHERE NOT EXISTS (
					SELECT ItemName FROM FullItemList WHERE ItemName = '${request.itemName}' LIMIT 1
				);`;
			break;
		}
		case 'addItemValsHistory': {
			return `INSERT INTO ItemListVals (ItemId, PaintId, MinVal, MaxVal, ConsoleId, DateAdded)
 				SELECT ${request.itemId}, ${request.paintId}, ${request.minValueH}, ${request.maxValueH}, ${request.consoleId}, NOW() WHERE NOT EXISTS (
					SELECT ItemId FROM ItemListVals 
	                    WHERE ItemId = ${request.itemId}
	                    AND PaintId = ${request.paintId}
	                    AND MinVal = ${request.minValueH}
	                    AND MaxVal = ${request.maxValueH}
	                    AND ConsoleId = ${request.consoleId}
	                    LIMIT 1
				);`;
			break;
		}
		default: {
			return 'SELECT NOW()';
			break;
		}
	}
};
