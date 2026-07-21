/*
====================================================
 FIRE DETECTION IoT BACKEND FINAL
 ESP32 + HiveMQ MQTT + Socket.IO + Supabase
 Railway Ready
====================================================
*/


const express = require("express");
const http = require("http");
const cors = require("cors");
const mqtt = require("mqtt");
const path = require("path");
require("dotenv").config();

const {createClient} =
require("@supabase/supabase-js");




//====================================
// SUPABASE
//====================================


const supabase =
createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);




//====================================
// EXPRESS
//====================================


const app = express();

app.use(cors());

app.use(
express.json()
);



// frontend folder

app.use(
express.static(
path.join(__dirname,"public")
)
);



app.get("/",(req,res)=>{

res.sendFile(
path.join(
__dirname,
"public",
"index.html"
)
);

});




//====================================
// SERVER
//====================================


const server =
http.createServer(app);








//====================================
// MQTT HIVEMQ
//====================================


const MQTT_SERVER = "mqtt://broker.emqx.io:1883";


const MQTT_TOPIC =
"fire/detection";



const mqttClient =
mqtt.connect(
MQTT_SERVER,
{

clientId:
"railway-fire-server-"+
Math.random()
.toString(16)
.substring(2),

reconnectPeriod:3000

}
);





//====================================
// MQTT CONNECT
//====================================


mqttClient.on(
"connect",
()=>{


console.log(
"MQTT HiveMQ Connected"
);



mqttClient.subscribe(
MQTT_TOPIC,
(err)=>{


if(err)
{

console.log(
"Subscribe Error",
err
);

}

else
{

console.log(
"Subscribe:",
MQTT_TOPIC
);

}


}
);


});






//====================================
// RECEIVE MQTT DATA
//====================================


mqttClient.on(
"message",
async(topic,message)=>{


try{


const data =
JSON.parse(
message.toString()
);



console.log(
"DATA MQTT:",
data
);












//=============================
// SAVE SUPABASE
//=============================


const {error}=

await supabase
.from("fire_history")
.insert([

{

flame:
data.flame,

gas:
data.gas,

status:
data.status,

device:
data.device || "ESP32_FIRE"

}

]);





if(error)
{

console.log(
"Supabase Error:",
error.message
);

}

else
{

console.log(
"Saved Supabase"
);

}



}

catch(err)
{


console.log(
"JSON ERROR:",
err.message
);


}


});
















//====================================
// SERVER START
//====================================


const PORT =
process.env.PORT || 3000;



server.listen(
PORT,
()=>{


console.log(
"=============================="
);

console.log(
" FIRE DETECTION SERVER RUNNING"
);


console.log(
"PORT:",
PORT
);


console.log(
"=============================="
);


});