const http = require("http");
const fs = require("fs");
const path = require("path");
const { EventEmitter } = require("events");

const NewsLetter = new EventEmitter();

const server = http.createServer((req, res) => {
  const chunks = [];
  const { url, method } = req;

  req.on("error", (err) => {
    console.log(err);
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.write(JSON.stringify({ msg: "Not a valid request." }));
    res.end();
  });

  res.on("error", (err) => {
    console.log(err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.write(JSON.stringify({ msg: "Server error." }));
    res.end();
  });

  req.on("data", (chunk) => {
    chunks.push(chunk);
  });

  req.on("end", () => {
    if (url === "/newsletter_signup" && method === "POST") {
      const body = JSON.parse(Buffer.concat(chunks).toString());
      const newContact = `${body.name}, ${body.email}\n`;

      NewsLetter.emit("signup", newContact, res);

      res.setHeader("Content-Type", "application/json");
      res.write(
        JSON.stringify({ msg: "Successfully signed up fo rthe newsletter." })
      );
      res.end();
    } else if (url === "/newsletter_signup" && method === "GET") {
      fs.readFile(path.join(__dirname, "../public/index.html"), (err, data) => {
        if (err) {
          console.log(err);
          res.emit("error", err);
          return;
        }
        res.setHeader("Content-Type", "text/html");
        res.write(data);
        res.end();
      });
    } else {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.write(JSON.stringify({ msg: "Not a valid endpoint." }));
      res.end();
    }
  });
});

server.listen(3000, () => {
  console.log("Server listening on Port 3000");
});

NewsLetter.on("signup", (newContact, res) => {
  fs.appendFile(path.join(__dirname, "/newsletter.csv"), newContact, (err) => {
    if (err) {
      NewsLetter.emit("error", err, res);
      return;
    }

    console.log("The file was updated successfully.");
  });
});

NewsLetter.on("error", (err, res) => {
  console.log(err);
  res.statusCode = 500;
  res.setHeader("Content-Type", "application/json");
  res.write(
    JSON.stringify({ msg: "Error adding the new contact to the newsletter." })
  );
  res.end();
});
