function handleSubmit(parameters) {
  const user = parameters.user_name;
  const prLink = parameters.text;

  // GitHub PR 링크 유효성 검사
  const githubPrPattern = /^https:\/\/github\.com\/[\w-]+\/[\w-]+\/pull\/\d+$/;
  if (!githubPrPattern.test(prLink)) {
    return respond(Messages.error.invalidPrLink());
  }

  const sheet = getSheet("DAILY"); // ✅ 안전하게 시트 가져오기
  const today = formatDate(new Date(), "yyyy-MM-dd");

  // 오늘 이미 제출했는지 확인 & PR 링크 중복 확인
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) { // 헤더 행 제외
    const [date, submittedUser, submittedLink] = data[i];

    // 오늘 이미 제출한 경우
    if (date === today && submittedUser === user) {
      return respond(Messages.error.alreadySubmitted());
    }

    // 해당 사용자가 동일한 PR 링크를 이미 등록한 경우
    if (submittedUser === user && submittedLink === prLink) {
      return respond(Messages.error.duplicateLink());
    }
  }

  const time = formatDate(new Date(), "HH:mm:ss");
  sheet.appendRow([today, user, prLink, time]);
  return respond(Messages.success.submit(prLink));
}