/**
 * 📊 매일 00:00에 실행되는 일일 집계 스케줄러
 * 챌린지 참여자들의 성공/미참여 수를 집계하고, 경고를 누적합니다.
 *
 * 트리거 설정 방법:
 * 1. Apps Script 편집기에서 "트리거" 메뉴 선택
 * 2. "트리거 추가" 클릭
 * 3. 실행할 함수: runDailyAggregation
 * 4. 이벤트 소스: 시간 기반
 * 5. 시간 기반 트리거 유형: 일 타이머
 * 6. 시간 선택: 자정~오전 1시
 */

// ⚠️ 경고 누적 임계값 (이 값을 초과하면 퇴출)
const MAX_WARNINGS = 2;

function runDailyAggregation() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const targetDate = formatDate(yesterday, "yyyy-MM-dd");

  // 집계 시트 생성 또는 가져오기
  const aggregationSheet = ensureSheet(SheetNames.AGGREGATION);

  // 헤더가 없으면 추가
  if (aggregationSheet.getLastRow() === 0) {
    aggregationSheet.appendRow(["날짜", "챌린저 수", "제출 성공", "미제출", "성공률(%)"]);
  }

  // 챌린저 시트 확인
  if (!hasSheet(SheetNames.CHALLENGERS)) {
    Logger.log("챌린저 시트가 없습니다.");
    return;
  }

  const challengersSheet = getSheet(SheetNames.CHALLENGERS);
  const challengersData = challengersSheet.getDataRange().getValues();

  // 챌린저 목록 추출 (헤더 제외)
  const challengers = [];
  for (let i = 1; i < challengersData.length; i++) {
    const [userName, registeredAt] = challengersData[i];

    // 등록일이 집계 대상 날짜보다 이전이거나 같은 경우만 포함
    const registerDate = new Date(registeredAt);
    const targetDateObj = new Date(targetDate);

    if (registerDate <= targetDateObj) {
      challengers.push(userName);
    }
  }

  if (challengers.length === 0) {
    Logger.log("집계 대상 챌린저가 없습니다.");
    return;
  }

  // 일일 제출 기록 확인
  const dailySheet = getSheet(SheetNames.DAILY);
  const dailyData = dailySheet.getDataRange().getValues();

  // 해당 날짜에 제출한 사용자 목록
  const submitted = new Set();
  for (let i = 1; i < dailyData.length; i++) {
    const [date, userName] = dailyData[i];
    if (date === targetDate) {
      submitted.add(userName);
    }
  }

  // 집계 계산
  const totalChallengers = challengers.length;
  const successCount = challengers.filter(user => submitted.has(user)).length;
  const missedCount = totalChallengers - successCount;
  const successRate = totalChallengers > 0
    ? ((successCount / totalChallengers) * 100).toFixed(2)
    : "0.00";

  // 집계 결과 저장
  aggregationSheet.appendRow([
    targetDate,
    totalChallengers,
    successCount,
    missedCount,
    successRate
  ]);

  // 챌린저별 통계 업데이트 및 경고 누적
  updateChallengerStats(targetDate, challengers, submitted);

  // Slack 채널에 집계 결과 전송
  sendSlackNotification(Messages.webhook.dailySummary(successCount, missedCount));

  Logger.log(`${targetDate} 집계 완료: 챌린저 ${totalChallengers}명, 성공 ${successCount}명, 미제출 ${missedCount}명, 성공률 ${successRate}%`);
}

/**
 * 📈 챌린저별 통계 업데이트 및 경고 누적
 * @param {string} date - 집계 날짜
 * @param {Array<string>} challengers - 챌린저 목록
 * @param {Set<string>} submitted - 제출한 사용자 Set
 */
