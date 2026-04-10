import React, { useContext, useState } from "react";
import "../styles/ResetPassword.css";
import axios from "axios";
import { Navigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Context } from "../main";

const ResetPassword = () => {
  const { isAuthenticated, setIsAuthenticated, setUser } = useContext(Context);
  const { token } = useParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleResetPassword = async (e) => {
    e.preventDefault();

    // ✅ Check passwords match
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const res = await axios.put(
        `http://localhost:4000/api/v1/user/reset-password/${token}`, // ✅ FIXED URL
        { password, confirmPassword },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // ✅ Success
      toast.success(res.data.message);

      setIsAuthenticated(true);
      setUser(res.data.user);

      // ✅ Redirect after success
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);

    } catch (error) {
      // ✅ Safe error handling
      toast.error(
        error?.response?.data?.message || "Something went wrong"
      );
    }
  };

  // ✅ Redirect if already logged in
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Reset Password</h2>
        <p>Enter your new password below.</p>

        <form className="reset-password-form" onSubmit={handleResetPassword}>
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="reset-input"
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="reset-input"
          />

          <button type="submit" className="reset-btn">
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;