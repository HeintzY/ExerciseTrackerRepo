const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// Project solution:
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const exerciseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String, required: true }
});

const ExerciseModel = mongoose.model("ExerciseModel", exerciseSchema);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  log: [exerciseSchema]
});

const UserModel = mongoose.model("UserModel", userSchema);

app.post("/api/users", bodyParser.urlencoded({ extended: false }), function (req, res) {

  const user = new UserModel({ username: req.body["username"] });
  user.save(function (err, data) {
    if (err) {
      return console.log(err);
    }
    res.json({ username: data.username, _id: data._id });

  });

});


app.get("/api/users", function (req, res) {
  UserModel.find({}, function (err, foundUsers) {
    if (err) {
      return console.log(err);
    }
    res.json(foundUsers);
  });
});


app.post("/api/users/:_id/exercises", bodyParser.urlencoded({ extended: false }), function (req, res) {

  const exercise = new ExerciseModel({
    description: req.body["description"],
    duration: parseInt(req.body["duration"]),
    date: req.body["date"] ? new Date(req.body["date"]).toDateString() : new Date().toDateString()
  });

  UserModel.findById(req.params._id, function (err, userFound) {
    if (err) {
      return console.log(err);
    }
    else if (!userFound) {
      res.json({ error: "could not find the user by id" });
    }
    else {
      userFound.log.push(exercise);
      userFound.save(function (err, updatedUser) {
        if (err) {
          return console.log(err);
        }
        res.json({ username: updatedUser.username, description: exercise.description, duration: exercise.duration, date: exercise.date, _id: updatedUser._id });
      });
    }


  });

});

app.get("/api/users/:_id/logs", function (req, res) {
  UserModel.findById(req.params._id, function (err, userFound) {
    if (err) {
      return console.log(err);
    }
    else if (!userFound) {
      res.json({ error: "could not find the user by id" });
    }
    else {
      let result = userFound;

      let startDate = new Date(0);
      let endDate = new Date();
      if (req.query.from) {
        startDate = new Date(req.query.from);
      }
      if (req.query.to) {
        endDate = new Date(req.query.to);
      }

      result.log = result.log.filter(function (entry) {
        let entryDate = new Date(entry.date);
        return (entryDate.getTime() >= startDate.getTime()) && (entryDate.getTime() <= endDate.getTime())
      });

      if (req.query.limit) {
        result.log = result.log.slice(0, req.query.limit)
      }
      res.json({
        username: result.username,
        count: result.log.length,
        _id: result._id,
        log: result.log
      });
    }
  });
});

//{"username":"asdfa","_id":"681b22cebd1e5661c85b0397"}




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
