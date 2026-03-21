// ELEMENTS
const table = document.getElementById("studentTable");
const searchInput = document.getElementById("search");
const noData = document.getElementById("noData");
const countDisplay = document.getElementById("studentCount");

const form = document.getElementById("studentForm");
const message = document.getElementById("message");

const fullName = document.getElementById("fullName");
const schoolId = document.getElementById("schoolId");
const gender = document.getElementById("gender");
const editIndexInput = document.getElementById("editIndex");

const modalElement = document.getElementById("registerModal");
const modal = new bootstrap.Modal(modalElement);
const modalTitle = document.getElementById("modalTitle");

// DATA
let students = JSON.parse(localStorage.getItem("students")) || [];
let sortDirection = 1;
let currentSort = "name";

// DISPLAY
function displayStudents(data) {
    table.innerHTML = "";
    if (data.length === 0) {
        noData.textContent = "No registered students found.";
        countDisplay.textContent = "Total Students: 0";
        return;
    }
    noData.textContent = "";
    countDisplay.textContent = "Total Students: " + data.length;

    table.innerHTML = data.map((s, i) => `
        <tr>
            <td>${s.name}</td>
            <td>${s.id}</td>
            <td>${s.gender}</td>
            <td><span class="badge bg-success">Registered</span></td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editStudent(${i})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteStudent(${i})">Delete</button>
            </td>
        </tr>
    `).join("");
}

// SORT
function sortTable(field) {
    if (currentSort === field) sortDirection *= -1;
    else { currentSort = field; sortDirection = 1; }

    students.sort((a, b) => a[field].localeCompare(b[field]) * sortDirection);
    displayStudents(students);
}

// SEARCH
searchInput.addEventListener("keyup", () => {
    const value = searchInput.value.toLowerCase();
    const filtered = students.filter(s =>
        s.name.toLowerCase().includes(value) ||
        s.id.toLowerCase().includes(value)
    );
    displayStudents(filtered);
});

// REGISTER BUTTON
document.getElementById("openRegister").addEventListener("click", () => {
    form.reset();
    editIndexInput.value = "";
    message.innerHTML = "";
    modalTitle.textContent = "Register Student";
    modal.show();
});

// ADD / EDIT
form.addEventListener("submit", e => {
    e.preventDefault();
    const name = fullName.value.trim();
    const id = schoolId.value.trim();
    const genderValue = gender.value;
    const editIndex = editIndexInput.value;

    const exists = students.some((s, i) => s.id === id && i != editIndex);
    if (exists) { message.innerHTML = `<span class="text-danger">ID already exists!</span>`; return; }

    const student = { name, id, gender: genderValue };
    if (editIndex === "") students.push(student);
    else students[editIndex] = student;

    localStorage.setItem("students", JSON.stringify(students));
    form.reset();
    editIndexInput.value = "";
    message.innerHTML = `<span class="text-success">Saved!</span>`;
    displayStudents(students);
    setTimeout(() => { modal.hide(); message.innerHTML = ""; }, 800);
});

// EDIT
function editStudent(index) {
    const s = students[index];
    fullName.value = s.name;
    schoolId.value = s.id;
    gender.value = s.gender;
    editIndexInput.value = index;
    modalTitle.textContent = "Edit Student";
    modal.show();
}

// DELETE
function deleteStudent(index) {
    if (confirm("Delete this student?")) {
        students.splice(index, 1);
        localStorage.setItem("students", JSON.stringify(students));
        displayStudents(students);
    }
}

// INIT
students.sort((a, b) => a.name.localeCompare(b.name));
displayStudents(students);