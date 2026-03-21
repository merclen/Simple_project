// ================= STORAGE =================
let storage = JSON.parse(localStorage.getItem("attendanceSystem")) || {
    todayAttendance: [],
    historyAttendance: [],
    lastReset: ""
};

let data = storage.todayAttendance;

const table = document.getElementById("attendanceTable");
const searchInput = document.getElementById("searchInput");

let sortColumn = "";
let sortAscending = true;

// Store animation timers (FIX)
let counters = {};


// ================= DAILY RESET =================
function dailyResetCheck(){

    let now = new Date();
    let lastReset = storage.lastReset ? new Date(storage.lastReset) : null;

    let resetToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        4,0,0
    );

    if(!lastReset || lastReset < resetToday){

        storage.todayAttendance.forEach(s=>{
            let record = {...s};
            record.date = new Date().toISOString().split("T")[0];
            storage.historyAttendance.push(record);
        });

        storage.todayAttendance = [];
        storage.lastReset = now.toISOString();

        localStorage.setItem("attendanceSystem", JSON.stringify(storage));

        data = storage.todayAttendance;
    }
}

dailyResetCheck();


// ================= CLOCK =================
function updateClock() {
    let now = new Date();

    document.querySelector("#clock .time").innerText =
        now.toLocaleTimeString();
    document.querySelector("#clock .date").innerText =
        now.toLocaleDateString();
}

setInterval(updateClock, 1000);
updateClock();


// ================= INSIDE STATUS =================
function isInside(s){
    return (s.morningCheckIn && !s.morningCheckOut) ||
           (s.afternoonCheckIn && !s.afternoonCheckOut);
}


// ================= FIXED ANIMATION =================
function animateValue(id,start,end,duration){

    const obj = document.getElementById(id);

    // STOP previous animation (FIX)
    if(counters[id]){
        clearInterval(counters[id]);
    }

    if(start === end){
        obj.innerText = end;
        return;
    }

    let range = end - start;
    let current = start;
    let increment = range > 0 ? 1 : -1;

    let stepTime = Math.abs(Math.floor(duration / Math.abs(range)));
    stepTime = stepTime || 10;

    counters[id] = setInterval(function(){

        current += increment;
        obj.innerText = current;

        if(current === end){
            clearInterval(counters[id]);
        }

    },stepTime);
}


// ================= STATS =================
function updateStats(){

    let male = data.filter(s =>
        s.gender === "Male" && isInside(s)
    ).length;

    let female = data.filter(s =>
        s.gender === "Female" && isInside(s)
    ).length;

    let totalToday = data.length;

    let totalVisits = storage.historyAttendance.length + data.length;

    animateValue(
        "maleCount",
        parseInt(document.getElementById("maleCount").innerText)||0,
        male,
        200
    );

    animateValue(
        "femaleCount",
        parseInt(document.getElementById("femaleCount").innerText)||0,
        female,
        200
    );

    animateValue(
        "totalToday",
        parseInt(document.getElementById("totalToday").innerText)||0,
        totalToday,
        200
    );

    animateValue(
        "totalVisits",
        parseInt(document.getElementById("totalVisits").innerText)||0,
        totalVisits,
        200
    );
}


// ================= TABLE =================
function renderTable(list){

    table.innerHTML = "";

    list.forEach(s=>{

        let inside = isInside(s);

        let row = `
        <tr class="${inside ? "status-inside" : "status-outside"}">

        <td>${s.id || "-"}</td>
        <td>${s.name || "-"}</td>
        <td>${s.gender || "-"}</td>

        <td>${s.morningCheckIn || "-"}</td>
        <td>${s.morningCheckOut || "-"}</td>

        <td>${s.afternoonCheckIn || "-"}</td>
        <td>${s.afternoonCheckOut || "-"}</td>

        <td>${inside ? "Inside" : "Outside"}</td>

        </tr>
        `;

        table.innerHTML += row;
    });
}


