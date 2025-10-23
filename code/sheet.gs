/**
 * 📘 루프코테 시트 이름 상수 관리
 * 모든 시트 이름을 한곳에서 관리합니다.
 */
const SheetNames = {
  DAILY: "daily-challenge",        // 🗓️ 코테 제출 기록 시트
  CHALLENGERS: "challengers",      // 🏆 챌린저 명단 시트
  AGGREGATION: "aggregation",      // 📊 일일 전체 집계 시트
  CHALLENGER_STATS: "challenger-stats",  // 📈 챌린저별 통계 시트
};

/**
 * ✅ 시트를 안전하게 가져오는 헬퍼
 * @param {string} name - SheetNames 키 또는 실제 시트명
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = SheetNames[name.toUpperCase()] || name;
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error(`🚨 시트를 찾을 수 없습니다: ${sheetName}`);
  return sheet;
}

/**
 * ✅ 시트 존재 여부 확인
 * @param {string} name - 시트명
 * @returns {boolean}
 */
function hasSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return !!ss.getSheetByName(name);
}

/**
 * ✅ 시트 생성 (존재하지 않을 경우)
 * @param {string} name - 시트명
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function ensureSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  return sheet || ss.insertSheet(name);
}