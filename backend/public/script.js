/*
====================================================
 FIRE DETECTION IoT DASHBOARD FINAL
 ESP32 + HiveMQ + Railway + Supabase
====================================================
*/


// ===============================
// SIDEBAR
// ===============================

function openPage(pageId, element){

    document.querySelectorAll(".page")
    .forEach(page=>{
        page.classList.remove("active");
    });


    const page =
    document.getElementById(pageId);


    if(page){
        page.classList.add("active");
    }


    document.querySelectorAll(".sidebar li")
    .forEach(li=>{
        li.classList.remove("active");
    });


    if(element){
        element.classList.add("active");
    }

}





// ===============================
// SETTING
// ===============================


const gasLimitInput =
document.getElementById("gasLimit");


if(gasLimitInput){

    gasLimitInput.value =
    localStorage.getItem("gasLimit") || 300;

}



function saveSetting(){

    if(gasLimitInput){

        localStorage.setItem(
            "gasLimit",
            gasLimitInput.value
        );


        alert(
            "Gas limit tersimpan : "+
            gasLimitInput.value+
            " ppm"
        );

    }

}






// ===============================
// CLOCK
// ===============================


function updateClock(){

    const clock =
    document.getElementById("clock");


    if(clock){

        clock.innerHTML =
        new Date()
        .toLocaleTimeString(
            "id-ID",
            {
                hour12:false
            }
        );

    }

}


setInterval(
updateClock,
1000
);

updateClock();







// ===============================
// ALARM
// ===============================


const alarmPopup =
document.getElementById(
"alarmPopup"
);



function showAlarm(message){


    if(alarmPopup){

        alarmPopup.style.display =
        "flex";

    }


    const text =
    document.getElementById(
    "alarmText"
    );


    if(text){

        text.innerHTML =
        message;

    }


}




function closeAlarm(){

    if(alarmPopup){

        alarmPopup.style.display =
        "none";

    }

}



if(alarmPopup){

alarmPopup.style.display="none";

}





// ===============================
// CHART
// ===============================


let sensorChart;


const canvas =
document.getElementById(
"sensorChart"
);



if(canvas){


sensorChart =
new Chart(
canvas.getContext("2d"),
{

type:"line",

data:{

labels:[],

datasets:[{

label:"MQ-2 Gas ppm",

data:[],

tension:0.3,

fill:true

}]

},


options:{

responsive:true,

animation:false,

scales:{

y:{
beginAtZero:true
}

}

}


});


}




function updateChart(time,value){


if(!sensorChart)
return;


sensorChart.data.labels.push(time);


sensorChart.data.datasets[0]
.data.push(value);



if(
sensorChart.data.labels.length>20
){

sensorChart.data.labels.shift();

sensorChart.data.datasets[0]
.data.shift();

}



sensorChart.update();


}







// ===============================
// HISTORY
// ===============================


const historyBody =
document.getElementById(
"historyData"
);



function addHistory(
time,
flame,
gas,
status
){


if(!historyBody)
return;


const row =
document.createElement(
"tr"
);



row.innerHTML=`

<td>${time}</td>
<td>${flame}</td>
<td>${gas} ppm</td>
<td>${status}</td>

`;



historyBody.prepend(row);



if(historyBody.rows.length>50){

historyBody.deleteRow(50);

}


}







// ===============================
// LOAD SUPABASE HISTORY
// ===============================


async function loadHistory(){


try{


const response =
await fetch("/history");



const data =
await response.json();



data.reverse()
.forEach(item=>{


addHistory(

new Date(
item.created_at
)
.toLocaleTimeString(
"id-ID",
{
hour12:false
}
),


item.flame==1?
"FIRE":
"SAFE",


item.gas,


item.status


);


});



}
catch(error){

console.log(
"History gagal",
error
);

}


}



// loadHistory(); // DISABLE dulu







// ===============================
// CONNECTION STATUS
// ===============================


const dot =
document.getElementById(
"connectionDot"
);


const status =
document.getElementById(
"status"
);



function setConnection(state){


if(status){

status.innerHTML =
state?
"ONLINE":
"OFFLINE";

}



if(dot){

dot.style.background =
state?
"#2ecc71":
"#e74c3c";


dot.style.width="10px";

dot.style.height="10px";

dot.style.borderRadius="50%";

dot.style.display="inline-block";

}


}


setConnection(false);








// ===============================
// MQTT HIVEMQ
// ===============================


const MQTT_URL =
"wss://broker.emqx.io:8084/mqtt";



const MQTT_TOPIC =
"fire/detection";





const mqttClient =
mqtt.connect(
MQTT_URL,
{

clientId:
"fire-dashboard-"+
Math.random()
.toString(16)
.substring(2),


clean:true,


reconnectPeriod:3000


});






mqttClient.on(
"connect",
()=>{


console.log(
"MQTT CONNECTED"
);



setConnection(true);



mqttClient.subscribe(
MQTT_TOPIC
);



});





mqttClient.on(
"close",
()=>{

setConnection(false);

});




mqttClient.on(
"error",
err=>{

console.log(
"MQTT ERROR",
err
);

setConnection(false);

});








// ===============================
// RECEIVE SENSOR
// ===============================


mqttClient.on(
"message",
(topic,message)=>{


if(topic!==MQTT_TOPIC)
return;



let data;


try{


data =
JSON.parse(
message.toString()
);


}

catch(e){

return;

}




updateDashboard(data);



});







// ===============================
// UPDATE DASHBOARD
// ===============================


function updateDashboard(data){



const flame =
Number(data.flame);


const gas =
Number(data.gas)||0;



const status =
data.status || "AMAN";



const danger =
flame===1 ||
status!=="AMAN";






// FLAME


const flameEl =
document.getElementById(
"flame"
);



if(flameEl){

flameEl.innerHTML =
flame?
"🔥 FIRE!":
"SAFE";


flameEl.style.color =
flame?
"#e74c3c":
"#2ecc71";


}





// GAS


const gasEl =
document.getElementById(
"gas"
);



if(gasEl){

gasEl.innerHTML =
gas+" ppm";

}







// STATUS


const statusEl =
document.getElementById(
"sensorStatus"
);



if(statusEl){

statusEl.innerHTML =
status;


statusEl.style.color =
danger?
"#e74c3c":
"#2ecc71";


}








const time =
new Date()
.toLocaleTimeString(
"id-ID",
{
hour12:false
}
);






addHistory(

time,

flame?
"FIRE":
"SAFE",

gas,

status

);





updateChart(
time,
gas
);







// ALARM MODE


const alarmMode =
document.getElementById(
"alarmMode"
);



if(
danger &&
(!alarmMode ||
alarmMode.value==="ON")
){


showAlarm(status);


}
else{


closeAlarm();


}



}



console.log(
"🔥 Fire Detection Dashboard Ready"
);