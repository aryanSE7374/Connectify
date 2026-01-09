import {Server} from "socket.io";

// function connectToSocket

export const connectToSocket = (server)=>{
    const io = new Server(server);
    return io;
}