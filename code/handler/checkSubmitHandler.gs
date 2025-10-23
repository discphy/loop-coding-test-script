function handleCheckSubmit(parameters) {
  const user = parameters.user_name;

  const sheet = getSheet("DAILY"); // ✅ 안전하게 시트 가져오기
  const today = formatDate(new Date(), "yyyy-MM-dd");

  // 오늘 제출한 이력 찾기
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) { // 헤더 행 제외
    const [date, submittedUser, submittedLink, submittedTime] = data[i];
    if (date === today && submittedUser === user) {
      return respond(Messages.success.checkSubmit(date, submittedTime, submittedLink));
    }
  }

  // 오늘 제출한 이력이 없으면
  return respond(Messages.error.noSubmissionToday());
}
