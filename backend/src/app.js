import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import {connectToSocket} from "./controllers/socketManager.js";

import cors from "cors";
import userRoutes from "./routes/users.routes.js"

const PORT = 3000 ;
// const connectionString = "mongodb+srv://aryanshrivastav7374:PoojaCluster0@cluster0.k8rfecs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/ConnectifyDB";
const connectionString = "mongodb+srv://aryanshrivastav7374:PoojaCluster0@cluster0.k8rfecs.mongodb.net/ConnectifyDB?retryWrites=true&w=majority&appName=Cluster0";

const app = express();
const server = createServer(app);
// const io = new Server(server);
const io = connectToSocket(server);

app.set("port" , (process.env.PORT || PORT));

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use(express.json({limit : "40kb"}));
// app.use(express.urlencoded({limit : "40kb" , extended : "true"} ));

app.use( "/api/v1/users" , userRoutes );
// app.use( "/api/v2/users" , userRoutes ); // used to support older versions as well

app.get("/" , (req,res)=>{
    return res.json({"hello" : "world"});
})


const start = async ()=>{

    // app.set("mongo_user");

    try{
        // const connectionDB = await mongoose.connect("mongodb+srv://aryanshrivastav7374:PoojaCluster0@cluster0.k8rfecs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
        const connectionDB = await mongoose.connect("mongodb+srv://aryanshrivastav7374:PoojaCluster0@cluster0.k8rfecs.mongodb.net/ConnectifyDB?retryWrites=true&w=majority&appName=Cluster0");
        console.log(`MongoDB connection to DB host: ${connectionDB.connection.host}`);
    }
    catch(e){
        console.log("Error while connecting to DB : " , e.status);
    }
    

    server.listen( PORT , ()=>{
        console.log(`app is listening on PORT : ${PORT}`);
    });


}

start();