function handleRegister(parameters) {
  const user = parameters.user_name;

  // 챌린저 시트 생성 (존재하지 않을 경우)
  const sheet = ensureSheet(SheetNames.CHALLENGERS);

  // 헤더가 없으면 추가
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["사용자명", "등록일시"]);
  }

  // 이미 등록된 사용자인지 확인
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) { // 헤더 행 제외
    const [registeredUser] = data[i];
    if (registeredUser === user) {
      return respond(Messages.error.alreadyRegistered());
    }
  }

  // 새 챌린저 추가
  const registeredAt = formatDate(new Date(), "yyyy-MM-dd HH:mm:ss");
  sheet.appendRow([user, registeredAt]);

  return respond(Messages.success.register());
}
