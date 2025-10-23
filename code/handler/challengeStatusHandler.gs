function handleChallengeStatus(parameters) {
  const user = parameters.user_name;

  // 챌린저 시트 확인
  if (!hasSheet(SheetNames.CHALLENGERS)) {
    return respond(Messages.error.notChallenger());
  }

  const challengersSheet = getSheet(SheetNames.CHALLENGERS);
  const challengersData = challengersSheet.getDataRange().getValues();

  // 챌린저인지 확인
  let isChallenger = false;
  for (let i = 1; i < challengersData.length; i++) {
    const [challengerName] = challengersData[i];
    if (challengerName === user) {
      isChallenger = true;
      break;
    }
  }

  if (!isChallenger) {
    return respond(Messages.error.notChallenger());
  }

  // 챌린저 통계 시트 확인
  if (!hasSheet(SheetNames.CHALLENGER_STATS)) {
    return respond(Messages.error.noStatsYet());
  }

  const statsSheet = getSheet(SheetNames.CHALLENGER_STATS);
  const statsData = statsSheet.getDataRange().getValues();

  // 해당 챌린저의 통계 찾기
  for (let i = 1; i < statsData.length; i++) {
    const [challengerName, successCount, missedCount, warnings] = statsData[i];
    if (challengerName === user) {
      return respond(Messages.success.challengeStatus(successCount, warnings));
    }
  }

  // 통계가 아직 없는 경우 (첫 집계 전)
  return respond(Messages.error.noStatsYet());
}
