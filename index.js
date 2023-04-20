require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const moment = require("moment/moment");
const bodyParser = require("body-parser");
const { result, select } = require("underscore");
const mongoose = require("mongoose");
const User = require("./schemas/user");
const Course = require("./schemas/course");

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/api/searchcourses', (req, res) => {
    const filters = req.body.courseTags
    console.log(filters)
    //parse list and make new variables for each
    const selectedDeptValue = filters[0]
    const selectedHoursValue = Number(filters[1])
    const selectedLevelValue = filters[2]
    const selectedPrereqValue = filters[3] 
    const selectedDaysValue = filters[4]
    const selectedPathwaysValue = filters[5]
    const selectedSearchValue = filters[6]
    
    //add level?

    let query = {}

    if(selectedSearchValue){
    query = {
        $or: [
          { title: { $regex: selectedSearchValue , $options: 'i'} },
          { professor: { $regex: selectedSearchValue , $options: 'i'} },
          { title: { $exists: false }, professor: { $exists: false } }
        ]
      }
    }
    if(selectedPathwaysValue) {
        query.pathways = selectedPathwaysValue
    }
    if(selectedHoursValue) {
        query.creditHours = selectedHoursValue
    }
    if(selectedDaysValue) {
        query.days = selectedDaysValue
        //query.days = { $regex: selectedDaysValue , $options: 'i'}
    }/*
    if(selectedPrereqValue) {
        query.prereqs = selectedPrereqValue
    }
    if(selectedDeptValue) {
        query.department = selectedDeptValue
    }
    if(selectedLevelValue) {
        query.level = selectedLevelValue
    }*/

    //query the db for the results
    Course.find(query).exec((err, course) => {
        console.log(course)
        console.log(query)
        res.json({courses: course})
    })
})

app.post("/api/userinfo", (req, res) => {
    const data = req.body;
    if (!data.user) {
        return res
            .status(400)
            .send({ error: "User parameter missing in request" });
    }
    User.findOne({ username: data.user }).exec(
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!user) {
                return res
                    .status(401)
                    .json({ error: "User not found" });
            }
            return res.json(user);
        }
    );
});

app.post("/api/getcourses", (req, res) => {
    const data = req.body;
    if (data.user == null) {
        return res
            .status(400)
            .send({ error: "User parameter missing in request" });
    }
    if (data.registration == null) {
        return res
            .status(400)
            .send({
                error: "Registration parameter missing in request",
            });
    }
    User.findOne({ username: data.user }).exec(
        (err, user) => {
            if (err) {
                return res.status(500).send({ error: err.message });
            }
            if (!user) {
                return res
                    .status(401)
                    .send({ error: "User not found" });
            }
            if (data.registration) {
                return res.json({ courses: user.shoppingCart });
            } else {
                return res.json({ courses: user.courses });
            }
        }
    );
});

app.post("/api/getcourse", (req, res) => {
    const data = req.body;
    Course.findOne({ courseNumber: data.courseNumber }).exec(
        (err, course) => {
            if (err) {
                return res.status(500).send({ error: err.message });
            }
            if (!course) {
                return res
                    .status(401)
                    .send({ error: "Course not found" });
            }
            return res.send(course);
        }
    );
});

app.post("/api/login", (req, res) => {
    const data = req.body;
    if (data.user == null) {
        return res.status(400).send({ error: "User parameter missing in request" });
    }
    if (data.pass == null) {
        return res
            .status(400)
            .send({ error: "Password parameter missing in request" });
    }
    User.findOne({ username: data.user }).exec(
        (err, user) => {
            if (err) {
                return res.status(400).send({ error: err.message });
            }
            if (!user) {
                return res
                    .status(401)
                    .send({ error: "User not found" });
            }
            if (user.password === data.pass) {
                return res.json({
                    valid: true,
                    userType: user.userType,
                });
            } else {
                return res
                    .status(401)
                    .send({ error: "User not found", valid: false });
            }
        }
    );
});

mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGODB_URI).then(
    () => {
        app.listen(process.env.HOST_PORT);
        console.log(
            `listening on: localhost:${process.env.HOST_PORT}`
        );
    },
    (err) => {
        console.log("mongo db connection failed");
    }
);

module.exports = app;
