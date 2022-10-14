const express = require('express');
const app = express();
const hbs = require("express-handlebars");
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');
const socketSever = require('./app/controllers/socketServer');
socketSever(io);

app.use(express.static(path.join("public")));
app.engine("handlebars", hbs({defaultLayout: "main"}));
app.set("view engine", "handlebars");

app.get("/", function(req, res) {

    res.render("home", {
        title: "Chess Board",
        styles: [
            "bootstrap.css",
            "custom.css"
        ]
    });

});

	server.listen(process.env.PORT || 3000);


