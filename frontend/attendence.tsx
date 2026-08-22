"use client";

import { useState } from "react";

export default function AttendancePage() {
  const [checkedIn, setCheckedIn] = useState<boolean>(false);

  const handleCheckIn = (): void => {
    setCheckedIn(true);
  };

  const handleCheckOut = (): void => {
    setCheckedIn(false);
  };

  return (
    <main>
      <h1>Attendance</h1>

      <p>Track and manage your daily attendance</p>

      <section>
        <h2>Today's Attendance</h2>

        <button onClick={handleCheckIn}>
          Check In
        </button>

        <button onClick={handleCheckOut}>
          Check Out
        </button>

        <p>
          Status: {checkedIn ? "Present" : "Not Checked In"}
        </p>
      </section>
    </main>
  );
}