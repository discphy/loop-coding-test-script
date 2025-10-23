const Messages = {
  success: {
    submit: (prLink) =>
      `✅ *코테 제출 완료!*\n📎 ${prLink}`,

    updateSubmit: (prLink) =>
      `✏️ *코테 제출 수정 완료!*\n📎 ${prLink}`,

    checkSubmit: (date, time, prLink) =>
      `📋 *제출 이력 확인*\n🕒 ${date} ${time}에\n📎 ${prLink}가 제출되었습니다.`,

    register: () =>
      `🎉 *코테 챌린지 참여 완료!*\n매일 코딩 테스트를 제출해주세요!`,

    challengerStatus: (days) =>
      `🏆 *챌린지 ${days}일차입니다!*\n오늘도 화이팅하세요! 💪`,

    challengeStatus: (successCount, warnings) =>
      `📊 *나의 챌린지 현황*\n✅ 성공: ${successCount}회\n⚠️ 경고: ${warnings}회`,

    report: (today, submitted, missing) => {
      const sub = submitted.length ? submitted.join(", ") : "없음";
      const miss = missing.length ? missing.join(", ") : "없음";
      return [
        `📅 *${today} 코테 챌린지 현황*`,
        `✅ *제출:* ${sub}`,
        `⚠️ *미제출:* ${miss}`
      ].join("\n");
    }
  },

  error: {
    invalidPrLink: () =>
      `❌ *올바른 GitHub PR 링크를 입력해주세요!*\n예시: https://github.com/org/repo/pull/123`,

    alreadySubmitted: () =>
      `⚠️ *오늘 이미 제출하셨습니다!*`,

    noSubmissionToday: () =>
      `⚠️ *오늘 제출한 이력이 없습니다!*\n먼저 \`/코테제출\` 명령어로 제출해주세요.`,

    duplicateLink: () =>
      `❌ *이미 등록한 PR 링크입니다!*`,

    alreadyRegistered: () =>
      `⚠️ *이미 챌린지에 참여 중입니다!*`,

    notChallenger: () =>
      `📢 *아직 챌린지에 참여하지 않으셨습니다!*\n\`/코테챌린지참여\` 명령어로 지금 바로 참여하세요! 🚀`,

    noStatsYet: () =>
      `📊 *아직 통계가 없습니다!*\n첫 집계는 챌린지 참여 후 다음 날부터 시작됩니다.`,

    unknownCommand: (command) =>
      `🤔 알 수 없는 명령어입니다: *${command}*`,

    noPermission: () =>
      `🚫 이 명령을 수행할 권한이 없습니다.`
  },

  webhook: {
    dailySummary: (successCount, missedCount) =>
      `오늘 하루도 고생하셨습니다. ${successCount}명 챌린지 완료 ✅, ${missedCount}명 챌린지 실패 ❌`,

    warningNotification: (challengerName, warnings) =>
      `⚠️ *퇴출 필요* | ${challengerName}님 경고 ${warnings}회로 퇴출이 필요합니다.`
  }
};