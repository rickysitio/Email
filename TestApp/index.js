const express = require("express");
require("Email-package")
const Mailrouter = require("./Routes/mailRoute");
require('dotenv').config();


const app = express();
app.use(express.json());

const PORT = 4000


//Routes
app.use("/api/mail",Mailrouter);


// Server check
app.listen(PORT, ()=>{
    console.log(`server is up on ${PORT}`)
})




