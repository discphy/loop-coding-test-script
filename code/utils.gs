function respond(text) {
  return ContentService.createTextOutput(
    JSON.stringify({ response_type: "ephemeral", text })
  ).setMimeType(ContentService.MimeType.JSON);
}

function formatDate(date, format) {
  const tz = "Asia/Seoul";
  return Utilities.formatDate(date, tz, format);
}