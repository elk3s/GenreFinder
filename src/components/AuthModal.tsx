import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, Lock, User, LogIn, UserPlus, AlertCircle, Loader2 } from "lucide-react";
import { auth, googleProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "../lib/firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSignInWithGoogle: () => Promise<void>;
}

export default function AuthModal({ isOpen, onClose, onSuccess, onSignInWithGoogle }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "signup") {
        // Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateProfile(userCredential.user, {
            displayName: name.trim(),
          });
        }
      } else {
        // Sign In
        await signInWithEmailAndPassword(auth, email, password);
      }
      
      setIsLoading(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Authentication error:", err);
      setIsLoading(false);
      
      const errorCode = err?.code;
      switch (errorCode) {
        case "auth/email-already-in-use":
          setError("This email address is already in use by another account.");
          break;
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;
        case "auth/user-disabled":
          setError("This user account has been disabled.");
          break;
        case "auth/user-not-found":
          setError("No account found with this email. Please sign up instead.");
          break;
        case "auth/wrong-password":
          setError("Incorrect password. Please try again.");
          break;
        case "auth/weak-password":
          setError("The password is too weak. Please use at least 6 characters.");
          break;
        default:
          setError(err?.message || "An error occurred during authentication.");
      }
    }
  };

  const handleGoogleClick = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await onSignInWithGoogle();
      setIsLoading(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.3 }}
        className="relative w-full max-w-md bg-white rounded-2xl border border-zinc-100 shadow-2xl p-6 overflow-hidden z-10 text-zinc-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            {mode === "signin" ? (
              <LogIn className="w-5 h-5 text-zinc-900" />
            ) : (
              <UserPlus className="w-5 h-5 text-zinc-900" />
            )}
            <h3 className="text-base font-extrabold text-zinc-900 tracking-tight">
              {mode === "signin" ? "Sign In to Your Account" : "Create New Account"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info or Instructions */}
        <p className="text-xs text-zinc-500 leading-relaxed font-medium mb-4">
          {mode === "signin" 
            ? "Sign in to access your curated blends, sync with the cloud vault, and save your progress across any device."
            : "Sign up today to securely back up your customized blends and active work sessions in our cloud vault."
          }
        </p>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "signup" && (
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-50 text-zinc-900 text-sm pl-10 pr-4 py-2 rounded-xl border border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-hidden transition-all"
                  required={mode === "signup"}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-50 text-zinc-900 text-sm pl-10 pr-4 py-2 rounded-xl border border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-hidden transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-50 text-zinc-900 text-sm pl-10 pr-4 py-2 rounded-xl border border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-hidden transition-all"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400 text-white rounded-xl transition-all cursor-pointer font-bold text-sm flex items-center justify-center gap-1.5 shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : mode === "signin" ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-zinc-100"></div>
          <span className="flex-shrink mx-3 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">or</span>
          <div className="flex-grow border-t border-zinc-100"></div>
        </div>

        {/* Google sign-in */}
        <button
          onClick={handleGoogleClick}
          disabled={isLoading}
          className="w-full py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 disabled:bg-zinc-50 text-zinc-800 rounded-xl transition-all font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:shadow-xs"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.66-.23-1.23-.63-1.67-1.11z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Toggle Mode */}
        <div className="mt-5 text-center">
          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
            }}
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-950 transition-colors"
          >
            {mode === "signin" 
              ? "Don't have an account? Sign Up" 
              : "Already have an account? Sign In"
            }
          </button>
        </div>

        {/* Iframe Hint */}
        {typeof window !== "undefined" && window.self !== window.top && (
          <div className="p-2.5 bg-amber-50/70 border border-amber-100 rounded-xl text-left mt-4">
            <p className="text-[9px] text-amber-800 leading-normal font-medium">
              <strong>🔒 Preview Mode:</strong> If popups or operations fail inside the nested iframe, click <strong>"Open in New Tab"</strong> to test full email authentication securely.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
