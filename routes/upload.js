const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

function logError(filePath, msg, code, res) {
  fs.writeFile(path.join(filePath, "error.txt"), msg, (err) => {
    err && console.log(err);
  });
  return res.status(400).render("index", {
    content: `child process exited with code ${code}`,
    errorMessage: "\n" + msg,
  });
}

exports.fileUpload = function (req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).redirect("/upload-file-error");
  }

  const uid = randomUUID();
  const uidPath = path.join(__dirname, "..", "data", uid);
  const ipynb = req.files.ipynb;
  const fileName = path.parse(ipynb.name).name;

  fs.mkdir(uidPath, (err) => {
    if (err)
      return res.status(500).render("index", {
        content: "server mkdir error",
        errorMessage: JSON.stringify(e),
      });
  });

  ipynb.mv(path.join(uidPath, ipynb.name), (err) => {
    if (err) {
      fs.writeFile(
        path.join(uidPath, "error.txt"),
        "server mv error",
        (err) => err && console.log(err),
      );
      return res.status(500).render("index", { content: "server mv error" });
    }

    const ipynbToPdf = spawn("jupyter", [
      "nbconvert",
      "--to",
      "pdf",
      path.join(uidPath, ipynb.name),
      `--output-dir=${uidPath}`,
    ]);

    let errorLog = [];
    ipynbToPdf.stderr.on("data", (data) => errorLog.push(data));
    ipynbToPdf.on("close", (code) => {
      if (code === 0) {
        res.status(301).redirect(`/download/${uid}/${fileName}`);
      } else {
        const errorMsg = errorLog.slice(1).join("");
        logError(uidPath, errorMsg, code, res);
      }
    });
  });
};

exports.urlUpload = function (req, res) {
  if (!req.body.gdown) {
    return res.status(400).redirect("/upload-url-error");
  }

  const uid = randomUUID();
  const uidPath = path.join(__dirname, "..", "data", uid);

  fs.mkdir(uidPath, (err) => {
    if (err)
      return res.status(500).render("index", {
        content: "server mkdir error",
        errorMessageFmt: true,
        errorMessage: JSON.stringify(err),
      });
  });

  const url = req.body.gdown.split("/").pop();
  if (!url) {
    return res.status(400).redirect("/upload-url-error");
  }

  const urlToIpynb = spawn("gdown", [url, "-O", uidPath + "/"]);

  let errorMsg = "";
  urlToIpynb.stderr.on("data", (data) => (errorMsg += data));
  urlToIpynb.on("close", (code) => {
    if (code !== 0) {
      return logError(uidPath, errorMsg, code, res);
    }

    let ipynb = undefined;

    fs.readdir(uidPath, (err, files) => {
      if (err)
        return res.status(500).render("index", {
          content: "server readdir error",
          errorMessage: JSON.stringify(err),
        });

      files.forEach((file) => {
        if (file.endsWith(".ipynb")) ipynb = file;
      });

      if (ipynb === undefined) {
        return res.status(301).redirect("/upload-url-error");
      }
      const fileName = path.parse(ipynb).name;

      const ipynbToPdf = spawn("jupyter", [
        "nbconvert",
        "--to",
        "pdf",
        path.join(uidPath, ipynb),
        `--output-dir=${uidPath}`,
      ]);

      let errorMsg = "";
      ipynbToPdf.stderr.on("data", (data) => (errorMsg += data));
      ipynbToPdf.on("close", (code) => {
        code === 0
          ? res.status(301).redirect(`/download/${uid}/${fileName}`)
          : logError(uidPath, errorMsg, code, res);
      });
    });
  });
};
