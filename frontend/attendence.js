const checkInButton = document.querySelector("#checkIn");
const checkOutButton = document.querySelector("#checkOut");

const status = document.querySelector("#status");
const checkInTime = document.querySelector("#checkInTime");
const checkOutTime = document.querySelector("#checkOutTime");

checkOutButton.disabled = true;

checkInButton.addEventListener("click", function () {
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  checkInTime.textContent = time;
  status.textContent = "Present";

  checkInButton.disabled = true;
  checkOutButton.disabled = false;
});

checkOutButton.addEventListener("click", function () {
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  checkOutTime.textContent = time;

  checkInButton.disabled = false;
  checkOutButton.disabled = true;
});