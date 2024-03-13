exports.fileError = function (_req, res) {
  return res.status(200).render("index", {
    errorMessageFmt: true,
    errorMessage: "No files uploaded, try again",
  });
};

exports.urlError = function (_req, res) {
  return res.status(200).render("index", {
    errorMessageFmt: true,
    errorMessage: "Invalid url, try again",
  });
};
