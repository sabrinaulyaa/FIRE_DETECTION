// =====================================
// FIRE DETECTION BACKEND FINAL
// MQTT + SOCKET.IO + EXPRESS
// =====================================


const express = require("express");
const http = require("http");
const {Server} = require("socket.io");
const mqtt = require("mqtt");
const cors = require("cors");
const path = require("path");




// ================================
// EXPRESS
// ================================


const app = express();


app.use(cors());


const server =
http.createServer(app);




const io =
new Server(server,{

cors:{
origin:"*"
}

});






// ================================
// FRONTEND STATIC
// ================================


app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});









// ================================
// MQTT CONFIG
// ================================

const MQTT_BROKER = "mqtt://broker.hivemq.com";

// Subscribe semua topic fire/detection
const MQTT_TOPIC = "fire/detection/#";

const mqttClient = mqtt.connect(MQTT_BROKER);









// ================================
// MQTT CONNECT
// ================================

mqttClient.on("connect", () => {

    console.log("MQTT Connected");

    mqttClient.subscribe(MQTT_TOPIC, (err) => {

        if (err) {

            console.log("Subscribe gagal:", err);

        } else {

            console.log("Subscribe:", MQTT_TOPIC);

        }

    });

});








// ================================
// RECEIVE MQTT DATA
// ================================


mqttClient.on(
"message",
(topic,message)=>{


try{


let data =
JSON.parse(
message.toString()
);



console.log(
"DATA SENSOR :",
data
);



// kirim ke browser

io.emit(
"sensorData",
data
);



}

catch(error){


console.log(
"Format JSON salah"
);



}


});









// ================================
// SOCKET
// ================================


io.on(
"connection",
(socket)=>{


console.log(
"Dashboard Connected"
);



socket.on(
"disconnect",
()=>{


console.log(
"Dashboard Disconnect"
);


});


});









// ================================
// SERVER START
// ================================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {

    console.log("================================");
    console.log(" FIRE DETECTION SERVER ");
    console.log(` Running on Port : ${PORT}`);
    console.log("================================");

});