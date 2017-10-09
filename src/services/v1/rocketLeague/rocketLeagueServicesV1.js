import { DatabaseRL } from '../../../../database';
import { rocketLeagueSQL } from './rocketLeagueSQL';
import { getItemsFromGoogleDocs } from './getItemsFromGoogleDocs';
import { addFullItemList, addItemVals } from './addItemHistory';

const sqlConfigRL = {
  DB_SQL_URL: process.env.DB_SQL_URL || 'jdbc:mysql://localhost/RocketLeague',
  DB_SQL_USERNAME: process.env.DB_SQL_USERNAME || 'ffballuser',
  DB_SQL_PASSWORD: process.env.DB_SQL_PASSWORD || 'P@ssword!',
  DB_SQL_OPTIONS: null
};
const databaseRL = new DatabaseRL(sqlConfigRL);

const rocketLeagueServicesV1 = {
  async addItemHistory (request, callback) {
  	const itemCategories = await databaseRL.select('SELECT * FROM ItemCategories;');
  	const itemPaints = await databaseRL.select('SELECT * FROM Paints;');
  	const itemList = await getItemsFromGoogleDocs(request);
  	const consoleName = await request.googleSpreadsheet.consoleRange.consoleName;
  	const consoleId = await databaseRL.selectOne(`SELECT ConsoleId FROM Console WHERE ConsoleName = '${consoleName}';`);
  	const fullItemList = await itemList.RLData[consoleName].items.fullItemList;
  	const itemListVals = await itemList.RLData[consoleName].items.itemListVals;

  	// ADD FULL ITEM LIST
  	const addedItemsRes = await addFullItemList(itemCategories, fullItemList, databaseRL);

  	// ADD ITEM LIST VALS
  	const dbItemList = await databaseRL.select('SELECT ItemId AS itemId, ItemName AS itemName FROM FullItemList;');
  	const addedItemValsRes = await addItemVals(itemListVals, itemPaints, dbItemList, consoleId, databaseRL);

  	return {
  		addedItems: addedItemsRes,
  		addedItemValues: addedItemValsRes
  	};
  },
  getItemList (request) {
  	let res;
  	try {
  		res = getItemsFromGoogleDocs(request);
  	} catch(err) {
  		console.log(err);
  		//TRY FROM DB
  	}
  	return res;
  },
  async getGoogleSpreadsheet (request) {
  	const sqlStr = `SELECT ConsoleName, GoogleSheetsUrl, AuthKey, ID, Colors, Crates, CertMultiplier, ExoticWheels, UncommonWheels, 
			Decals, PaintBodies, PaintTrails, Toppers, Bmds, Bodies, Trails, Paints
		FROM RocketLeagueGoogleSpreadsheet WHERE ConsoleName = '${request.consoleName}';`

  	const googleSpreadsheet = await databaseRL.selectOne(sqlStr);
  	let sheetName;
  	if (request.consoleName === 'Xbox') {
  		sheetName = "'XBOX '";
  	} else {
  		sheetName = request.consoleName;
  	}

  	const googleSpreadsheetRes = await {
  		googleSheetsUrl: googleSpreadsheet.GoogleSheetsUrl,
  		googleSpreadsheet: {
  			authKey: googleSpreadsheet.AuthKey,
  			id: googleSpreadsheet.ID,
  			consoleRange: {
  				consoleName: request.consoleName,
  				sheet: sheetName,
  				range: {
  					colors: googleSpreadsheet.Colors,
  					crates: googleSpreadsheet.Crates,
  					certMultiplier: googleSpreadsheet.CertMultiplier,
	                exoticWheels: googleSpreadsheet.ExoticWheels,
	                uncommonWheels: googleSpreadsheet.UncommonWheels,
	                decals: googleSpreadsheet.Decals,
	                paintBodies: googleSpreadsheet.PaintBodies,
	                paintTrails: googleSpreadsheet.PaintTrails,
	                toppers: googleSpreadsheet.Toppers,
	                bmds: googleSpreadsheet.Bmds,
	                bodies: googleSpreadsheet.Bodies,
	                trails: googleSpreadsheet.Trails,
	                paints: googleSpreadsheet.Paints
  				}
  			}
  		}
  	};

  	return googleSpreadsheetRes;
  }
}

export default rocketLeagueServicesV1;
