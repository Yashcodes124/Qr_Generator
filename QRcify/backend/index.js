// #!/usr/bin/env node
// import inquirer from "inquirer";
// import qr from "qr-image";

// inquirer
//   .prompt([
//     {
//       type: "input",
//       name: "url",
//       message: "Please enter the URL you want to convert to QR code:",
//     },
//   ])
//   .then((answers) => {
//     // Use user feedback for... whatever!!
//     const url = answers.url;//user input URLis stored here.

//     var qr_png = qr.image(url, { type: "png" });
//     qr_png.pipe(fs.createWriteStream("url.png"));
//     var png_string = qr.imageSync(url, { type: "png" }); // Optional: Get PNG as buffer

//     //saving url to a text file
//     fs.writeFile("url.txt", url, (err) => {
//       if (err) throw err;
//       console.log("The Url has been written to url.txt file");
//     });
//   })
//   .catch((error) => {
//     if (error.isTtyError) {
//       // Prompt couldn't be rendered in the current environment
//       console.error("Prompt couldn't be rendered in the current environment");
//     } else {
//       // Something else went wrong
//       console.error("Something else went wrong", error);
//     }
//   });

import express from "express";
import qr from "inquirer";
import cors from "cors";
import fs from "fs";

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("../frontend")); //it will serve the static files from the front end folder like html , css , js images...

//Default route "/" will act as main page
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "../frontend" });
});

//route for geponerating the Qr from the URL.
app.post("/generate", (req, res) => {
  const { url } = req.body; // it contains all the user sources.
  if (!url) {
    console.error("can't finf URL");
    return res.status(400).json({ error: "URL is required for QR generation" });
  }

  try {
    const qrPng = qr.imageSync(url, { type: "png" }); //here qrPng is a buffer object containing the image data
    const qrBase64 = "data:image/png;base64," + qrPng.toString("base64"); //Convert the PNG image buffer to a base64-encodedvstring and prepend the data URL prefix.
    //This creates the data URL that can be directly used as the src attribute in an HTML <img> tag to dispay the QR code image.
    res.json({ qrCode: qrBase64 });
    // saving url to a text file
    fs.appendFile("urls.txt", url, (err) => {
      if (err) {
        console.log(" Failed to write URL to file", err);
      } else {
        console.log("URL has been saved to urls.txt.");
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate QR code" });
  }

  app.listen(port, () => {
    console.log("🚀 Server is running at http://localhost:3000");
  });
});
