const express = require("express");
const http = require("http");
const https = require("https");
const fileUpload = require("express-fileupload");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const app = express();

const download = require("./routes/download");
const error = require("./routes/error");
const upload = require("./routes/upload");

require("dotenv").config();
const key_loc = process.env.KEY;
const cert_loc = process.env.CERT;

const options = {
  key: fs.readFileSync(key_loc, "utf8"),
  cert: fs.readFileSync(cert_loc, "utf8"),
};

app.use(fileUpload());
app.set("view engine", "ejs");

app.get("/", (_req, res) => res.status(200).render("index"));
app.get("/upload-file-error", error.fileError);
app.get("/upload-url-error", error.urlError);
app.post("/upload-file", upload.fileUpload);
app.post("/upload-url", upload.urlUpload);
app.get("/download/:uid/:fileName", download.downloadPdf);

http
  .createServer(app)
  .listen(80, () => console.log("[server]: http on port: 80"));

https
  .createServer(options, app)
  .listen(443, () => console.log("[server]: https on port: 443"));
