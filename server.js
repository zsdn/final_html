// var http = require('http');
// http.createServer(function(req, res){
//     res.write("Hello World!");
//     res.end();
// }).listen(8080)

var express = require('express')
var server = express();


var bodyParser = require("body-parser");
var formidable = require("formidable");
var fs = require("fs");
var sizeOf = require('image-size');

var session = require('express-session')
var SHA256 = require("crypto-js/sha256")
var CryptoJS = require("crypto-js")

var Datastore = require('nedb');
var Character = new Datastore({ filename: __dirname + '/data/character.db', autoload: true });//character.db
var User = new Datastore({ filename: __dirname + "/data/user.db", autoload: true });//user.db
var UserMessage = new Datastore({ filename: __dirname + "/data/users.db", autoload: true });//users.db

var pwd = SHA256("bbb").toString(CryptoJS.enc.Hex);
//User.insert({ name: "aaa", pwd: pwd });


//Character.insert(userData);

server.use(express.static('網頁'));//web root
//server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.text({ type: 'text/html' }));
server.use(bodyParser.json({ type: 'application/*+json' }));

// Use the session middleware
server.use(session({ secret: 'secret key', cookie: { maxAge: 600000 } }))//十分鐘

server.set("view engine", "ejs");
server.set("views", __dirname + "/views");

server.get("/addimg", function (req, res) {
  Users.find({}, function (err, result) {
    if (err == null) {
      var i = 0;
      result.forEach(function (item) {
        Users.update({ id: item.id }, { $set: { img: "img_avator" + (i % 6 + 1) } });
        i++;
      })
      res.end("OK");
    }
  })

});


server.get("/index", function (req, res) {//首頁+排序
  Character.find({}).sort({ rarity_num: 1 }).exec(function (err, result) {
    if (err == null) {
      res.render("index", { character: result });
    }
  });
});

server.get("/tsai_shi", function (req, res) {//菜系頁面排序
  Character.find({ "tsai_shi_num": { $exists: true } }).sort({ tsai_shi_num: 1 }).exec(function (err, result) {
    if (err == null) {
      res.render("tsai_shi", { character: result });
    }
  });
});

server.get("/board", function (req, res) {//留言板ejs
  UserMessage.find({}).sort({ titlenum: 1 }).exec(function (err, result) {
    if (err == null) {
      res.render("message", { character: result });
    }
  });
});


server.post('/message', function (req, res, next) {
  if (req.session.loginUser == undefined) {//編撰標題
    res.redirect("/login.html");
  } else {
    if (req.session.views) {

      var form = formidable.IncomingForm();
      form.maxFileSize = 200 * 1024;

      var num;

      UserMessage.find({ check: "big" }, function (err, result) {
        if (err == null && result.length >= 1) num = result.length;
        else num = 0;
      });

      form.parse(req, function (err, fields, files) {

        if (err) {

          console.log("File size too large!");
          res.render("error", { error: err.message, next: "javascript:history.back()" })
        } else {
    
          var gotFields = fields;
          var fileExt = files.poster.name.split(".")[1];
          gotFields.poster = gotFields.title + "." + fileExt;
          var posterPath = "網頁/uploads/" + gotFields.poster;

          User.find({ name: req.session.loginUser }, function (err, result) {
            if (err == null && result.length == 1) {
              fs.renameSync(files.poster.path, posterPath);
              UserMessage.insert({ username: req.session.loginUser, title: gotFields.title, titlenum: num, check: "big", commet: gotFields.commet });//新增
              res.render("success", { success: "留言成功!" });
            }
            else {
              res.render("error", { error: "留言失敗!" })
            }
          });
        }
      })

    } else {
      req.session.views = 1
      res.end('welcome to the session demo. refresh!')
    }
  }
})

// server.post('/message', function (req, res, next) {
//   if (req.session.loginUser == undefined) {//編撰標題
//     res.redirect("/login.html");
//   } else {
//     if (req.session.views) {
//       var num;
//       // req.session.views++
//       //res.render("success", { success: req.session.loginUser});
//       //res.redirect("/message.html");
//       UserMessage.find({ check: "big" }, function (err, result) {
//         if (err == null && result.length >= 1) {
//           num = result.length;
//         }
//         else {
//           num = 0;
//         }
//       });
//       User.find({ name: req.session.loginUser }, function (err, result) {
//         if (err == null && result.length == 1) {
//           //User.update({ name:req.session.loginUser }, { $set: {  title:req.body.title, num: num } });
//           UserMessage.insert({ username: req.session.loginUser, title: req.body.title, titlenum: num, check: "big", commet: req.body.commet });//新增
//           res.render("success", { success: "留言成功!" });
//         }
//         else {
//           res.render("error", { error: "留言失敗!" })
//         }
//       });
//     } else {
//       req.session.views = 1
//       res.end('welcome to the session demo. refresh!')
//     }
//   }
// })

