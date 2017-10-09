import { rocketLeagueSQL } from './rocketLeagueSQL';

export async function addFullItemList (itemCategories, fullItemList, databaseRL) {
	const addedItemsRes = [];

  	for (const i in fullItemList) {
  		const item = fullItemList[i];
  		const categoryIndex = itemCategories.map(function(category) {
		  return category.CategoryName;
		}).indexOf(item.category);
  		const categoryId = itemCategories[categoryIndex].CategoryId;
  		const itemVal = {
  			itemName: item.name,
  			categoryId: categoryId,
  			paintDisabled: item.paintDisabled
  		};

  		try {
  			const sqlStr = await rocketLeagueSQL(itemVal, 'addItemHistory');
	  		const resItemId = await databaseRL.insert(sqlStr);
	  		if (resItemId > 0) {
	  			addedItemsRes.push(Object.assign({}, itemVal, {itemId: resItemId}));
	  		}
	  		if (resItemId > 0) {
	  			const newItem = Object.assign({}, itemVal, {itemId: resItemId});
	  		}
	  	} catch(err) {
	  		console.log(err.message);
	  	}
  	}
  	return addedItemsRes;
};

export async function addItemVals (itemListVals, itemPaints, dbItemList, consoleId, databaseRL) {
	let addedItemValsCount = 0;
  	for (const i in itemListVals) {
  		const item = itemListVals[i];
  		const itemIndex = dbItemList.map(function(item) {
		  return item.itemName;
		}).indexOf(item.name);

		const paintIndex = itemPaints.map(function(paint) {
		  return paint.PaintName;
		}).indexOf(item.paint);

		const itemPaintId = itemPaints[paintIndex].PaintId;

		if (itemIndex >= 0) {
			const itemId = dbItemList[itemIndex].itemId;			
			const itemVal = {
	  			itemId,
	  			paintId: itemPaintId,
	  			minValueH: item.values.minValueH,
	  			maxValueH: item.values.maxValueH,
	  			consoleId: consoleId.ConsoleId
	  		};
	  		try {
	  			const sqlStr = await rocketLeagueSQL(itemVal, 'addItemValsHistory');
		  		const resItemId = await databaseRL.insert(sqlStr);
		  		if (resItemId > 0) {
		  			addedItemValsCount++;
		  		}
		  	} catch(err) {
		  		console.log(err.message);
		  	}
		}
  	}
  	return addedItemValsCount;
}