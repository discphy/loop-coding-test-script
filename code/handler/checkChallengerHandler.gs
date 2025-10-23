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
    const [registeredUser, registeredAt] = data[i];
    if (registeredUser === user) {
      // 등록일부터 오늘까지의 일수 계산
      const registerDate = new Date(registeredAt);
      const today = new Date();
      const diffTime = today - registerDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1은 등록 당일을 1일차로 계산

      return respond(Messages.success.challengerStatus(diffDays));
    }
  }

  // 챌린저가 아닌 경우
  return respond(Messages.error.notChallenger());
}
