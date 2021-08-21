import _ from 'lodash';
import XLSX from 'xlsx';

const dc = XLSX.utils.decode_cell,
  ec = (r, c) => { return XLSX.utils.encode_cell({ r: r, c: c }); };

/**
 * Find a sheet in the workbook by name, and return an object with keys
 * `sheet` and `range`, where `range` is an object describing the valid cells
 * of the sheet, like `{min: {r: 1, c: 1}, max: {r: 5, c:5}}`.
 */
export function findSheet(workbook, sheetName) {
  let sheet = workbook.Sheets[sheetName],
    range = { min: { r: 0, c: 0 }, max: { r: 0, c: 0 } };

  if (!sheet) {
    return { sheet: null, range: null };
  }

  // find size of the sheet
  let ref = sheet['!ref'];

  if (!ref && ref.indexOf(':') === -1) {
    throw new Error("Malformed workbook - no !ref property");
  }

  range.min = dc(ref.split(':')[0]);
  range.max = dc(ref.split(':')[1]);

  return { sheet, range };
}
export function trim(value) {
  value = value.replace(/(\s*)/g, "");//모든 공백제거
  value = value.replace(/\n/g, "");//행바꿈제거
  value = value.replace(/\r/g, "");//엔터제거
  return value;
}
/**
 * Find the start position of a table in the given sheet. `colMap` describes
 * the table columns as an object with key prop -> column title. Returns an
 * object with keys `columns` (maps prop -> 0-indexed column number) and
 * `firstRow`, the number of the first row of the table (will be `null`) if the
 * table was not found.
 */
// colMap: prop -> col name
export function findTable(sheet, range, colMap) {
  let firstRow = null,
    colsToFind = _.keys(colMap).length,

    // colmap lowercase title -> prop
    colLookup = _.reduce(colMap, (m, v, k) => {
      //m[_.isString(v)? v.toLowerCase() : v] = k; return m; }, {}),
      m[_.isString(v) ? trim(v) : v] = k; return m;
    }, {}),


    // colmap props -> 0-indexed column
    columns = _.reduce(colMap, (m, v, k) => {
      m[k] = null; return m;
    }, {});
  // Look for header row and extract columns
  for (let r = range.min.r; r <= range.max.r - 1; ++r) {
    let colsFound = 0;

    for (let c = range.min.c; c <= range.max.c; ++c) {
      let cell = sheet[ec(r, c)];

      if (cell && cell.v !== undefined) {
        //let prop = colLookup[cell.t === 's'? cell.v.toLowerCase() : cell.v];
        let prop = colLookup[cell.t === 's' ? trim(cell.v) : cell.v];
        if (prop) {
          columns[prop] = c;
          ++colsFound;
        }
      }
    }

    if (colsFound === colsToFind) {
      firstRow = r + 1;
      break;
    }
  }

  return { columns, firstRow };
}

export function findTable2(sheet, range, colMap) {
  let firstRow = null,
    colsToFind = _.keys(colMap).length,

    // colmap lowercase title -> prop
    colLookup = _.reduce(colMap, (m, v, k) => {
      //m[_.isString(v)? v.toLowerCase() : v] = k; return m; }, {}),
      m[_.isString(v) ? trim(v) : v] = k; return m;
    }, {}),


    // colmap props -> 0-indexed column
    columns = _.reduce(colMap, (m, v, k) => {
      m[k] = null; return m;
    }, {});
  console.log("columns : ", columns);
  console.log("colLookup : ", colLookup);
  // Look for header row and extract columns
  for (let r = range.min.r; r <= range.max.r - 1; ++r) {
    let colsFound = 0;

    for (let c = range.min.c; c <= range.max.c; ++c) {
      let cell = sheet[ec(r, c)];

      if (cell && cell.v !== undefined) {
        //let prop = colLookup[cell.t === 's'? cell.v.toLowerCase() : cell.v];
        let prop = colLookup[cell.t === 's' ? trim(cell.v) : cell.v];
        if (prop) {
          columns[prop] = c;
          ++colsFound;
        } else if (colsFound > 0) {
          columns[cell.v] = c;
        }
      }
    }

    if (colsFound === colsToFind) {
      firstRow = r + 1;
      break;
    }
  }

  return { columns, firstRow };
}

/**
 * Given the `cols` and `firstRow` as returned by `findTable()`, return a list
 * of objects of all table values. Continues to the end of the sheet unless
 * passed a function `stop` that takes a mapped row object as an argument and
 * returns `true` for that row.
 */
export function readTable(sheet, sheetName, range, columns, firstRow, header, neccessary, errors, stop) {
  let data = [];
  let isStop = false;
  for (let r = firstRow; r <= range.max.r; ++r) {
    let canSkip = true;
    let row = _.reduce(columns, (m, c, k) => {
      let cell = sheet[ec(r, c)];
      //m[k] = cell? cell.v : null;
      m[k] = cell ? cell.v : "";
      if (cell && cell.v) {
        //   console.log("m, c, k : ", m,c,k, neccessary)
        if (cell.v === "항목선택") { // 추후에 수정 필요
          m[k] = "";
          canSkip = true;
        } else {
          canSkip = false;
        }
        // 테이블 데이터 중에서 공백으로 되어 있는 데이터가 들어오면 공백 제거
        if (/\S/.test(cell.v) === false) {
          m[k] = "";
        }
      }
      return m;
    }, {});


    if (stop && stop(row)) {
      isStop = true;
      break;
    }
    if (canSkip) {
    } else {
      data.push(row);
    }
  }
  if (!isStop) {
    //errors.data.push(sheetName + " - " + "테이블끝이 없습니다." );
  }
  return data;
}

/**
 * Turn an Excel numeric date into a JavaScript Date object.
 */
export function convertExcelDate(excelDate) {
  return new Date((excelDate - (25569)) * 86400 * 1000);
}

/**
 * Turn a JavaScript Date into an Excel numeric date
 */
export function toExcelDate(jsDate) {
  return Number((jsDate.getTime() / (1000 * 60 * 60 * 24)) + 25569)
}