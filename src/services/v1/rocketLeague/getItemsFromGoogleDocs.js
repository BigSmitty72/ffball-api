import axios from 'axios';

export async function getItemsFromGoogleDocs (request) {
	let consoleRanges = '';
	const { googleSheetsUrl, googleSpreadsheet } = request;
	const { consoleRange } = googleSpreadsheet;
  for (var range in consoleRange.range) {
  	consoleRanges = `${consoleRanges}ranges=${consoleRange.sheet}!${consoleRange.range[range]}&`;
  }
  const endpoint = `${googleSheetsUrl}/${googleSpreadsheet.id}/values:batchGet?${consoleRanges}key=${googleSpreadsheet.authKey}`;
  const res = await axios.get(endpoint);
  const xboxRes = await res.data; // JSON.stringify(res.data);

	const fetchTimeout = new Date().getTime() + 90*60*1000; //set timeout for 90 min
	const paints = [];
	const fullItemList = [];
	const itemListVals = [];
	let conversionRate;
  const totalUnitsOptions = [
    {
      unit: 'Heat',
      conversionRate: 1,
      checked: true
    }
  ];

  /* eslint-disable array-callback-return */
  xboxRes.valueRanges[0].values.map((paint) => {
      paints.push(paint[0]);
  });

  // /* eslint-disable array-callback-return */
	xboxRes.valueRanges[1].values.map((crates) => {
    const crateStr = crates[0].replace(/\s/g, '').replace('+', '');
    const index = /[a-z]/i.exec(crateStr).index;
    const crateValRange = crateStr.substring(0, index);
    const crateName = crateStr.replace(crateValRange, '');

	  const crate = crates[0].split(' ');
	  let valuesMaxMin = {minValueH: 0, maxValueH: 0};
	  let crateVal = 0;
	  if (crateValRange.includes('-')) {
	    const values = crateValRange.split('-');
	    crateVal = (Number(values[0]) + Number(values[1])) / 2;
	    valuesMaxMin.maxValueH = Math.round(1 / Number(values[0]) * 1000) / 1000;
	    valuesMaxMin.minValueH = Math.round(1 / Number(values[1]) * 1000) / 1000;
	  } else {
	    crateVal = Number(crateValRange);
	    valuesMaxMin.maxValueH = Math.round(1 / Number(crateValRange) * 1000) / 1000;
	    valuesMaxMin.minValueH = Math.round(1 / Number(crateValRange) * 1000) / 1000;
	  }
	  const crateNameItem = 'Crate - ' + crateName;
	  const paintDisabled = true;
	  if (crateName === 'CC1') {
	    conversionRate = crateVal;
	  }

	  itemListVals.push({name: crateNameItem, paint: 'Non Painted', values: valuesMaxMin, category: 'Crates',paintDisabled});
	  fullItemList.push({name: crateNameItem,category: 'Crates',paintDisabled});

	  totalUnitsOptions.push({unit: crateName, conversionRate: crateVal, checked: false});
	});

	const certifications = getCertTierList(xboxRes.valueRanges[2].values);
	const items = createItemList(googleSpreadsheet, xboxRes, paints, conversionRate, itemListVals, fullItemList);

	let RLData = {};
  const consoleNameReq = request.googleSpreadsheet.consoleRange.consoleName;
	RLData[consoleNameReq] = {
	  certifications,
	  fetchTimeout,
	  paints,
	  totalUnitsOptions,
	  items
	};

	return {
	  RLData
	}
}

function createItemList (googleSpreadsheet, apiRes, paints, conversionRate, itemListVals, fullItemList) {
  const googleRange = googleSpreadsheet.consoleRange.range;
  apiRes.valueRanges.map((ranges) => {
    let category;
    const rangeName = ranges.range.replace(`'XBOX '!`, '');
    switch (rangeName) {
      case googleRange.exoticWheels:
      case googleRange.uncommonWheels:
        category = 'Wheels';
        break;
      case googleRange.paintBodies:
      case googleRange.bodies:
        category = 'Bodies';
        break;
      case googleRange.paintTrails:
      case googleRange.trails:
        category = 'Trails';
        break;
      case googleRange.bmds:
        category = 'Black Market Decals';
        break;
      case googleRange.toppers:
        category = 'Toppers';
        break;
      case googleRange.decals:
        category = 'Decals';
        break;
      case googleRange.paints:
        category = 'Paints';
        break;
      default:
        category = '';
    }

    if (rangeName === googleRange.exoticWheels || rangeName === googleRange.paintBodies || rangeName === googleRange.paintTrails || rangeName === googleRange.decals) {
      const paintDisabled = false;
      for (const i in ranges.values[0]) {
        const name = ranges.values[0][i];
        fullItemList.push({name,category,paintDisabled});
        for (const pi in paints) {
          const paint = paints[pi];
          let valueRange = ranges.values[Number(pi)+1][Number(i)];
          const values = getValueRange(valueRange, conversionRate);
          itemListVals.push({name,paint,values,category,paintDisabled});
        }
      }
    } else if (rangeName === googleRange.bmds || rangeName === googleRange.paints) {
      const paintDisabled = true;
      const paint = 'Non Painted';
      for (const i in ranges.values) {
        const name = ranges.values[i][0];
        let valueRange = ranges.values[i][1];
        if (valueRange.includes('/')) {
          valueRange = valueRange.substr(0, valueRange.indexOf('/'));
        }
        if (name === '20xx' && name.includes('H') === false) {
          valueRange = valueRange.concat('H');
        }
        valueRange = valueRange.replace(/[^0-9H.-]/g, '');
        const values = getValueRange(valueRange, conversionRate);
        fullItemList.push({name,category,paintDisabled});
        itemListVals.push({name,paint,values,category,paintDisabled});
      }
    } else if (rangeName === googleRange.toppers || rangeName === googleRange.uncommonWheels) {
      const paintDisabled = false;
      for (let i = paints.length + 2; i < ranges.values.length; i++) {
        for (const items in ranges.values[i]) {
          const name = ranges.values[i][items];
          if (name !== "") {
            fullItemList.push({name,category,paintDisabled});
          }
          for (const pi in paints) {
            const paint = paints[pi];
            const valueRange = ranges.values[Number(pi) + 1][items];
            const values = getValueRange(valueRange, conversionRate);
            if (name !== "") {
              itemListVals.push({name,paint,values,category,paintDisabled});
            }
          }
        }
      }
    } else if (rangeName === googleRange.bodies || rangeName === googleRange.trails) {
      const paintDisabled = true;
      const paint = 'Non Painted';
      for (const i in ranges.values) {
        if (i % 2 === 1) {
          const valueRange = ranges.values[i][0];
          const name = ranges.values[i - 1][0];
          const values = getValueRange(valueRange, conversionRate);
          fullItemList.push({name,category,paintDisabled});
          itemListVals.push({name,paint,values,category,paintDisabled});
        }
      }
    }
  });
  function compare(a,b) {
    if (a.name < b.name)
      return -1;
    if (a.name > b.name)
      return 1;
    return 0;
  }


  fullItemList.sort(compare);
  return (
    {
      itemListVals: itemListVals,
      fullItemList: fullItemList
    }
  );
}

