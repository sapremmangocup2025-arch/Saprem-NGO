exports.normalizeCloudinaryUrl = (url) => {
  if (!url) return "";

  // Fix PDF delivery URLs
  if (url.endsWith(".pdf")) {
    return url.replace("/image/upload/", "/raw/upload/");
  }

  return url; // images stay unchanged
};