function updateChallengerStats(date, challengers, submitted) {
  const challengerStatsSheet = ensureSheet(SheetNames.CHALLENGER_STATS);

  // 헤더가 없으면 추가
  if (challengerStatsSheet.getLastRow() === 0) {
    challengerStatsSheet.appendRow([
      "챌린저명",
      "총 제출 성공",
      "총 미제출",
      "누적 경고",
      "상태",
      "마지막 업데이트"
    ]);
  }

  const data = challengerStatsSheet.getDataRange().getValues();
  const challengerStatsMap = new Map();

  // 기존 통계 데이터 로드
  for (let i = 1; i < data.length; i++) {
    const [challengerName, successCount, missedCount, warnings, status] = data[i];
    challengerStatsMap.set(challengerName, {
      row: i + 1,
      successCount: successCount || 0,
      missedCount: missedCount || 0,
      warnings: warnings || 0,
      status: status || "활성"
    });
  }

  // 챌린저별 통계 업데이트
  challengers.forEach(challengerName => {
    const isSubmitted = submitted.has(challengerName);
    const stats = challengerStatsMap.get(challengerName) || {
      row: null,
      successCount: 0,
      missedCount: 0,
      warnings: 0,
      status: "활성"
    };

    // 제출 여부에 따라 통계 업데이트
    if (isSubmitted) {
      stats.successCount += 1;
    } else {
      stats.missedCount += 1;
      stats.warnings += 1; // 미제출 시 경고 누적
    }

    // 경고 임계값 초과 시 관리자에게 알림
    if (stats.warnings > MAX_WARNINGS && stats.status === "활성") {
      sendManageNotification(Messages.webhook.warningNotification(challengerName, stats.warnings));
      Logger.log(`⚠️ ${challengerName} 챌린저 경고 ${stats.warnings}회 - 관리자에게 알림 전송`);
    }

    const now = formatDate(new Date(), "yyyy-MM-dd HH:mm:ss");

    // 기존 행 업데이트 또는 새 행 추가
    if (stats.row) {
      challengerStatsSheet.getRange(stats.row, 2).setValue(stats.successCount);
      challengerStatsSheet.getRange(stats.row, 3).setValue(stats.missedCount);
      challengerStatsSheet.getRange(stats.row, 4).setValue(stats.warnings);
      challengerStatsSheet.getRange(stats.row, 5).setValue(stats.status);
      challengerStatsSheet.getRange(stats.row, 6).setValue(now);
    } else {
      challengerStatsSheet.appendRow([
        challengerName,
        stats.successCount,
        stats.missedCount,
        stats.warnings,
        stats.status,
        now
      ]);
    }

    challengerStatsMap.set(challengerName, stats);
  });
}

/**
 * 🚫 챌린저 시트에서 사용자 제거 (퇴출)
 * @param {string} userName - 제거할 사용자명
 */
function removeFromChallengers(userName) {
  if (!hasSheet(SheetNames.CHALLENGERS)) {
    return;
  }

  const sheet = getSheet(SheetNames.CHALLENGERS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const [registeredUser] = data[i];
    if (registeredUser === userName) {
      sheet.deleteRow(i + 1);
      Logger.log(`${userName} 챌린저에서 제거됨`);
      return;
    }
  }
}

/**
 * 🧪 테스트용: 특정 날짜의 집계를 실행
 * @param {string} dateString - 집계할 날짜 (yyyy-MM-dd)
 */
function testDailyAggregation(dateString) {
  if (!dateString) {
    dateString = formatDate(new Date(), "yyyy-MM-dd");
  }

  const targetDate = dateString;

  // 집계 시트 생성 또는 가져오기
  const aggregationSheet = ensureSheet(SheetNames.AGGREGATION);

  // 헤더가 없으면 추가
  if (aggregationSheet.getLastRow() === 0) {
    aggregationSheet.appendRow(["날짜", "챌린저 수", "제출 성공", "미제출", "성공률(%)"]);
  }

  // 챌린저 시트 확인
  if (!hasSheet(SheetNames.CHALLENGERS)) {
    Logger.log("챌린저 시트가 없습니다.");
    return;
  }

  const challengersSheet = getSheet(SheetNames.CHALLENGERS);
  const challengersData = challengersSheet.getDataRange().getValues();

  // 챌린저 목록 추출 (헤더 제외)
  const challengers = [];
  for (let i = 1; i < challengersData.length; i++) {
    const [userName, registeredAt] = challengersData[i];

    // 등록일이 집계 대상 날짜보다 이전이거나 같은 경우만 포함
    const registerDate = new Date(registeredAt);
    const targetDateObj = new Date(targetDate);

    if (registerDate <= targetDateObj) {
      challengers.push(userName);
    }
  }

  if (challengers.length === 0) {
    Logger.log("집계 대상 챌린저가 없습니다.");
    return;
  }

  // 일일 제출 기록 확인
  const dailySheet = getSheet(SheetNames.DAILY);
  const dailyData = dailySheet.getDataRange().getValues();

  // 해당 날짜에 제출한 사용자 목록
  const submitted = new Set();
  for (let i = 1; i < dailyData.length; i++) {
    const [date, userName] = dailyData[i];
    if (date === targetDate) {
      submitted.add(userName);
    }
  }

  // 집계 계산
  const totalChallengers = challengers.length;
  const successCount = challengers.filter(user => submitted.has(user)).length;
  const missedCount = totalChallengers - successCount;
  const successRate = totalChallengers > 0
    ? ((successCount / totalChallengers) * 100).toFixed(2)
    : "0.00";

  // 집계 결과 저장
  aggregationSheet.appendRow([
    targetDate,
    totalChallengers,
    successCount,
    missedCount,
    successRate
  ]);

  // 챌린저별 통계 업데이트 및 경고 누적
  updateChallengerStats(targetDate, challengers, submitted);

  Logger.log(`${targetDate} 집계 완료: 챌린저 ${totalChallengers}명, 성공 ${successCount}명, 미제출 ${missedCount}명, 성공률 ${successRate}%`);
}
