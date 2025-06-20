"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PasswordInput from "../components/PasswordInput";
import Logo from "../components/Logo";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res.ok) {
      const userRes = await fetch("/api/me");
      const user = await userRes.json();

      if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } else {
      setLoading(false);
      toast.error(res.error || "Login failed. Please check your credentials.", {
        position: "top-right",
        autoClose: 4000,
        theme: "colored",
      });
    }
  }

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-yellow-100 p-6 sm:p-12 md:p-20 space-y-10 md:space-y-0 md:space-x-10">
        <div className="md:hidden mb-4">
          <Logo className="mx-auto mb-4 text-5xl" />
          <p className="text-base text-amber-700 text-center drop-shadow-md">
            We're happy to see you again.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white bg-opacity-90 border border-amber-300 shadow-lg rounded-lg w-full max-w-md p-8 flex flex-col space-y-6"
          aria-label="Login Form"
        >
          <h1 className="text-5xl font-bold text-amber-700">Login</h1>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-amber-300 p-3 placeholder-amber-400 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
          />

          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full"
            id="login-password"
            name="login-password"
          />

          <button
            type="submit"
            disabled={loading}
            className={`${
              loading ? "opacity-60 cursor-not-allowed" : ""
            } bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white rounded-lg px-6 py-3 font-semibold shadow-md transition`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="hidden md:block text-left max-w-md">
          <Logo className="mb-5 text-5xl" />
          <p className="text-2xl font-semibold text-amber-700 tracking-wide mb-2">
            Welcome Back!
          </p>
          <p className="text-base text-amber-700 drop-shadow-md">
            We're happy to see you again. Please log in to continue exploring the dashboard and managing your tasks efficiently.
          </p>
        </div>
      </div>
    </>
  );
}