function getCertTierList (tierTable) {
  let category = '';
  let lessThan = 100;
  let moreThan = 1;
  const certTierList = {};
  const certTierMultiplier = [];

  for (let rowIndex in tierTable) {
    let painted = false;
    if (Number(rowIndex) === 0) {
      for (const tierIndex in tierTable[0]) {
        if (tierIndex > 1) {
          const tier = tierTable[0][tierIndex];
          certTierList[tier] = [];
        }
      }
    }

    if (tierTable[rowIndex][0] !== "") {
      category = tierTable[rowIndex][0];
      if (tierTable[rowIndex][0].toLowerCase().includes('decal')) {
        category = 'Black Market Decals';
      } else if (tierTable[rowIndex][0].toLowerCase().includes('wheels')) {
        category = 'Wheels';
      } else if (tierTable[rowIndex][0].toLowerCase().includes('bodies')) {
        category = 'Bodies';
      } else if (tierTable[rowIndex][0].toLowerCase().includes('trail')) {
        category = 'Trails';
      }

      lessThan = 100;
      if (tierTable[rowIndex][1].includes('>')) {
        moreThan = Number(tierTable[rowIndex][1].replace('>', '').replace('H', ''));
      } else if (tierTable[rowIndex][1].includes('<')) {
        lessThan = Number(tierTable[rowIndex][1].replace('<', '').replace('H', ''));
        moreThan = 0;
      } else {
        if (tierTable[rowIndex][1] === 'painted') {
          painted = true;
        }
        lessThan = 100;
        moreThan = 0;
      }
    } else {
      if (tierTable[rowIndex][1].includes('>')) {
        const nextIndex = Number(rowIndex) + 1;
        if (tierTable[nextIndex][0] === "") {
          lessThan = Number(tierTable[nextIndex][1].replace('>', '').replace('H', ''));
        } else {
          lessThan = 100;
        }
        moreThan = Number(tierTable[rowIndex][1].replace('>', '').replace('H', ''));
      } else {
        lessThan = 100;
        moreThan = 0;
        if (tierTable[rowIndex][1] === 'painted') {
          painted = true;
        }
      }
    }

    if (rowIndex > 0) {
      /* eslint-disable array-callback-return */
      for (const colIndex in tierTable[rowIndex]) {
        if (colIndex > 1) {
          const certTier = tierTable[0][colIndex];
          const multiplier = tierTable[rowIndex][colIndex];
          if (multiplier.includes ('x ') && multiplier !== "") {
            certTierMultiplier.push(
              {
                certTier,
                category,
                multiplier: Number(multiplier.replace('x', '')),
                moreThan,
                lessThan,
                painted
              }
            );
          } else {
            if (multiplier !== "") {
              certTierList[certTier].push(multiplier);
            }
          }
        }
      }
    }
  }
  const certifications = {certTierList, certTierMultiplier};
  return certifications;
}

function getValueRange (valueRange, conversionRate) {
  let values = {minValueH: 0, maxValueH: 0};

  if (valueRange.includes('H')) {
      valueRange = valueRange.replace('H', '').replace('+', '');
      const valuesList = valueRange.split('-');
      values.minValueH = Number(valuesList[0]);
      values.maxValueH = Number(valuesList[0]);
      if (valuesList.length > 1) {
        values.maxValueH = Number(valuesList[1]);
      }
    } else {
      const valuesList = valueRange.split('-');
      values.minValueH = Math.round(Number(valuesList[0]) / conversionRate * 1000) / 1000;
      values.maxValueH = Math.round(Number(valuesList[0]) / conversionRate * 1000) / 1000;
      if (valuesList.length > 1) {
        values.maxValueH = Math.round(Number(valuesList[1]) / conversionRate * 1000) / 1000;
      }
      if (isNaN(values.maxValueH)) {
        values.minValueH = 0;
        values.maxValueH = 0;
      }
    }
    return values;
}
