#!/usr/bin/env node
import inquirer from "inquirer";
import qr from "qr-image";
import fs from "fs";

inquirer
  .prompt([
    {
      type: "input",
      name: "url",
      message: "Please enter the URL you want to convert to QR code:",
    },
  ])
  .then((answers) => {
    // Use user feedback for... whatever!!
    const url = answers.url;

    var qr_png = qr.image(url, { type: "png" });
    qr_png.pipe(fs.createWriteStream("url.png"));
    var png_string = qr.imageSync(url, { type: "png" }); // Optional: Get PNG as buffer

    //saving url to a text file
    fs.writeFile("url.txt", url, (err) => {
      if (err) throw err;
      console.log("The Url has been written to url.txt file");
    });
  })
  .catch((error) => {
    if (error.isTtyError) {
      // Prompt couldn't be rendered in the current environment
      console.error("Prompt couldn't be rendered in the current environment");
    } else {
      // Something else went wrong
      console.error("Something else went wrong", error);
    }
  });