// ================= SEARCH =================
searchInput.addEventListener("keyup",function(){

    let value = searchInput.value.toLowerCase();

    let filtered = data.filter(s=>

        (s.id && s.id.toLowerCase().includes(value)) ||
        (s.name && s.name.toLowerCase().includes(value))

    );

    renderTable(filtered);
});


// ================= SORT =================
function sortTable(column){

    if(sortColumn === column){
        sortAscending = !sortAscending;
    }else{
        sortAscending = true;
    }

    sortColumn = column;

    data.sort((a,b)=>{

        let valA = a[column] || "";
        let valB = b[column] || "";

        if(valA < valB) return sortAscending ? -1 : 1;
        if(valA > valB) return sortAscending ? 1 : -1;

        return 0;
    });

    renderTable(data);
}


// ================= EXPORT CSV =================
function exportExcel(){

    let csv =
"Student ID,Name,Gender,Morning In,Morning Out,Afternoon In,Afternoon Out\n";

    data.forEach(s=>{
        csv += `${s.id||""},${s.name||""},${s.gender||""},${s.morningCheckIn||""},${s.morningCheckOut||""},${s.afternoonCheckIn||""},${s.afternoonCheckOut||""}\n`;
    });

    let now = new Date();
    let month = now.toLocaleString('default', { month: 'long' });
    let day = now.getDate();

    let fileName = `Attendance_${month}_${day}.csv`;

    let blob = new Blob([csv],{type:"text/csv"});
    let url = window.URL.createObjectURL(blob);

    let a = document.createElement("a");
    a.href = url;
    a.download = fileName;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


// ================= WEEK NUMBER =================
function getWeekNumber(d){

    d = new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));

    let dayNum = d.getUTCDay() || 7;

    d.setUTCDate(d.getUTCDate()+4-dayNum);

    let yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));

    return Math.ceil((((d - yearStart)/86400000)+1)/7);
}


// ================= CHARTS =================
let weeklyChart = null;
let monthlyChart = null;

function renderCharts(){

    let allData = [...storage.historyAttendance,...data];

    let weeklyCounts = {};
    let monthlyCounts = {};

    allData.forEach(s=>{

        if(!s.date) return;

        let d = new Date(s.date);

        let w = getWeekNumber(d);
        let m = d.getMonth()+1;

        weeklyCounts[w] = (weeklyCounts[w] || 0) + 1;
        monthlyCounts[m] = (monthlyCounts[m] || 0) + 1;

    });

    if(weeklyChart) weeklyChart.destroy();
    if(monthlyChart) monthlyChart.destroy();

    weeklyChart = new Chart(document.getElementById("weeklyChart"),{
        type:"bar",
        data:{
            labels:Object.keys(weeklyCounts),
            datasets:[{
                label:"Weekly Attendance",
                data:Object.values(weeklyCounts),
                backgroundColor:"#3b82f6"
            }]
        }
    });

    monthlyChart = new Chart(document.getElementById("monthlyChart"),{
        type:"line",
        data:{
            labels:Object.keys(monthlyCounts),
            datasets:[{
                label:"Monthly Attendance",
                data:Object.values(monthlyCounts),
                backgroundColor:"#10b981",
                borderColor:"#10b981",
                fill:false,
                tension:0.3
            }]
        }
    });
}


// ================= LIVE STORAGE UPDATE =================
window.addEventListener("storage",function(){

    let newStorage = JSON.parse(localStorage.getItem("attendanceSystem"));

    if(!newStorage) return;

    storage = newStorage;
    data = storage.todayAttendance;

    refreshDashboard();
});


// ================= REFRESH =================
function refreshDashboard(){
    renderTable(data);
    updateStats();
    renderCharts();
}


// ================= AUTO REFRESH =================
setInterval(()=>{

    storage = JSON.parse(localStorage.getItem("attendanceSystem")) || storage;
    data = storage.todayAttendance;

    refreshDashboard();

},3000);


// ================= INITIAL LOAD =================
refreshDashboard();