// var http = require('http');
// http.createServer(function(req, res){
//     res.write("Hello World!");
//     res.end();
// }).listen(8080)

var express = require("express");
server = express();


var bodyParser = require("body-parser");
var formidable = require("formidable");
var fs = require("fs");
var sizeOf = require('image-size');

server.use(express.static('Exercise1'));//web root
server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.text({ type: 'text/html' }));
server.use(bodyParser.json({ type: 'application/*+json' }));

server.set("view engine", "ejs");
server.set("views", __dirname + "/views");


server.get("/submitForm", function (req, res) {

});

server.post("/add", function (req, res) {
  var form = formidable.IncomingForm();
  form.maxFileSize = 200 * 1024;
  form.parse(req, function (err, fields, files) {
    if (err) {
      console.log("File size too large!");
      res.render("error", { error: err.message, next: "javascript:history.back()" })
    } else {
      var gotFields = fields;
      var fileExt = files.poster.name.split(".")[1];
      gotFields.poster = gotFields.id + "." + fileExt;
      var posterPath = "Exercise1/uploads/" + gotFields.poster;
      fs.renameSync(files.poster.path, posterPath);
      //check image size
      sizeOf(posterPath, function (err, dim) {
        if (err) {
          res.render("error", { error: "Cannot read uploaded image file.", next: "javascript:history.back()" });
        } else {
          if (dim.width != 800 || dim.height != 400) {
            res.render("error", { error: "Image size requires 800x400.", next: "javascript:history.back()" });
            fs.unlinkSync(posterPath);
          } else {
            //record to database, nedb, mongodb
            res.render("game", { id: gotFields.id });
          }
        }
      })
    }
  })
});

var AdmZip = require('adm-zip');

server.post("/addgamefile", function (req, res) {
  var form = formidable.IncomingForm();
  form.maxFileSize = 4000 * 1024;
  form.parse(req, function (err, fields, files) {
    if (err) {
      console.log("File size too large!");
      res.render("error", { error: err.message, next: "javascript:history.back()" })
    } else {
      var gamepath = "Exercise1/game/" + fields.id;
      var ext = files.gamezip.name.split(".")[1];
      if (ext == "zip") {
        var zip = new AdmZip(files.gamezip.path);
        zip.extractAllTo(gamepath, true);
        res.render("success", { error: "Success uploaded." });
      }
    }
  })
});

server.get("/", function (req, res) {
  res.send("Hello World!");
});

server.get("/md2020", function (req, res) {
  res.send("Hello MD2020!");
});

server.get("*", function (req, res) {
  res.send("Page not found", 404);
})

server.listen(8080);
console.log("Server running on port: 8080")
