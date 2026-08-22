const salaryForm = document.querySelector("form");

const basicSalaryInput = document.querySelector("#basicSalary");
const allowancesInput = document.querySelector("#allowances");
const deductionsInput = document.querySelector("#deductions");
const netSalaryInput = document.querySelector("#netSalary");

const employeeRow = document.querySelector("tbody tr");

const basicSalaryCell = employeeRow.children[2];
const allowancesCell = employeeRow.children[3];
const deductionsCell = employeeRow.children[4];
const netSalaryCell = employeeRow.children[5];

const editButton = employeeRow.querySelector("button");


function calculateNetSalary() {

    const basicSalary = Number(basicSalaryInput.value) || 0;
    const allowances = Number(allowancesInput.value) || 0;
    const deductions = Number(deductionsInput.value) || 0;

    const netSalary =
        basicSalary + allowances - deductions;

    netSalaryInput.value = netSalary;

    return netSalary;
}


basicSalaryInput.addEventListener("input", calculateNetSalary);

allowancesInput.addEventListener("input", calculateNetSalary);

deductionsInput.addEventListener("input", calculateNetSalary);


salaryForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const netSalary = calculateNetSalary();

    basicSalaryCell.textContent =
        `₹${Number(basicSalaryInput.value).toLocaleString("en-IN")}`;

    allowancesCell.textContent =
        `₹${Number(allowancesInput.value).toLocaleString("en-IN")}`;

    deductionsCell.textContent =
        `₹${Number(deductionsInput.value).toLocaleString("en-IN")}`;

    netSalaryCell.textContent =
        `₹${netSalary.toLocaleString("en-IN")}`;

    alert("Salary structure updated successfully.");
});


editButton.addEventListener("click", function () {

    basicSalaryInput.focus();

    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    });

});