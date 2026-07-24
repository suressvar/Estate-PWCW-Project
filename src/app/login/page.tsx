"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trees, Eye, EyeOff, Lock, User, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    if (username !== "Admin" || password !== "Admin123") {
      setError("Invalid username or password.");
      return;
    }

    setIsLoading(true);

    // Store auth state in cookie/sessionStorage
    setTimeout(() => {
      document.cookie = "estate_authenticated=true; path=/";
      sessionStorage.setItem("user", username);
      router.push("/");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 pb-24 relative overflow-hidden">
      {/* Dynamic breathing ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse [animation-duration:8s]" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse [animation-duration:12s]" />

      <div className="max-w-md w-full bg-white/70 backdrop-blur-md rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-white/80 overflow-hidden relative z-10 transition-all duration-500 ease-out hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(16,185,129,0.12)] hover:border-emerald-500/20 transform -translate-y-2">
        {/* Card Header */}
        <div className="bg-emerald-950/90 p-8 text-center space-y-3 border-b border-white/20 relative overflow-hidden group">
          {/* Subtle moving line reflection on header hover */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
          
          <div className="inline-flex p-3 bg-emerald-500/20 rounded-full text-emerald-400 border border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-transform duration-500 group-hover:scale-110">
            <Trees className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-wide drop-shadow-sm">Ranga Estate</h1>
          <p className="text-xs text-emerald-300 font-semibold tracking-wider uppercase">PWCW Farm Management Portal</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="p-8 space-y-5">
          <div className="text-center pb-2">
            <h2 className="text-xl font-bold text-slate-800 tracking-wide">Account Sign In</h2>
            <p className="text-xs text-slate-500 mt-1">Enter your credentials to access the system</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200/60 rounded-lg text-red-700 text-xs flex items-center gap-2 animate-bounce">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 tracking-wide uppercase">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 transition-colors duration-200" />
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Admin"
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all duration-300"
              />
            </div>
          </div>

          {/* Password Input with Show/Hide Toggle */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 tracking-wide uppercase">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 transition-colors duration-200" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all duration-300"
              />
              <button
                type="button"
                id="toggle-password-visibility"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="login-submit-btn"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 disabled:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-md hover:shadow-emerald-500/20 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer transform hover:scale-[1.01] active:scale-[0.99]"
          >
            {isLoading ? "Authenticating..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
