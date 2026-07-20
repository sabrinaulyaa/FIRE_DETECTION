/* =====================================
      FIRE DETECTION IoT DASHBOARD
      FINAL JAVASCRIPT
===================================== */


// ===========================
// SUPABASE CONNECTION
// ===========================


const SUPABASE_URL = "https://bkkrbkfmjyacuyusxgyj.supabase.co";

const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJra3Jia2ZtanlhY3V5dXN4Z3lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDQzNDEsImV4cCI6MjEwMDEyMDM0MX0.8L9toE6tYGDck8zxs8-Berz93j4TvFFD3X00oUTcIp8";


const db =
supabase.createClient(

SUPABASE_URL,

SUPABASE_KEY

);

async function simpanData(gasValue) {

    // Ambil data dengan aman
    const flame =
        document.getElementById("flame")?.innerHTML || "SAFE";

    const status =
        document.getElementById("sensorStatus")?.innerHTML || "AMAN";

    // Simpan ke Supabase
    const { error } = await db
        .from("fire_history")
        .insert([
            {
                flame: flame,
                gas: gasValue,
                status: status
            }
        ]);

    if (error) {
        console.error("Supabase Error:", error);
    } else {
        console.log("✅ Data berhasil disimpan");
    }
}

// ===============================
// SIDEBAR CONTROL
// ===============================


function openPage(pageName, element){


    let pages =
    document.querySelectorAll(".page");


    pages.forEach(page=>{

        page.classList.remove("active");

    });



    let target =
    document.getElementById(pageName);



    if(target){

        target.classList.add("active");

    }




    let menus =
    document.querySelectorAll(".sidebar li");



    menus.forEach(menu=>{

        menu.classList.remove("active");

    });



    if(element){

        element.classList.add("active");

    }


}









// ===============================
// CLOCK
// ===============================


function updateClock(){


    let now = new Date();



    let time =

    now.getHours()
    .toString()
    .padStart(2,"0")

    +

    ":"

    +

    now.getMinutes()
    .toString()
    .padStart(2,"0")

    +

    ":"

    +

    now.getSeconds()
    .toString()
    .padStart(2,"0");



    let clock =
    document.getElementById("clock");



    if(clock){

        clock.innerHTML=time;

    }


}



setInterval(updateClock,1000);

updateClock();









// ===============================
// CHART SETUP
// ===============================


let sensorChart = null;


let chartTime=[];


let chartGas=[];





function initChart(){


    let canvas =
    document.getElementById("sensorChart");



    if(!canvas){

        console.log("Chart tidak ditemukan");

        return;

    }



    let ctx =
    canvas.getContext("2d");




    sensorChart = new Chart(ctx,{



        type:"line",



        data:{


            labels:chartTime,


            datasets:[{

                label:"MQ-2 Gas ppm",

                data:chartGas,

                borderWidth:3,

                tension:0.4

            }]


        },



        options:{


            responsive:true,


            plugins:{


                legend:{


                    labels:{


                        color:"white"


                    }


                }


            },



            scales:{


                x:{


                    ticks:{


                        color:"white"

                    }

                },



                y:{


                    ticks:{


                        color:"white"

                    }


                }



            }


        }



    });



}









function updateChart(value){



    if(!sensorChart){

        return;

    }



    let waktu =
    new Date()
    .toLocaleTimeString();



    chartTime.push(waktu);



    chartGas.push(value);




    if(chartTime.length > 15){


        chartTime.shift();


        chartGas.shift();


    }



    sensorChart.update();



}









// ===============================
// MQTT CONNECTION
// ===============================


let mqttClient = null;




function startMQTT(){



    if(typeof mqtt === "undefined"){


        console.log(
        "MQTT library tidak tersedia"
        );


        return;

    }






    const broker =

    "wss://broker.hivemq.com:8884/mqtt";






    mqttClient = mqtt.connect(broker);







    mqttClient.on("connect",()=>{


        console.log(
        "MQTT CONNECTED"
        );



        let status =
        document.getElementById("status");



        if(status){

            status.innerHTML="ONLINE";

        }



        let dot =
        document.getElementById("connectionDot");



        if(dot){

            dot.style.background="#00ff88";

        }





        mqttClient.subscribe(
        "fire/detection/flame"
        );

        mqttClient.subscribe(
        "fire/detection/gas"
        );

        mqttClient.subscribe(
        "fire/detection/status"
      );



    });









    mqttClient.on("error",(err)=>{


        console.log(
        "MQTT ERROR",
        err
        );


    });







    mqttClient.on("offline",()=>{


        let status =
        document.getElementById("status");


        if(status){

            status.innerHTML="OFFLINE";

        }




        let dot =
        document.getElementById("connectionDot");



        if(dot){

            dot.style.background="red";

        }



    });









    mqttClient.on(
    "message",
    function(topic,message){

// =====================
// STATUS SYSTEM
// =====================


if(topic==="fire/detection/status"){



let status =
message.toString();



let display =
document.getElementById(
"sensorStatus"
);




if(!display){

return;

}




display.innerHTML =
status;





display.className="";





if(status==="AMAN"){



display.classList.add(
"status-safe"
);



}





else if(status==="WASPADA GAS"){



display.classList.add(
"status-warning"
);



}




else if(status==="BAHAYA API"){



display.classList.add(
"status-danger"
);



showAlarm();



}




}


        let data =
        message.toString();





        // =====================
        // FLAME
        // =====================


        if(topic==="fire/detection/flame"){



            let flame =
            document.getElementById("flame");



            let status =
            document.getElementById("sensorStatus");





            if(data==="FIRE"){



                flame.innerHTML=
                "🔥 FIRE";



                status.innerHTML=
                "BAHAYA";



                status.style.color="red";



                showAlarm();



            }



            else{



                flame.innerHTML=
                "SAFE";



                status.style.color="#00ff88";


            }



        }







        // =====================
        // MQ2
        // =====================



        if(topic==="fire/detection/gas"){



            let gas =
            document.getElementById("gas");



            if(gas){

                gas.innerHTML=
                data+" ppm";

            }



            updateChart(
            Number(data)
            );



            addHistory(
            data
            );

            // SIMPAN KE SUPABASE
simpanData(
    Number(data)
);


        }



    });



}









// ===============================
// HISTORY
// ===============================



function addHistory(gas){



    let table =
    document.getElementById("historyData");



    if(!table){

        return;

    }





    let row =
    table.insertRow(0);



    row.insertCell(0)
    .innerHTML =
    new Date()
    .toLocaleTimeString();




    row.insertCell(1)
    .innerHTML =
    document
    .getElementById("flame")
    .innerHTML;




    row.insertCell(2)
    .innerHTML =
    gas+" ppm";




    row.insertCell(3)
    .innerHTML =
    gas > 300
    ?

    "BAHAYA"

    :

    "NORMAL";



}









// ===============================
// ALARM
// ===============================



function showAlarm(){


    let popup =
    document.getElementById("alarmPopup");



    if(popup){

        popup.style.display="flex";

    }


}




function closeAlarm(){


    let popup =
    document.getElementById("alarmPopup");



    if(popup){

        popup.style.display="none";

    }


}









// ===============================
// SETTING
// ===============================



function saveSetting(){



    let limit =
    document
    .getElementById("gasLimit")
    .value;



    alert(

    "Gas limit tersimpan : "

    +

    limit

    +

    " ppm"

    );



}









// ===============================
// START
// ===============================


window.onload=function(){



    console.log(
    "🔥 Dashboard Ready"
    );



    initChart();



    startMQTT();



};