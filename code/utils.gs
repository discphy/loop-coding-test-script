function respond(text) {
  return ContentService.createTextOutput(
    JSON.stringify({ response_type: "ephemeral", text })
  ).setMimeType(ContentService.MimeType.JSON);
}

function formatDate(date, format) {
  const tz = "Asia/Seoul";
  return Utilities.formatDate(date, tz, format);
}

/**
 * 관리자 채널 ID 가져오기
 */
function getAdminChannelId() {
  return PropertiesService.getScriptProperties().getProperty("ADMIN_CHANNEL_ID");
}

/**
 * 관리자 권한 확인
 * @param {string} channelId - Slack 채널 ID
 * @returns {boolean} 관리자 권한 여부
 */
function isAdmin(channelId) {
  const adminChannelId = getAdminChannelId();
  return channelId === adminChannelId;
}