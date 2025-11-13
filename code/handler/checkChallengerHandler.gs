function handleCheckChallenger(parameters) {
  const user = parameters.user_name;

  // 챌린저 시트 확인
  if (!hasSheet(SheetNames.CHALLENGERS)) {
    return respond(Messages.error.notChallenger());
  }

  const sheet = getSheet(SheetNames.CHALLENGERS);
  const data = sheet.getDataRange().getValues();

  // 챌린저 확인 및 등록일 찾기
  for (let i = 1; i < data.length; i++) { // 헤더 행 제외
    const [registeredUser, slackId, registeredAt] = data[i];
    if (registeredUser === user) {
      // 등록일부터 오늘까지의 일수 계산
      // registeredAt이 문자열일 수도 있고 Date 객체일 수도 있으므로 처리
      const registerDate = registeredAt instanceof Date ? registeredAt : new Date(registeredAt);
      const today = new Date();

      // 날짜만 비교하기 위해 시간 정보 제거 (Asia/Seoul 기준)
      const registerDateOnly = new Date(formatDate(registerDate, "yyyy-MM-dd"));
      const todayOnly = new Date(formatDate(today, "yyyy-MM-dd"));

      const diffTime = todayOnly - registerDateOnly;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1은 등록 당일을 1일차로 계산

      return respond(Messages.success.challengerStatus(diffDays));
    }
  }

  // 챌린저가 아닌 경우
  return respond(Messages.error.notChallenger());
}