server.post("/board2", function (req, res) {//ren出回覆頁面
  UserMessage.find({ title: req.body.title }).sort({ titlenum: 1 }).exec(function (err, result) {
    if (err == null) {
      res.render("message2", { character: result });
    }
  });
});


server.post('/message2', function (req, res, next) {
  if (req.session.loginUser == undefined) {//回覆留言
    res.redirect("/login.html");
  } else {
    if (req.session.views) {
      var num;
      //res.render("success", { success: req.session.loginUser});
      //res.redirect("/message.html");
      UserMessage.find({ check: "small" }, function (err, result) {
        if (err == null && result.length >= 1) {
          num = result.length;
        }
        else {
          num = 0;
        }
      });
      User.find({ name: req.session.loginUser }, function (err, result) {
        if (err == null && result.length == 1) {
          //User.update({ name:req.session.loginUser }, { $set: {  title:req.body.title, num: num } });
          UserMessage.insert({ username: req.session.loginUser, title: req.body.title, titlenum: num, check: "small", reply: req.body.reply });//新增
          res.render("success", { success: "留言成功!" });
        }
        else {
          res.render("error", { error: "留言失敗!" })
        }
      });
    } else {
      req.session.views = 1
      res.end('welcome to the session demo. refresh!')
    }
  }
})

server.post('/comment', function (req, res, next) {
  if (req.session.loginUser == undefined) {//回覆留言
    res.redirect("/login.html");
  } else {
    if (req.session.views) {
      var num;
      //.find({ title: req.body.title }).sort({ titlenum: 1 }).exec(function (err, result) {

      Character.find({ comment: "comment" }, function (err, result) {
        if (err == null && result.length >= 1) {
          num = result.length;
        }
        else {
          num = 0;
        }
      });
      User.find({ name: req.session.loginUser }, function (err, result) {
        if (err == null && result.length == 1) {
          //User.update({ name:req.session.loginUser }, { $set: {  title:req.body.title, num: num } });
          Character.insert({ username: req.session.loginUser, reply: req.body.reply, comment:"comment", commentnum:num, name: req.body.name});//新增
          res.render("success", { success: "留言成功!" });
        }
        else {
          res.render("error", { error: "留言失敗!" })
        }
      });
    } else {
      req.session.views = 1
      res.end('welcome to the session demo. refresh!')
    }
  }
})

server.post("/character_info", function (req, res) {//角色資料呈現

  var form = formidable.IncomingForm();

  form.maxFileSize = 200 * 1024;

  form.parse(req, function (err, fields, files) {
    if (err == null) {
      var gotFields = fields;
      console.log(gotFields.name);
      //Users.insert(gotFields);
      //.find({ title: req.body.title }).sort({ titlenum: 1 }).exec(function (err, result) {
      Character.find({ "name": gotFields.name }).sort({commentnum:1}).exec(function (err, result) {
        if (err == null) {
          res.render("character4", {
            character: result,
            hp: gotFields.hp,
            atk: gotFields.atk
          });//character.ejs
        }
      });
    }
  })
});

server.get('/', function (req, res, next) {
  if (req.session.loginUser == undefined) {//未登入
    res.redirect("/login.html");
  } else {
    if (req.session.views) {
      // req.session.views++
      // res.setHeader('Content-Type', 'text/html')
      // res.write('<p>Hi!: ' + req.session.loginUser + '</p>')
      // res.write('<p>views: ' + req.session.views + '</p>')
      // res.write('<p>expires in: ' + (req.session.cookie.maxAge / 1000) + 's</p>')
      // res.end()

      //res.render("success", { success: req.session.loginUser});
      res.redirect("/index");
    } else {
      req.session.views = 1
      res.end('welcome to the session demo. refresh!')
    }
  }
})


server.post('/login', function (req, res, next) {

  User.findOne({ name: req.body.name, pwd: req.body.password }, function (err, doc) {
    if (err == null && doc) {
      req.session.regenerate(function (err) {
        if (err) {
          return res.json({ ret_code: 2, ret_msg: '登入失敗' });
        }
        req.session.loginUser = req.body.name;
        req.session.views = 1;
        res.json({ ret_code: 0, ret_msg: '登入成功' });
      });
    } else {
      res.json({ ret_code: 1, ret_msg: '帳號或密碼錯誤' });
    }
  });
});

