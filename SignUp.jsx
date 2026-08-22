import { useState } from "react";
import "./SignUp.css";

const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { id: "number", label: "One number", test: (v) => /[0-9]/.test(v) },
  { id: "special", label: "One special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const EMPLOYEE_ID_REGEX = /^[A-Za-z0-9-]{4,15}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUp() {
  const [form, setForm] = useState({
    employeeId: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Employee",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [stage, setStage] = useState("form"); // form | verify | done
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  const passwordChecks = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(form.password),
  }));
  const passwordValid = passwordChecks.every((c) => c.passed);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validate = () => {
    const next = {};
    if (!EMPLOYEE_ID_REGEX.test(form.employeeId.trim())) {
      next.employeeId = "Enter a valid employee ID (4-15 letters/numbers).";
    }
    if (!EMAIL_REGEX.test(form.email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (!passwordValid) {
      next.password = "Password does not meet all requirements.";
    }
    if (form.confirmPassword !== form.password) {
      next.confirmPassword = "Passwords do not match.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({
      employeeId: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    if (validate()) {
      // Simulate sending a verification email
      setStage("verify");
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setOtpError("Enter the 6-digit code sent to your email.");
      return;
    }
    setOtpError("");
    setStage("done");
  };

  if (stage === "verify") {
    return (
      <div className="signup-page">
        <div className="signup-card">
          <div className="brand-mark">HR</div>
          <h1 className="signup-title">Check your inbox</h1>
          <p className="signup-subtitle">
            We sent a 6-digit verification code to <strong>{form.email}</strong>.
            Enter it below to activate your account.
          </p>
          <form onSubmit={handleVerify} noValidate>
            <div className="field">
              <label htmlFor="otp">Verification code</label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className={otpError ? "input-error" : ""}
              />
              {otpError && <span className="error-text">{otpError}</span>}
            </div>
            <button type="submit" className="primary-btn">
              Verify email
            </button>
            <button
              type="button"
              className="link-btn"
              onClick={() => setStage("form")}
            >
              Back to sign up
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div className="signup-page">
        <div className="signup-card">
          <div className="success-icon">✓</div>
          <h1 className="signup-title">Account verified</h1>
          <p className="signup-subtitle">
            Welcome, {form.employeeId}. Your {form.role.toLowerCase()} account is
            ready to use.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="signup-page">
      <div className="signup-card">
        <div className="brand-mark">HR</div>
        <h1 className="signup-title">Create your account</h1>
        <p className="signup-subtitle">
          Sign up with your employee details to get started.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="employeeId">Employee ID</label>
            <input
              id="employeeId"
              type="text"
              placeholder="e.g. EMP-1024"
              value={form.employeeId}
              onChange={handleChange("employeeId")}
              onBlur={handleBlur("employeeId")}
              className={touched.employeeId && errors.employeeId ? "input-error" : ""}
            />
            {touched.employeeId && errors.employeeId && (
              <span className="error-text">{errors.employeeId}</span>
            )}
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={handleChange("email")}
              onBlur={handleBlur("email")}
              className={touched.email && errors.email ? "input-error" : ""}
            />
            {touched.email && errors.email && (
              <span className="error-text">{errors.email}</span>
            )}
          </div>

          {/* Role is assigned by the system — not selectable by the user */}

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange("password")}
              onBlur={handleBlur("password")}
              className={touched.password && errors.password ? "input-error" : ""}
            />
            <ul className="password-rules">
              {passwordChecks.map((rule) => (
                <li key={rule.id} className={rule.passed ? "rule-passed" : ""}>
                  <span className="rule-dot" />
                  {rule.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="field">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={handleChange("confirmPassword")}
              onBlur={handleBlur("confirmPassword")}
              className={
                touched.confirmPassword && errors.confirmPassword ? "input-error" : ""
              }
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <span className="error-text">{errors.confirmPassword}</span>
            )}
          </div>

          <button type="submit" className="primary-btn">
            Create account
          </button>
        </form>

        <p className="footnote">
          Already have an account? <a href="#">Log in</a>
        </p>
      </div>
    </div>
  );
}