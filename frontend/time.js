const form = document.querySelector("form");

const leaveType = document.querySelector("#leaveType");
const startDate = document.querySelector("#startDate");
const endDate = document.querySelector("#endDate");
const remarks = document.querySelector("#remarks");

const myRequestsTable = document.querySelectorAll("tbody")[0];
const adminRequestsTable = document.querySelectorAll("tbody")[1];

const adminComment = document.querySelector("#adminComment");

form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (
        leaveType.value === "" ||
        startDate.value === "" ||
        endDate.value === ""
    ) {
        alert("Please fill all required fields.");
        return;
    }

    if (startDate.value > endDate.value) {
        alert("End date cannot be before start date.");
        return;
    }

    const selectedLeave =
        leaveType.options[leaveType.selectedIndex].text;

    const remarkText = remarks.value || "--";

    const employeeRow = document.createElement("tr");

    employeeRow.innerHTML = `
        <td>${selectedLeave}</td>
        <td>${startDate.value}</td>
        <td>${endDate.value}</td>
        <td>${remarkText}</td>
        <td class="status">Pending</td>
    `;

    myRequestsTable.appendChild(employeeRow);

    const adminRow = document.createElement("tr");

    adminRow.innerHTML = `
        <td>Employee Name</td>
        <td>${selectedLeave}</td>
        <td>${startDate.value}</td>
        <td>${endDate.value}</td>
        <td>${remarkText}</td>
        <td class="status">Pending</td>
        <td>
            <button type="button" class="approve">Approve</button>
            <button type="button" class="reject">Reject</button>
        </td>
    `;

    adminRequestsTable.appendChild(adminRow);

    const approveButton = adminRow.querySelector(".approve");
    const rejectButton = adminRow.querySelector(".reject");

    approveButton.addEventListener("click", function () {
        adminRow.querySelector(".status").textContent = "Approved";
        employeeRow.querySelector(".status").textContent = "Approved";

        approveButton.disabled = true;
        rejectButton.disabled = true;
    });

    rejectButton.addEventListener("click", function () {
        adminRow.querySelector(".status").textContent = "Rejected";
        employeeRow.querySelector(".status").textContent = "Rejected";

        approveButton.disabled = true;
        rejectButton.disabled = true;
    });

    form.reset();
});