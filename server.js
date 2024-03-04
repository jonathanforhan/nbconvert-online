const express = require("express");
const http = require("http");
const https = require("https");
const fileUpload = require("express-fileupload");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const app = express();

require("dotenv").config();
const key_loc = process.env.KEY;
const cert_loc = process.env.CERT;

const options = {
  key: fs.readFileSync(key_loc, "utf8"),
  cert: fs.readFileSync(cert_loc, "utf8"),
};

app.use(fileUpload());
app.set("view engine", "ejs");

app.get("/", (_req, res) => {
  res.status(200).render("index");
});

app.post("/upload", (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res
      .status(400)
      .render("index", { content: "no files uploaded, try again." });
  }

  const ipynb = req.files.ipynb;
  const uid = randomUUID();
  const uidPath = path.join(__dirname, "data", uid);
  const fileName = path.parse(ipynb.name).name;

  try {
    fs.mkdirSync(uidPath);
  } catch (e) {
    return res.status(500).render("index", {
      content: "server mkdir error",
      errorMessage: JSON.stringify(e),
    });
  }

  ipynb.mv(path.join(uidPath, ipynb.name), (err) => {
    if (err) {
      return res.status(500).render("index", { content: "server mv error" });
    }

    const ipynbToPdf = spawn("jupyter", [
      "nbconvert",
      "--to",
      "pdf",
      path.join(uidPath, ipynb.name),
      `--output-dir=${uidPath}`,
    ]);

    errorLog = [];
    ipynbToPdf.stderr.on("data", (data) => errorLog.push(data));
    ipynbToPdf.on("close", (code) =>
      code === 0
        ? res.status(301).redirect(`/download/${uid}/${fileName}`)
        : res.status(400).render("index", {
            content: `child process exited with code ${code}`,
            errorMessage: errorLog.slice(1).join(""),
          }),
    );
  });
});

app.get("/download/:uid/:fileName", (req, res) => {
  if (!req.params.uid || !req.params.fileName) {
    return res.status(500).render("index", { content: "invalid path params" });
  }

  (function ({ uid, fileName }) {
    res.download(path.join(__dirname, "data", uid, `${fileName}.pdf`));
  })(req.params);
});

http
  .createServer(app)
  .listen(80, () => console.log("[server]: http on port: 80"));

https
  .createServer(options, app)
  .listen(443, () => console.log("[server]: https on port: 443"));
