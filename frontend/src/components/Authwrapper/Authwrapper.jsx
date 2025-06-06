import React, { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../../utils/authConfig";
import { useNavigate, useLocation } from "react-router-dom";
import { ScaleLoader } from "react-spinners";
import "./Authwrapper.css";
import logo from "../../assets/icons/logo.svg";
import Sidebar from "../Sidebar/Sidebar";

const AuthWrapper = ({ children }) => {
  const { instance, accounts, inProgress } = useMsal();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMsalInitialized, setIsMsalInitialized] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const initializeMsal = async () => {
      try {
        await instance.initialize();

        const response = await instance.handleRedirectPromise();

        if (response) {

          if (response.state === "/") {
            navigate("/new-chat");
          }

          else if (response.state) {
            navigate(response.state);
          }
        }

        setIsMsalInitialized(true);
      } catch (error) {
        console.error("MSAL Initialization Error:", error);
      }
    };

    initializeMsal();
  }, [instance, navigate]);

  const handleLogin = () => {
    if (inProgress !== "none") {
      return;
    }

    let currentPath = location.pathname + location.search;

    if (currentPath === "/") {
      currentPath = "/new-chat";
    }

    instance.loginRedirect({
      ...loginRequest,
      state: currentPath,
      prompt: "select_account",
      redirectStartPage: window.location.href,
    });
  };

  const handleLogout = () => {
    const logoutRequest = {
      account: instance.getActiveAccount(),
      postLogoutRedirectUri: window.location.origin,
      onRedirectNavigate: () => {
        window.sessionStorage.clear();
        window.localStorage.clear();
        return true;
      },
    };

    instance.logoutRedirect(logoutRequest);
  };

  if (!isMsalInitialized) {
    return (
      <div className="login-wrapper" style={{ marginTop: "28px" }}>
        <ScaleLoader color="#DA3832" size={70} />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="login-wrapper">
        <div className="login-box">
          <img src={logo} alt="Company Logo" className="company-logo" />
          <h2 className="sign-in-text">
            Authenticate your account by logging into Tractor Supply Company's
            single sign-on provider.
          </h2>
          {/* Disable button during interaction */}
          <button
            onClick={handleLogin}
            className="ms-login-btn"
            disabled={inProgress !== "none"}
          >
            {inProgress === "login" ? "Logging in..." : "Login"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar
        name={accounts[0]?.name}
        handleLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className={`main-content ${isSidebarCollapsed ? "collapsed" : ""}`}>
        {children}
      </div>
    </div>
  );
};

export default AuthWrapper;
