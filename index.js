const express = require('express')
const app = express()
const bodyParser = require('body-parser')
let mongoose;
try {
  mongoose = require("mongoose");
} catch (e) {
  console.log(e);
}
const { Schema } = mongoose;
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())
const cors = require('cors')
app.use(cors())
app.use(bodyParser.json())
app.use(express.static('public'))
mongoose.set('strictQuery', true)

const pe_mongo_db = process.env.MONGO_URI
mongoose.connect(pe_mongo_db).then(() => console.log('Connected!'));

const userSchema = mongoose.Schema(
  {
    username: { type: String, required: true, unique: false },
    exercises: [{
      count: { type: Number },
      description: { type: String },
      duration: { type: Number },
      date: { type: String, required: false }
    }]

  }
);

const Users = mongoose.model('Users', userSchema);

Users.createCollection().then(function(collection) {
  console.log("Users Collection created!");
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.get('/api/users', async function(req, res) {
  Users.find({}).then(function(users) {
    res.send(users);
  });
});

app.post('/api/users', async function(req, res) {
  const insertUser = await Users.create(
    { username: req.body.username }
  );
  res.json(insertUser)
});


app.post('/api/users/:_id/exercises', async function(req, res) {
  var exObj = {
    description: req.body.description,
    duration: Number(req.body.duration),
    date: new Date(req.body.date).toDateString()
  };
  var getUser = await Users.findById(req.params._id).exec()
  await Users.findByIdAndUpdate(getUser._id,
    {
      $addToSet: {
        exercises: {
          description: exObj.description,
          duration: exObj.duration,
          date: exObj.date
        }
      }
    }, { new: true })
  let returnObj = {
    username: getUser.username,
    description: exObj.description,
    duration: exObj.duration,
    _id: getUser._id,
    date: exObj.date
  };  // create another variable to pass the test to return a respose of the user object with the exercise fields added.
  return res.json(returnObj)
});
app.get('/api/users/:_id/logs', async function(req, res) {
  const { from, to, limit } = req.query;
  var getUser = await Users.findById(req.params._id).exec()

  const findExerciseUser = await Users.findById(req.params._id, 'exercises').exec();
  var exercises = [];
      if (from && !to) {
        const ded = await Users.findById(req.params._id).exec()
        var ff = []
        for (v in ded.exercises) {
          ded.exercises[v].date = new Date(ded.exercises[v].date).toISOString().substring(0, 10)

          if (ded.exercises[v].date >= from) {
            ded.exercises[v].date = new Date(ded.exercises[v].date).toDateString().substring(0, 15)
            ff.push(ded.exercises[v])
          }
        }
        if (limit) {
          var outputlogs = {
            username: getUser.username,
            count: findExerciseUser.exercises.length,
            log: ff.splice(0, limit)
          }
        } else {
          var outputlogs = {
            username: getUser.username,
            count: findExerciseUser.exercises.length,
            log: ff
          }
        }
        return res.json(outputlogs);
      } else if (!from && to) {
        const ded = await Users.findById(req.params._id).exec()
        var ff = []
        for (v in ded.exercises) {
          ded.exercises[v].date = new Date(ded.exercises[v].date).toISOString().substring(0, 10)
          if (ded.exercises[v].date <= to) {
            ded.exercises[v].date = new Date(ded.exercises[v].date).toDateString().substring(0, 15)
            ff.push(ded.exercises[v])
          }
        }
        if (limit) {
          var outputlogs = {
            username: getUser.username,
            count: findExerciseUser.exercises.length,
            log: ff.splice(0, limit)
          }
        } else {
          var outputlogs = {
            username: getUser.username,
            count: findExerciseUser.exercises.length,
            log: ff
          }
        }
        return res.json(outputlogs);
      } else if (from && to) {
        const ded = await Users.findById(req.params._id).exec()
        var ff = []
        for (v in ded.exercises) {
          ded.exercises[v].date = new Date(ded.exercises[v].date).toISOString().substring(0, 10)

          var fromdate = new Date(from)
          var todate = new Date(to)
          for (var dateparse = fromdate; dateparse <= todate; dateparse.setDate(dateparse.getDate() + 1)) {
            if (ded.exercises[v].date == new Date(dateparse).toISOString().substring(0, 10)) {
              ded.exercises[v].date = new Date(ded.exercises[v].date).toDateString().substring(0, 15)
              ff.push(ded.exercises[v])
            }
          }
        }
        if (limit) {
          var outputlogs = {
            username: getUser.username,
            count: findExerciseUser.exercises.length,
            log: ff.splice(0, limit)
          }
        } else {
          var outputlogs = {
            username: getUser.username,
            count: findExerciseUser.exercises.length,
            log: ff
          }
        }
        return res.json(outputlogs);

      }
    for (v in getUser.exercises) {
      exercises.push(getUser.exercises[v])
      //to complete the test for date property to be datestring format using date api, you need to put Date().toString().substring(0,15), apparently using new Date() method for formatting the dates cannot accept or pass the test.
      exercises[v].date = new Date(getUser.exercises[v].date).toString().substring(0,15)
    }
    if (limit) {
      var countexercise = {
        username: getUser.username,
        count: findExerciseUser.exercises.length,
        _id: getUser._id,
        log: exercises.splice(0, limit)
      }
    } else {
      var countexercise = {
        username: getUser.username,
        count: findExerciseUser.exercises.length,
        _id: getUser._id,
        log: exercises.splice(0)
      }
    }
    return res.json(countexercise)
  
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})