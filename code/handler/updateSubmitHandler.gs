function handleUpdateSubmit(parameters) {
  const user = parameters.user_name;
  const prLink = parameters.text;

  // GitHub PR 링크 유효성 검사
  const githubPrPattern = /^https:\/\/github\.com\/[\w-]+\/[\w-]+\/pull\/\d+$/;
  if (!githubPrPattern.test(prLink)) {
    return respond(Messages.error.invalidPrLink());
  }

  const sheet = getSheet("DAILY"); // ✅ 안전하게 시트 가져오기
  const today = formatDate(new Date(), "yyyy-MM-dd");
  const time = formatDate(new Date(), "HH:mm:ss");

  // 오늘 제출한 이력 찾기
  const data = sheet.getDataRange().getValues();
  let todaySubmissionRow = -1;

  for (let i = 1; i < data.length; i++) { // 헤더 행 제외
    const [date, submittedUser] = data[i];

    // 날짜를 문자열로 통일하여 비교
    const dateStr = date instanceof Date ? formatDate(date, "yyyy-MM-dd") : String(date);

    if (dateStr === today && submittedUser === user) {
      todaySubmissionRow = i + 1; // 실제 시트 행 번호 (1-based)
      break;
    }
  }

  // 오늘 제출한 이력이 없으면 실패
  if (todaySubmissionRow === -1) {
    return respond(Messages.error.noSubmissionToday());
  }

  // 중복 링크 확인 (다른 날짜에 등록한 링크인지)
  for (let i = 1; i < data.length; i++) {
    const [date, submittedUser, submittedLink] = data[i];
    const currentRow = i + 1;

    // 오늘 제출한 행이 아니고, 같은 사용자가 동일한 링크를 등록한 경우
    if (currentRow !== todaySubmissionRow && submittedUser === user && submittedLink === prLink) {
      return respond(Messages.error.duplicateLink());
    }
  }

  // PR 링크와 시간 업데이트
  sheet.getRange(todaySubmissionRow, 3).setValue(prLink); // PR 링크 (3번째 열)
  sheet.getRange(todaySubmissionRow, 4).setValue(time);   // 시간 (4번째 열)

  return respond(Messages.success.updateSubmit(prLink));
}
