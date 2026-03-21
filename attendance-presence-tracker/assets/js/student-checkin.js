document.addEventListener("DOMContentLoaded", () => {

    let students = JSON.parse(localStorage.getItem("students")) || [];
    let attendance = JSON.parse(localStorage.getItem("attendance")) || [];

    const schoolInput = document.getElementById("schoolId");
    const message = document.getElementById("message");
    const form = document.getElementById("studentForm");

    window.openModal = function() { document.getElementById("registerModal").style.display = "flex"; }
    window.closeModal = function() { document.getElementById("registerModal").style.display = "none"; }

    // REGISTER STUDENT
    form.addEventListener("submit", function(e){
        e.preventDefault();
        const name = document.getElementById("fullName").value.trim();
        const id = document.getElementById("schoolIdReg").value.trim();
        const gender = document.getElementById("gender").value;
        if(students.find(s=>s.id===id)){
            document.getElementById("registerMessage").innerHTML = `<span class="text-danger">ID already registered!</span>`;
            return;
        }
        students.push({id,name,gender});
        localStorage.setItem("students", JSON.stringify(students));
        document.getElementById("registerMessage").innerHTML = `<span class="text-success">Registered! Refreshing in 3s...</span>`;
        form.reset();
        closeModal();

        // AUTO-REFRESH and FOCUS input
        setTimeout(()=>{
            location.reload();
        }, 3000);
    });

    // MESSAGE
    let messageTimeout;
    function showMessage(text,type){
        if(messageTimeout) clearTimeout(messageTimeout);
        message.innerHTML = `<span class="text-${type} heartbeat">${text}</span>`;
        messageTimeout = setTimeout(()=>{ message.innerHTML=""; },2500);
    }

    // ATTENDANCE
    function getAttendanceRecord(student){
        let record = attendance.find(a=>a.id===student.id);
        if(!record){
            record = {id:student.id,name:student.name,gender:student.gender||"Unknown",morningCheckIn:"",morningCheckOut:"",afternoonCheckIn:"",afternoonCheckOut:""};
            attendance.push(record);
        }
        return record;
    }
    function isInside(record){
        return (record.morningCheckIn && !record.morningCheckOut)||(record.afternoonCheckIn && !record.afternoonCheckOut);
    }
    function checkIn(record){
        let now = new Date().toLocaleTimeString();
        if(isInside(record)){ showMessage("Already IN!","warning"); return; }
        if(!record.morningCheckIn){ record.morningCheckIn=now; } 
        else if(record.morningCheckIn && record.morningCheckOut && !record.afternoonCheckIn){ record.afternoonCheckIn=now; } 
        else{ record.morningCheckIn=now; record.morningCheckOut=""; record.afternoonCheckIn=""; record.afternoonCheckOut=""; }
        showMessage(`Welcome, ${record.name}!`,"success");
        save();
    }
    function checkOut(record){
        let now = new Date().toLocaleTimeString();
        if(!isInside(record)){ showMessage("Already OUT!","warning"); return; }
        if(record.morningCheckIn && !record.morningCheckOut){ record.morningCheckOut=now; } 
        else { record.afternoonCheckOut=now; }
        showMessage(`Goodbye, ${record.name}!`,"danger");
        save();
    }
    function save(){
        localStorage.setItem("attendance", JSON.stringify(attendance));
        updateStats();
    }

    // INPUT
    schoolInput.addEventListener("keyup", function(e){
        if(e.key==="Enter"){
            const id = schoolInput.value.trim();
            if(!id) return;
            let student = students.find(s=>s.id===id);
            if(student){
                let record=getAttendanceRecord(student);
                isInside(record)?checkOut(record):checkIn(record);
            }else{ showMessage("School ID not registered!","danger"); }
            schoolInput.value='';
        }
    });

    // STATS
    function updateStats(){
        let insideList = attendance.filter(r=>isInside(r));
        document.getElementById("insideCount").innerText = insideList.length;
        document.getElementById("maleCount").innerText = insideList.filter(s=>s.gender==="Male").length;
        document.getElementById("femaleCount").innerText = insideList.filter(s=>s.gender==="Female").length;
        document.getElementById("visitCount").innerText = attendance.length;
    }

    // CLOCK
    function updateClock(){
        let now = new Date();
        document.querySelector(".time").innerText = now.toLocaleTimeString();
        document.querySelector(".date").innerText = now.toDateString();
    }
    setInterval(updateClock,1000);

    // INIT
    updateClock();
    updateStats();
    schoolInput.focus(); // ✅ Focus input on page load
});