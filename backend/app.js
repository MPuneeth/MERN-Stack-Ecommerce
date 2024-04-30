const express = require("express");

const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
//const dotenv = require("dotenv");
const path = require ("path");

const errorMiddleware = require("./middleware/error");

// config

if(process.env.NODE_ENV !== "PRODUCTION") {
    require("dotenv").config({path:"backend/config/config.env"});
 }

app.use(express.json({limit:52428800}));
app.use(cookieParser());
//app.use(bodyParser.json({limit:'1mb', extended:true}));
app.use(bodyParser.urlencoded({extended:true}));
app.use(fileUpload());

//Route Imports

const product = require("./routes/productRoute");
const user = require("./routes/userRoute");
const order = require("./routes/orderRoute");
const payment = require("./routes/paymentRoute");

app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1", payment);


//This is at end of project while deploying to github
// Now we will run only one server at port 4000 (before 4000 for backend & 3000 for frontend)
// so in that no matter what the url is("*") we have to return the file index.html is what it means.
//That is what React does it will handle one file and changes the component of it whenever required
//based on its root

app.use(express.static(path.join(__dirname, "../frontend/build")))

app.get("*",(req,res)=>{
    res.sendFile(path.resolve(__dirname, "../frontend/build/index.html"))
})

//Middleware for Errors

app.use(errorMiddleware);

module.exports = app;