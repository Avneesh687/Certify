const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const csv = require('csv-parser');
const XLSX = require('xlsx');

/**
 * Parses uploaded CSV or Excel (.xlsx, .xls) file from either Buffer or file path into array of JSON objects
 * @param {Buffer|string} input - File buffer or absolute file path
 * @param {string} originalName - Original filename to determine extension
 * @returns {Promise<Array<Object>>}
 */
const parseFile = async (input, originalName = '') => {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === '.xlsx' || ext === '.xls') {
    return parseExcel(input);
  } else if (ext === '.csv') {
    return parseCSV(input);
  } else {
    // Try excel parser first, if fail try csv
    try {
      return parseExcel(input);
    } catch (e) {
      return parseCSV(input);
    }
  }
};

const parseExcel = (input) => {
  let workbook;
  if (Buffer.isBuffer(input)) {
    workbook = XLSX.read(input, { type: 'buffer' });
  } else {
    workbook = XLSX.readFile(input);
  }

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  return cleanRowKeys(rawData);
};

const parseCSV = (input) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Buffer.isBuffer(input) ? Readable.from(input) : fs.createReadStream(input);

    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve(cleanRowKeys(results));
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

/**
 * Normalizes header keys (removes spaces, trims casing issues)
 */
const cleanRowKeys = (rows) => {
  return rows.map((row) => {
    const cleaned = {};
    for (const key in row) {
      if (Object.prototype.hasOwnProperty.call(row, key)) {
        const cleanKey = key.trim();
        cleaned[cleanKey] = typeof row[key] === 'string' ? row[key].trim() : row[key];
      }
    }
    return cleaned;
  });
};

module.exports = { parseFile, parseCSV, parseExcel };
