import XLSX from 'xlsx';
import { PermissionsAndroid } from 'react-native'
import RNFS, { writeFile, readFile } from 'react-native-fs';
import { findSheet, findTable, findTable2, readTable, trim } from './excelFunctions';
import { coupang } from '../mapping/coupang'
import { eleven } from '../mapping/eleven'
import { wemakeprice } from '../mapping/wemakeprice'
import { wms } from '../mapping/wms'


const getFormatDate = (date, delimeter) => {
  var year = date.getFullYear();              //yyyy
  var month = (1 + date.getMonth());          //M
  month = month >= 10 ? month : '0' + month;  //month 두자리로 저장
  var day = date.getDate();                   //d
  day = day >= 10 ? day : '0' + day;          //day 두자리로 저장
  return year + delimeter + month + delimeter + day;

}

const getFormatTime = (date) => {
  var hour = date.getHours();
  if (hour < 10) {
    hour = "0" + hour;
  }
  var minute = date.getMinutes();
  if (minute < 10) {
    minute = "0" + minute;
  }
  var sec = date.getSeconds();
  if (sec < 10) {
    sec = "0" + sec;
  }

  return "" + hour + minute + sec;

}

const converseExcelData = async (items) => {
  return new Promise(async function (resolve, reject) {
    let new_wb = XLSX.utils.book_new();
    console.log("items : ", items)
    console.log("coupang :", coupang)
    let out_datas = [];
    for (let i = 0; i < items.length; i++) {
      let item = items[i];
      if (!item.fileUri) {
        continue;
      }

      const res = await readFile(item.fileUri, 'ascii');
      const workbook = XLSX.read(res, { type: 'binary' });
      // console.log(workbook)
      let ws = workbook.Sheets["Sheet1"];
      let json_data = {}
      if (item.title === "11번가") {
        json_data = eleven
      } else if (item.title === "쿠팡") {
        json_data = coupang
      } else if (item.title === "위메프") {
        json_data = wemakeprice
      }

      let datas = [];
      if (item.title === "11번가") {
        /* skip the first row */
        var range = XLSX.utils.decode_range(ws['!ref']);
        range.s.r = 1; // <-- zero-indexed, so setting to 1 will skip row 0
        ws['!ref'] = XLSX.utils.encode_range(range);

        /* array of arrays of formatted text */
        datas = XLSX.utils.sheet_to_json(ws)
        console.log("ddd : ", datas)
      } else {
        datas = XLSX.utils.sheet_to_json(ws,);
        console.log("ddd : ", datas)
      }
      datas.forEach(data => {
        let tmp_data = {}
        wms.header.forEach(h => {
          if (json_data["mapping"][h].hasOwnProperty("literal")) {
            tmp_data[h] = json_data["mapping"][h]["literal"]
          } else if (json_data["mapping"][h].hasOwnProperty("date")) {
            tmp_data[h] = getFormatDate(new Date(), "-")
          } else if (json_data["mapping"][h].hasOwnProperty("or")) {
            let set_flag = false
            json_data["mapping"][h]["or"].forEach(d => {
              if ((new String(data[d])).length != 0 && set_flag === false) {
                tmp_data[h] = data[d]
                set_flag = true
              }
            })
          } else if (json_data["mapping"][h]) {
            if (h === "주문번호") {
              tmp_data[h] = new String(data[json_data["mapping"][h]])
            } else {
              tmp_data[h] = data[json_data["mapping"][h]]
            }
          } else {
            tmp_data[h] = json_data["mapping"][h]

          }
        })
        out_datas.push(tmp_data)
      })
    }

    console.log("out data : ", out_datas);

    let new_ws = XLSX.utils.json_to_sheet(out_datas, { header: wms["header"] })
    XLSX.utils.book_append_sheet(new_wb, new_ws, 'Sheet1');
    const wbout = XLSX.write(new_wb, { type: 'binary', bookType: "xlsx" });
    console.log("RNFS.TemporaryDirectoryPath : ", RNFS.TemporaryDirectoryPath)


    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: "Permission",
          message: "swahiliPodcast needs to read storage "
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        // On Android, use "RNFS.DocumentDirectoryPath" (MainBundlePath is not defined)
        await RNFS.readDir(RNFS.ExternalStorageDirectoryPath)
        let appFolder = 'AGROUND_WMS'
        let path = RNFS.ExternalStorageDirectoryPath + '/' + appFolder;
        let output_file = "/wms_outputs_" + getFormatDate(new Date(), "") + "_" + getFormatTime(new Date()) + ".xlsx";
        await RNFS.mkdir(path)
        console.log("path : ", path)
        const r = await writeFile(path + output_file, wbout, 'ascii')
        console.log("r : ", r)

      } else {
        console.log(
          "Permission Denied!",
          "You need to give  permission to see contacts"
        );
      }
    } catch (err) {
      console.log(err);
      reject(err)
    }
    resolve()
  })
}

export { converseExcelData }














/*
  const sheetName = "Sheet1"
  let { sheet, range } = findSheet(workbook, sheetName);

  let colData = {};
  let table = {};
  coupang.header.forEach(element => {
    colData[element] = element;
  });

  table = findTable(sheet, range, colData);
  console.log("table : ", table)
  const data = readTable(sheet, sheetName, range, table.columns,
    table.firstRow, null, null, null, null);
  console.log("data : ", data)
  */
