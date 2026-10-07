import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Loader2,
  LogOut,
  User,
  ShieldCheck,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import "./App.css";

function App() {
  const [isRegister, setIsRegister] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [user, setUser] = useState(null);

  // ========================================
  // TOAST
  // ========================================
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({
      type,
      message,
    });
  };

  const closeToast = () => {
    setToast(null);
  };

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast]);

  // ========================================
  // CHECK AUTH
  // ========================================
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setCheckingAuth(false);
        return;
      }

      try {
        const response = await axios.get(
          "http://localhost:3000/api/auth/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setUser(response.data.user);
      } catch (error) {
        console.error("Auth check error:", error);

        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // ========================================
  // LOGIN
  // ========================================
  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Email dan password wajib diisi.");

      showToast(
        "error",
        "Email dan password wajib diisi."
      );

      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:3000/api/auth/login",
        {
          email,
          password,
        }
      );

      const token = response.data.token;

      localStorage.setItem("token", token);

      const userResponse = await axios.get(
        "http://localhost:3000/api/auth/me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUser(userResponse.data.user);
    } catch (error) {
      console.error("Login error:", error);

      const message =
        error.response?.data?.message ||
        "Email atau password salah.";

      setError(message);

      showToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // REGISTER
  // ========================================
  const handleRegister = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      const message = "Semua field wajib diisi.";

      setError(message);
      showToast("error", message);

      return;
    }

    if (password.length < 6) {
      const message =
        "Password minimal 6 karakter.";

      setError(message);
      showToast("error", message);

      return;
    }

    if (password !== confirmPassword) {
      const message =
        "Konfirmasi password tidak cocok.";

      setError(message);
      showToast("error", message);

      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:3000/api/auth/register",
        {
          name,
          email,
          password,
        }
      );

      console.log(
        "Register response:",
        response.data
      );

      // Bersihkan form
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      // Toast sukses
      showToast(
        "success",
        "Akun berhasil dibuat! Silakan login."
      );

      // Pindah ke login
      setIsRegister(false);
    } catch (error) {
      console.error("Register error:", error);

      const message =
        error.response?.data?.message ||
        "Registrasi gagal.";

      setError(message);

      showToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // GOOGLE LOGIN
  // ========================================
  const handleGoogleLogin = async (
    credentialResponse
  ) => {
    if (loading) return;

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await axios.post(
        "http://localhost:3000/api/auth/google",
        {
          credential:
            credentialResponse.credential,
        }
      );

      const token = response.data.token;

      localStorage.setItem("token", token);

      const meResponse = await axios.get(
        "http://localhost:3000/api/auth/me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUser(meResponse.data.user);
    } catch (error) {
      console.error(
        "Google Login Error:",
        error
      );

      const message =
        error.response?.data?.message ||
        "Login dengan Google gagal.";

      setError(message);

      showToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // LOGOUT
  // ========================================
  const handleLogout = () => {
    localStorage.removeItem("token");

    setUser(null);

    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");

    setError("");
    setSuccess("");

    setIsRegister(false);

    showToast(
      "success",
      "Kamu berhasil logout."
    );
  };

  // ========================================
  // SWITCH LOGIN / REGISTER
  // ========================================
  const switchMode = () => {
    if (loading) return;

    setIsRegister(!isRegister);

    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");

    setError("");
    setSuccess("");

    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // ========================================
  // CHECKING AUTH
  // ========================================
  if (checkingAuth) {
    return (
      <main className="login-page">
        <motion.div
          className="loading-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Loader2
            size={32}
            className="loading-icon"
          />

          <p>Checking authentication...</p>
        </motion.div>
      </main>
    );
  }

  // ========================================
  // DASHBOARD
  // ========================================
  if (user) {
    return (
      <main className="dashboard-page">

        {/* TOAST */}
        <Toast
          toast={toast}
          onClose={closeToast}
        />

        <motion.div
          className="dashboard-card"
          initial={{
            opacity: 0,
            y: 25,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.6,
            ease: "easeOut",
          }}
        >
          <div className="dashboard-top">
            <div className="dashboard-logo">
              ✦
            </div>

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>

          <div className="dashboard-welcome">
            <div className="user-avatar">
              {user.name
                ?.charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <p className="welcome-label">
                Welcome back 👋
              </p>

              <h1>{user.name}</h1>

              <p className="user-email">
                {user.email}
              </p>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="info-card">
              <div className="info-icon">
                <User size={20} />
              </div>

              <div>
                <span>Name</span>
                <strong>{user.name}</strong>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <Mail size={20} />
              </div>

              <div>
                <span>Email</span>
                <strong>{user.email}</strong>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <ShieldCheck size={20} />
              </div>

              <div>
                <span>Authentication</span>
                <strong>
                  {user.provider === "local"
                    ? "Email & Password"
                    : "Google"}
                </strong>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                ✓
              </div>

              <div>
                <span>Status</span>
                <strong className="status-active">
                  Authenticated
                </strong>
              </div>
            </div>
          </div>

          <div className="dashboard-message">
            <ShieldCheck size={21} />

            <div>
              <strong>
                Authentication successful
              </strong>

              <p>
                Your JWT token has been verified
                by the backend.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="background-orb orb-one" />
        <div className="background-orb orb-two" />
        <div className="background-orb orb-three" />
      </main>
    );
  }

  // ========================================
  // LOGIN / REGISTER
  // ========================================
  return (
    <main className="login-page">

      {/* TOAST */}
      <Toast
        toast={toast}
        onClose={closeToast}
      />

      <motion.div
        className="login-card"
        initial={{
          opacity: 0,
          y: 25,
          scale: 0.97,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.6,
          ease: "easeOut",
        }}
      >
        <div className="login-header">
          <motion.div
            className="logo"
            key={
              isRegister
                ? "register"
                : "login"
            }
            initial={{
              scale: 0,
              rotate: -20,
            }}
            animate={{
              scale: 1,
              rotate: 0,
            }}
            transition={{
              duration: 0.45,
              type: "spring",
            }}
          >
            {isRegister ? (
              <UserPlus size={25} />
            ) : (
              "✦"
            )}
          </motion.div>

          <motion.div
            key={
              isRegister
                ? "register-title"
                : "login-title"
            }
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
          >
            <h1>
              {isRegister
                ? "Create account"
                : "Welcome back"}
            </h1>

            <p>
              {isRegister
                ? "Create your account to get started"
                : "Sign in to continue to your account"}
            </p>
          </motion.div>
        </div>

        <form
          className="login-form"
          onSubmit={
            isRegister
              ? handleRegister
              : handleLogin
          }
        >
          {/* NAME */}
          {isRegister && (
            <motion.div
              className="input-group"
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                height: "auto",
              }}
            >
              <label htmlFor="name">
                Full name
              </label>

              <div className="input-wrapper">
                <User size={19} />

                <input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  disabled={loading}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                />
              </div>
            </motion.div>
          )}

          {/* EMAIL */}
          <div className="input-group">
            <label htmlFor="email">
              Email
            </label>

            <div className="input-wrapper">
              <Mail size={19} />

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                disabled={loading}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="input-group">
            <label htmlFor="password">
              Password
            </label>

            <div className="input-wrapper">
              <LockKeyhole size={19} />

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={password}
                disabled={loading}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />

              <button
                type="button"
                className="password-toggle"
                disabled={loading}
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
          </div>

          {/* CONFIRM PASSWORD */}
          {isRegister && (
            <motion.div
              className="input-group"
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                height: "auto",
              }}
            >
              <label htmlFor="confirmPassword">
                Confirm password
              </label>

              <div className="input-wrapper">
                <LockKeyhole size={19} />

                <input
                  id="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  disabled={loading}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                />

                <button
                  type="button"
                  className="password-toggle"
                  disabled={loading}
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* LOGIN OPTIONS */}
          {!isRegister && (
            <div className="form-options">
              <label className="remember">
                <input
                  type="checkbox"
                  disabled={loading}
                />

                <span>
                  Remember me
                </span>
              </label>

              <button
                type="button"
                className="forgot-password"
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* SUBMIT */}
          <motion.button
            type="submit"
            className="login-button"
            whileHover={{
              scale: loading ? 1 : 1.02,
            }}
            whileTap={{
              scale: loading ? 1 : 0.98,
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2
                  size={18}
                  className="loading-icon"
                />

                {isRegister
                  ? "Creating account..."
                  : "Signing in..."}
              </>
            ) : isRegister ? (
              "Create account"
            ) : (
              "Sign in"
            )}
          </motion.button>
        </form>

        {/* GOOGLE */}
        <div className="divider">
          <span>
            or continue with
          </span>
        </div>

        <div
          className="google-button-wrapper"
          style={{
            opacity: loading ? 0.55 : 1,
            pointerEvents: loading
              ? "none"
              : "auto",
            transition:
              "opacity 0.2s ease",
          }}
        >
          <GoogleLogin
            onSuccess={
              handleGoogleLogin
            }
            onError={() => {
              setLoading(false);

              const message =
                "Login dengan Google gagal.";

              setError(message);
              showToast("error", message);
            }}
            useOneTap={false}
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
            width="300"
          />
        </div>

        {/* SWITCH */}
        <p className="signup-text">
          {isRegister
            ? "Already have an account?"
            : "Don't have an account?"}

          <button
            type="button"
            onClick={switchMode}
            disabled={loading}
          >
            {isRegister
              ? "Sign in"
              : "Create account"}
          </button>
        </p>
      </motion.div>

      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />
      <div className="background-orb orb-three" />
    </main>
  );
}

// ========================================
// TOAST COMPONENT
// ========================================
function Toast({ toast, onClose }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          className={`toast toast-${toast.type}`}
          initial={{
            opacity: 0,
            x: 80,
            scale: 0.95,
          }}
          animate={{
            opacity: 1,
            x: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            x: 80,
            scale: 0.95,
          }}
          transition={{
            duration: 0.25,
            ease: "easeOut",
          }}
        >
          <div className="toast-icon">
            {toast.type === "success" ? (
              <CheckCircle2 size={21} />
            ) : (
              <AlertCircle size={21} />
            )}
          </div>

          <div className="toast-content">
            <strong>
              {toast.type === "success"
                ? "Success"
                : "Something went wrong"}
            </strong>

            <span>{toast.message}</span>
          </div>

          <button
            className="toast-close"
            onClick={onClose}
            type="button"
            aria-label="Close notification"
          >
            <X size={17} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;