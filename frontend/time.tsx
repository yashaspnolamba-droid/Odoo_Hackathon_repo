"use client";

import { FormEvent, useState } from "react";

type LeaveType = "paid" | "sick" | "unpaid";
type LeaveStatus = "Pending" | "Approved" | "Rejected";

interface LeaveRequest {
  id: number;
  employee: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  remarks: string;
  status: LeaveStatus;
  adminComment: string;
}

export default function AttendancePage(): JSX.Element {
  const [leaveType, setLeaveType] = useState<LeaveType | "">("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [adminComment, setAdminComment] = useState<string>("");

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (!leaveType || !startDate || !endDate) {
      alert("Please fill all required fields.");
      return;
    }

    if (startDate > endDate) {
      alert("End date cannot be before start date.");
      return;
    }

    const newRequest: LeaveRequest = {
      id: Date.now(),
      employee: "Employee Name",
      leaveType,
      startDate,
      endDate,
      remarks: remarks || "--",
      status: "Pending",
      adminComment: "",
    };

    setLeaveRequests((previousRequests) => [
      ...previousRequests,
      newRequest,
    ]);

    setLeaveType("");
    setStartDate("");
    setEndDate("");
    setRemarks("");
  };

  const handleStatusChange = (
    id: number,
    status: "Approved" | "Rejected"
  ): void => {
    setLeaveRequests((previousRequests) =>
      previousRequests.map((request) =>
        request.id === id
          ? {
              ...request,
              status,
              adminComment,
            }
          : request
      )
    );

    setAdminComment("");
  };

  const getLeaveTypeName = (type: LeaveType): string => {
    if (type === "paid") {
      return "Paid Leave";
    }

    if (type === "sick") {
      return "Sick Leave";
    }

    return "Unpaid Leave";
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="mx-auto max-w-6xl">

        <section className="mb-8">
          <h1 className="text-3xl font-bold">
            Leave & Time-Off
          </h1>

          <p className="mt-2 text-gray-500">
            Apply for leave and manage your time-off requests
          </p>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold">
            Apply for Leave
          </h2>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">
                Leave Type
              </label>

              <select
                value={leaveType}
                onChange={(event) =>
                  setLeaveType(event.target.value as LeaveType | "")
                }
                className="rounded-lg border border-gray-300 p-3"
              >
                <option value="">
                  Select Leave Type
                </option>

                <option value="paid">
                  Paid Leave
                </option>

                <option value="sick">
                  Sick Leave
                </option>

                <option value="unpaid">
                  Unpaid Leave
                </option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">
                Start Date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(event.target.value)
                }
                className="rounded-lg border border-gray-300 p-3"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">
                End Date
              </label>

              <input
                type="date"
                value={endDate}
                onChange={(event) =>
                  setEndDate(event.target.value)
                }
                className="rounded-lg border border-gray-300 p-3"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">
                Remarks
              </label>

              <textarea
                value={remarks}
                onChange={(event) =>
                  setRemarks(event.target.value)
                }
                rows={4}
                placeholder="Add remarks..."
                className="resize-y rounded-lg border border-gray-300 p-3"
              />
            </div>

            <button
              type="submit"
              className="w-fit rounded-lg bg-gray-900 px-5 py-3 font-medium text-white hover:bg-gray-700"
            >
              Submit Leave Request
            </button>
          </form>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold">
            My Leave Requests
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-sm text-gray-500">
                  <th className="px-3 py-3">Leave Type</th>
                  <th className="px-3 py-3">Start Date</th>
                  <th className="px-3 py-3">End Date</th>
                  <th className="px-3 py-3">Remarks</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {leaveRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-b"
                  >
                    <td className="px-3 py-4">
                      {getLeaveTypeName(request.leaveType)}
                    </td>

                    <td className="px-3 py-4">
                      {request.startDate}
                    </td>

                    <td className="px-3 py-4">
                      {request.endDate}
                    </td>

                    <td className="px-3 py-4">
                      {request.remarks}
                    </td>

                    <td className="px-3 py-4">
                      {request.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold">
            Leave Requests
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-sm text-gray-500">
                  <th className="px-3 py-3">Employee</th>
                  <th className="px-3 py-3">Leave Type</th>
                  <th className="px-3 py-3">Start Date</th>
                  <th className="px-3 py-3">End Date</th>
                  <th className="px-3 py-3">Remarks</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {leaveRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-b"
                  >
                    <td className="px-3 py-4">
                      {request.employee}
                    </td>

                    <td className="px-3 py-4">
                      {getLeaveTypeName(request.leaveType)}
                    </td>

                    <td className="px-3 py-4">
                      {request.startDate}
                    </td>

                    <td className="px-3 py-4">
                      {request.endDate}
                    </td>

                    <td className="px-3 py-4">
                      {request.remarks}
                    </td>

                    <td className="px-3 py-4">
                      {request.status}
                    </td>

                    <td className="px-3 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(
                            request.id,
                            "Approved"
                          )
                        }
                        disabled={request.status !== "Pending"}
                        className="mr-2 rounded-lg bg-gray-900 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Approve
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(
                            request.id,
                            "Rejected"
                          )
                        }
                        disabled={request.status !== "Pending"}
                        className="rounded-lg border border-gray-300 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">
            Admin Comment
          </h2>

          <textarea
            value={adminComment}
            onChange={(event) =>
              setAdminComment(event.target.value)
            }
            rows={4}
            placeholder="Add a comment..."
            className="w-full resize-y rounded-lg border border-gray-300 p-3"
          />
        </section>

      </div>
    </main>
  );
}