server.post('/register', function (req, res, next) {

  User.findOne({ name: req.body.name, pwd: req.body.password }, function (err, doc) {
    if (err == null && doc) {
      req.session.regenerate(function (err) {
        if (err) {
          return res.json({ ret_code: 2, ret_msg: '登入失敗' });
        }
        req.session.loginUser = req.body.name;
        req.session.views = 1;
        res.json({ ret_code: 0, ret_msg: '登入成功' });
      });
    } else {
      User.insert({ name: req.body.name, pwd: req.body.password });//新增
      res.json({ ret_code: 1, ret_msg: '帳號或密碼錯誤' });

    }
  });
});


server.post('/update', function (req, res, next) {
  User.findOne({ name: req.body.name, pwd: req.body.password }, function (err, doc) {
    if (err == null && doc) {
      req.session.regenerate(function (err) {
        if (err) {
          return res.json({ ret_code: 2, ret_msg: '登入失敗' });
        }
        req.session.loginUser = req.body.name;
        req.session.views = 1;
        User.update({ id: req.body.name }, { $set: { password: req.body.password2 } });
        res.json({ ret_code: 0, ret_msg: '修改成功' });
      });
    } else {
      User.insert({ name: req.body.name, pwd: req.body.password });//新增
      res.json({ ret_code: 1, ret_msg: '帳號或密碼錯誤' });

    }
  });
});

// server.get("/", function (req, res) {//首頁+排序
//   Character.find({}).sort({ rarity_num: 1 }).exec(function (err, result) {
//     if (err == null) {
//       res.render("index3", { character: result });
//     }
//   });
// });



server.get("/gameform", function (req, res) {
  Users.find({}, function (err, result) {
    if (err == null) {
      res.render("gameform", { student: result })
    }
  })
});


// server.post("/signin", function (req, res) {

//   var form = formidable.IncomingForm();

//   form.maxFileSize = 200 * 1024;

//   form.parse(req, function (err, fields, files) {
//     if (err == null) {
//       var gotFields = fields;
//       console.log(gotFields);
//       // Users.insert(gotFields);
//       Users.find({ account:gotFields.account , pwd:gotFields.pwd}, function (err, result) {
//         if (err == null && result.length == 1) {
//           res.render("success", { success: "登入成功!" });
//         }
//         else {
//           res.render("error", { error: "查無此用戶!請確認帳號跟密碼是否輸入正確!" })
//         }
//       });
//     }
//   })
// });


// server.post("/add", function (req, res) {

//   form.parse(req, function (err, fields, files) {
//     if (err == null) {
//       var gotFields = fields;
//       console.log(gotFields);
//       Users.find({ account:gotFields.account}, function (err, result) {
//         if (err == null && result.length == 1) {
//           res.render("success", { success: "此帳號已經存在!" });
//         }
//         else {
//           Users.insert(gotFields);
//           res.render("error", { error: "帳號註冊成功!" })
//         }
//       });
//     }
//   })
// });

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

      gotFields.poster = gotFields.name + "." + fileExt;

      var posterPath = "網頁/uploads/" + gotFields.poster;

      var password = CryptoJS.SHA256(gotFields.pwd).toString(CryptoJS.enc.Hex);

      User.find({ name: gotFields.name }, function (err, result) {
        if (err == null && result.length == 1) {
          res.render("success", { success: "此帳號已經存在!" });
        }
        else {
          fs.renameSync(files.poster.path, posterPath);
          User.insert({ name: gotFields.name, pwd: password });
          // User.insert({ name: "aaa", pwd: pwd });
          res.render("error", { error: "帳號註冊成功!" })
        }
      })
    }
  })
});

server.post("/delete", function (req, res) {

  var form = formidable.IncomingForm();

  form.maxFileSize = 200 * 1024;

  form.parse(req, function (err, fields, files) {
    if (err == null) {
      var gotFields = fields;
      console.log(gotFields);
      Users.find({ account: gotFields.account }, function (err, result) {
        if (err == null && result.length == 1) {
          res.render("success", { success: "已刪除此帳號!" });
        }
        else { res.render("error", { error: "查無此用戶!請確認帳號跟密碼是否輸入正確!" }) }
      });
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
      try {
        if (ext == "zip") {
          var zip = new AdmZip(files.gamezip.path);
          zip.extractAllTo(gamepath, true);
          res.render("success", { error: "Success uploaded." });
        }
      } catch (err) {
        res.render("error", { error: "cannot unzip uploaded file" })
      }
      fs.unlinkSync(files.gamezip.path);

    }
  })
});

// server.get("/", function (req, res) {
//   res.send("Hello World!");
// });


server.get("*", function (req, res) {
  res.send("Page not found", 404);
})

server.get('/logout', function (req, res, next) {

  req.session.destroy(function (err) {
    if (err) {
      res.json({ ret_code: 2, ret_msg: '退出登入失敗' });
      return;
    }
    // req.session.loginUser = null;
    res.clearCookie(identityKey);
    res.redirect('/');
  });
});

server.listen(8080);
console.log("Server running on port: 8080");
