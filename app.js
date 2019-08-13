//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");
var moment = require('moment');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.connect(process.env.DB_LOGIN, {useNewUrlParser: true});

//Schema for orders

const orderSchema = new mongoose.Schema ({
  sapNumber: String,
  orderNumber: String,
  deliveryTime: { type: String, default: 'Anytime' },
  carrier: { type: String, default: 'Any' },
  comments: String,
  date: { type: Date, default: Date.now },
  dateString: {type: String, default: moment().format("YYYY-MM-DD")},
  timeAdded: {type: String, default: moment().format("HH:mm")},
  orderStatus: {type: String, default: 'Requested'}
});

const Order = new mongoose.model("Order", orderSchema);


// API for orders

app.get("/", function(req, res){
  const start = new Date();
start.setHours(0,0,0,0);
  const end = new Date();
  end.setHours(23,59,59,999);
Order.find({date: {$gte: start, $lt: end}},function(err, foundOrders){
  if (err) {
    console.log(err);
  } else {
    res.render("orders", {foundOrders: foundOrders});
  }
  });
});

app.get("/submit", function(req, res){
  res.render("submit");
});

app.get("/archive", function(req, res){
  var d = new Date();
  d.setDate(d.getDate() - 1);
  yesterday = moment(d).format("YYYY-MM-DD");
  Order.find({dateString: yesterday},function(err, foundOrders){
    if (err) {
      console.log(err);
    } else {
      Order.distinct("dateString", {dateString: {$ne : moment().format("YYYY-MM-DD") }}, function(err, dates){
        if (err) {
          console.log(err);
        } else {
          const revDates = [...dates].reverse();
        res.render("archive", {foundOrders: foundOrders, dates: revDates, pickedDate: revDates[0]});
        }
      });
    }
    });
});

app.post("/submit", function(req, res){
  const ord = req.body;
  const newOrder = new Order({
  sapNumber: ord.sapNumber,
  orderNumber: ord.orderNumber,
  deliveryTime: ord.deliveryTime,
  carrier: ord.carrier,
  comments: ord.comments,
  });
  newOrder.save(function(err){
    if (err){
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
});

app.post("/changeStatus", function(req, res){
  const change = req.body;
  Order.findOneAndUpdate({_id: change.id}, {orderStatus: change.changeStatus}, function(err){
    if (err){
      console.log(err);
    }
    else {
      res.redirect("/");
    }
  });
});

app.post("/archive", function(req, res){
  Order.find({dateString: req.body.dateSelect},function(err, foundOrders){
    if (err) {
      console.log(err);
    } else {
      Order.distinct("dateString", {dateString: {$ne : moment().format("YYYY-MM-DD") }}, function(err, dates){
        if (err) {
          console.log(err);
        } else {
          const revDates = [...dates].reverse();
        res.render("archive", {foundOrders: foundOrders, dates: revDates, pickedDate: req.body.dateSelect});
        }
      });
    }
    });
});

app.post("/findSapNumber", function(req, res){
  Order.find({sapNumber: req.body.sapNumber}, function(err, foundOrder){
    if (foundOrder.length != 0) {
      const empt = [];
      const start = new Date();
    start.setHours(0,0,0,0);
      if (foundOrder[0].date > start){
        res.render("orders", {foundOrders: foundOrder});
      } else {
        res.render("archive", {foundOrders: foundOrder, dates: empt , pickedDate: foundOrder[0].dateString});
      }
    } else {
      res.redirect("/");
    }
  });
});

app.post("/findOrderNumber", function(req, res){
  Order.find({orderNumber: req.body.orderNumber}, function(err, foundOrder){
    if (foundOrder.length != 0) {
      const empt = [];
      const start = new Date();
    start.setHours(0,0,0,0);
      if (foundOrder[0].date > start){
        res.render("orders", {foundOrders: foundOrder});
      } else {
        res.render("archive", {foundOrders: foundOrder, dates: empt , pickedDate: foundOrder[0].dateString});
      }
    } else {
      res.redirect("/");
    }
  });
});


let port = process.env.PORT;
if (port == null || port == ""){
  port = 3000;
}

app.listen(port, function() {
  console.log("Server is running");
});
