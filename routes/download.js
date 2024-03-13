const path = require("path");

exports.downloadPdf = function (req, res) {
  if (!req.params.uid || !req.params.fileName) {
    return res.status(500).render("index", { content: "invalid path params" });
  }

  return (({ uid, fileName }) => {
    return res.download(
      path.join(__dirname, "..", "data", uid, `${fileName}.pdf`),
    );
  })(req.params);
};
