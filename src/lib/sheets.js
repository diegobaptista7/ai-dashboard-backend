const SPREADSHEET_ID = '1PahFAefYaXhM49BY6rn15JvVDXyGT8pE7idc_lfb91w';

/**
 * Fetches data from a specific tab (sheet) in the Google Spreadsheet using GViz API.
 * Returns an array of row objects where keys match the column headers.
 */
export async function fetchSheetData(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error fetching sheet "${sheetName}": status ${response.status}`);
  }
  
  const text = await response.text();
  const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
  if (!jsonMatch) {
    throw new Error(`Invalid response format from Google Sheets for "${sheetName}"`);
  }
  
  const json = JSON.parse(jsonMatch[1]);
  if (json.status === 'error') {
    const errorMsg = json.errors?.[0]?.detailed_message || json.errors?.[0]?.message || 'Unknown error';
    throw new Error(`Google Sheets error (${sheetName}): ${errorMsg}`);
  }
  
  const table = json.table;
  if (!table || !table.cols || !table.rows) {
    return [];
  }
  
  // Extract column headers (prefer label, fallback to id)
  const cols = table.cols.map((c, i) => (c.label && c.label.trim()) ? c.label.trim() : c.id || `col_${i}`);
  
  // Map rows to clean JavaScript objects
  return table.rows.map(row => {
    const rowObj = {};
    if (row.c) {
      row.c.forEach((cell, idx) => {
        const key = cols[idx];
        if (key) {
          rowObj[key] = cell && cell.v !== undefined && cell.v !== null ? cell.v : '';
        }
      });
    }
    return rowObj;
  });
}
