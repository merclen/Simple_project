// Initialize data for historical reports
let storage = JSON.parse(localStorage.getItem("attendanceSystem")) || { todayAttendance: [], historyAttendance: [], lastReset: "" };

// Filter data based on period (week, month, year)
function filterByPeriod(data, period) {
    let now = new Date();
    if (period === "week") {
        let week = getWeekNumber(now);
        return data.filter(d => getWeekNumber(new Date(d.date)) === week);
    }
    else if (period === "month") {
        let month = now.getMonth() + 1;
        return data.filter(d => new Date(d.date).getMonth() + 1 === month);
    }
    else if (period === "year") {
        let year = now.getFullYear();
        return data.filter(d => new Date(d.date).getFullYear() === year);
    }
    else return data;
}

// Export multi-sheet Excel file (weekly, monthly, yearly, full)
function exportExcelMultiSheet(period) {
    let allData = [...storage.historyAttendance];
    if (period !== "full") allData = filterByPeriod(allData, period);

    let sheets = {};
    if (period === "year") {
        // group by month
        allData.forEach(s => {
            let monthName = new Date(s.date).toLocaleString('default', { month: 'long' });
            sheets[monthName] = sheets[monthName] || [];
            sheets[monthName].push(s);
        });
    } else if (period === "month") {
        // group by week
        allData.forEach(s => {
            let weekNum = getWeekNumber(new Date(s.date));
            let sheetName = "Week " + weekNum;
            sheets[sheetName] = sheets[sheetName] || [];
            sheets[sheetName].push(s);
        });
    } else if (period === "full") {
        // group by year
        allData.forEach(s => {
            let year = new Date(s.date).getFullYear();
            sheets[year] = sheets[year] || [];
            sheets[year].push(s);
        });
    }

    // Create Excel workbook
    let wb = XLSX.utils.book_new();
    for (let sheetName in sheets) {
        let ws_data = [["Student ID", "Name", "Gender", "Date", "Morning In", "Morning Out", "Afternoon In", "Afternoon Out"]];
        sheets[sheetName].forEach(s => {
            ws_data.push([s.id || "", s.name || "", s.gender || "", s.date || "", s.morningCheckIn || "", s.morningCheckOut || "", s.afternoonCheckIn || "", s.afternoonCheckOut || ""]);
        });
        let ws = XLSX.utils.aoa_to_sheet(ws_data);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }

    // Export to Excel
    XLSX.writeFile(wb, `Attendance_${period}.xlsx`);
}