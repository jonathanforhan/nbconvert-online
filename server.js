const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT;

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index", { text: "World..." });
});

app.listen(port, () => {
  console.log(`[server]: running at https://localhost:${port}`);
});
