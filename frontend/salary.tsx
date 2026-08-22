"use client";

import { useState, type JSX } from "react";

interface Employee {
  id: string;
  name: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
}

export default function PayrollPage(): JSX.Element {
  const [employee, setEmployee] = useState<Employee>({
    id: "EMP001",
    name: "Rohan Sharma",
    basicSalary: 40000,
    allowances: 8000,
    deductions: 3000,
  });

  const [basicSalary, setBasicSalary] = useState<number>(
    employee.basicSalary
  );

  const [allowances, setAllowances] = useState<number>(
    employee.allowances
  );

  const [deductions, setDeductions] = useState<number>(
    employee.deductions
  );

  const [saved, setSaved] = useState<boolean>(false);

  const netSalary: number =
    basicSalary + allowances - deductions;

  const handleSaveChanges = (): void => {
    setEmployee({
      ...employee,
      basicSalary,
      allowances,
      deductions,
    });

    setSaved(true);
  };

  const handleEdit = (): void => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">

      {/* Page Header */}

      <section className="mx-auto mb-8 max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900">
          Payroll & Salary
        </h1>

        <p className="mt-2 text-gray-500">
          View and manage payroll information
        </p>
      </section>


      {/* Employee Payroll */}

      <section className="mx-auto mb-6 max-w-6xl rounded-2xl bg-white p-6 shadow-sm">

        <h2 className="mb-6 text-2xl font-semibold text-gray-900">
          Employee Payroll
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          <div className="rounded-xl bg-gray-50 p-5">
            <p className="text-sm text-gray-500">
              Employee Name
            </p>

            <p className="mt-2 text-lg font-semibold text-gray-900">
              {employee.name}
            </p>
          </div>


          <div className="rounded-xl bg-gray-50 p-5">
            <p className="text-sm text-gray-500">
              Employee ID
            </p>

            <p className="mt-2 text-lg font-semibold text-gray-900">
              {employee.id}
            </p>
          </div>


          <div className="rounded-xl bg-gray-50 p-5">
            <p className="text-sm text-gray-500">
              Pay Period
            </p>

            <p className="mt-2 text-lg font-semibold text-gray-900">
              August 2026
            </p>
          </div>


          <div className="rounded-xl bg-gray-50 p-5">
            <p className="text-sm text-gray-500">
              Basic Salary
            </p>

            <p className="mt-2 text-lg font-semibold text-gray-900">
              {formatCurrency(employee.basicSalary)}
            </p>
          </div>


          <div className="rounded-xl bg-gray-50 p-5">
            <p className="text-sm text-gray-500">
              Allowances
            </p>

            <p className="mt-2 text-lg font-semibold text-gray-900">
              {formatCurrency(employee.allowances)}
            </p>
          </div>


          <div className="rounded-xl bg-gray-50 p-5">
            <p className="text-sm text-gray-500">
              Deductions
            </p>

            <p className="mt-2 text-lg font-semibold text-gray-900">
              {formatCurrency(employee.deductions)}
            </p>
          </div>


          <div className="rounded-xl bg-indigo-50 p-5">
            <p className="text-sm text-gray-500">
              Net Salary
            </p>

            <p className="mt-2 text-lg font-semibold text-gray-900">
              {formatCurrency(
                employee.basicSalary +
                employee.allowances -
                employee.deductions
              )}
            </p>
          </div>

        </div>

      </section>


      {/* Admin Payroll Control */}

      <section className="mx-auto max-w-6xl rounded-2xl bg-white p-6 shadow-sm">

        <h2 className="mb-6 text-2xl font-semibold text-gray-900">
          Admin Payroll Control
        </h2>


        {/* Employee List */}

        <div>

          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Employee List
          </h3>

          <div className="overflow-x-auto">

            <table className="w-full border-collapse">

              <thead>
                <tr className="border-b border-gray-200 text-left">

                  <th className="p-3 text-sm text-gray-500">
                    Employee ID
                  </th>

                  <th className="p-3 text-sm text-gray-500">
                    Employee Name
                  </th>

                  <th className="p-3 text-sm text-gray-500">
                    Basic Salary
                  </th>

                  <th className="p-3 text-sm text-gray-500">
                    Allowances
                  </th>

                  <th className="p-3 text-sm text-gray-500">
                    Deductions
                  </th>

                  <th className="p-3 text-sm text-gray-500">
                    Net Salary
                  </th>

                  <th className="p-3 text-sm text-gray-500">
                    Action
                  </th>

                </tr>
              </thead>


              <tbody>

                <tr className="border-b border-gray-200">

                  <td className="p-3">
                    {employee.id}
                  </td>

                  <td className="p-3">
                    {employee.name}
                  </td>

                  <td className="p-3">
                    {formatCurrency(employee.basicSalary)}
                  </td>

                  <td className="p-3">
                    {formatCurrency(employee.allowances)}
                  </td>

                  <td className="p-3">
                    {formatCurrency(employee.deductions)}
                  </td>

                  <td className="p-3 font-semibold">
                    {formatCurrency(
                      employee.basicSalary +
                      employee.allowances -
                      employee.deductions
                    )}
                  </td>

                  <td className="p-3">

                    <button
                      type="button"
                      onClick={handleEdit}
                      className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
                    >
                      Edit
                    </button>

                  </td>

                </tr>

              </tbody>

            </table>

          </div>

        </div>


        {/* Salary Structure */}

        <div className="mt-8 border-t border-gray-200 pt-6">

          <h3 className="mb-5 text-lg font-semibold text-gray-900">
            Salary Structure
          </h3>


          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">


            {/* Basic Salary */}

            <div>

              <label
                htmlFor="basicSalary"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Basic Salary
              </label>

              <input
                id="basicSalary"
                type="number"
                value={basicSalary}
                onChange={(event) =>
                  setBasicSalary(Number(event.target.value))
                }
                className="w-full rounded-lg border border-gray-300 p-3"
              />

            </div>


            {/* Allowances */}

            <div>

              <label
                htmlFor="allowances"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Allowances
              </label>

              <input
                id="allowances"
                type="number"
                value={allowances}
                onChange={(event) =>
                  setAllowances(Number(event.target.value))
                }
                className="w-full rounded-lg border border-gray-300 p-3"
              />

            </div>


            {/* Deductions */}

            <div>

              <label
                htmlFor="deductions"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Deductions
              </label>

              <input
                id="deductions"
                type="number"
                value={deductions}
                onChange={(event) =>
                  setDeductions(Number(event.target.value))
                }
                className="w-full rounded-lg border border-gray-300 p-3"
              />

            </div>


            {/* Net Salary */}

            <div>

              <label
                htmlFor="netSalary"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Net Salary
              </label>

              <input
                id="netSalary"
                type="number"
                value={netSalary}
                readOnly
                className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 p-3"
              />

            </div>

          </div>


          {/* Save Changes */}

          <button
            type="button"
            onClick={handleSaveChanges}
            className="mt-6 rounded-lg bg-gray-900 px-5 py-3 text-white hover:bg-gray-700"
          >
            Save Changes
          </button>


          {saved && (
            <p className="mt-3 text-sm text-green-600">
              Salary structure updated successfully.
            </p>
          )}

        </div>

      </section>

    </main>
  );
}