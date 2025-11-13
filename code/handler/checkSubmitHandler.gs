function handleCheckSubmit(parameters) {
  const user = parameters.user_name;

  const sheet = getSheet("DAILY"); // ✅ 안전하게 시트 가져오기
  const today = formatDate(new Date(), "yyyy-MM-dd");

  // 오늘 제출한 이력 찾기
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) { // 헤더 행 제외
    const [date, submittedUser, submittedLink, submittedTime] = data[i];

    // 날짜를 문자열로 통일하여 비교
    const dateStr = date instanceof Date ? formatDate(date, "yyyy-MM-dd") : String(date);

    if (dateStr === today && submittedUser === user) {
      return respond(Messages.success.checkSubmit(dateStr, submittedTime, submittedLink));
    }
  }

  // 오늘 제출한 이력이 없으면
  return respond(Messages.error.noSubmissionToday());
}
