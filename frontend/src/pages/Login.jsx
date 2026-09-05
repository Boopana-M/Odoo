import React, { useState } from 'react';
import { Mail, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/ui/Button';
import { FormField } from '../components/forms/FormField';
import { Input } from '../components/forms/Input';
import { SectionError } from '../components/ui/ErrorState';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Enterprise Login Page for PeoplePay360
 * Features client-side validation, backend auth submission, loading states, and dark-mode styling.
 */
export function Login() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate form fields before submission
  const validateForm = () => {
    const newErrors = {};

    if (!email || !email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      // Successful login updates AuthContext, transitioning application entry
    } catch (err) {
      setApiError(err.message || 'Invalid credentials or server unavailable. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 selection:bg-blue-600 selection:text-white">
      {/* Centered Login Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 sm:p-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-3">
            P
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">PeoplePay360</h1>
          <p className="text-sm text-slate-400 mt-1">HR &amp; Payroll Enterprise Platform</p>
        </div>

        {/* Global / API Submission Error Presentation */}
        {apiError && (
          <SectionError
            title="Authentication Failed"
            message={apiError}
            className="mb-6 !bg-red-950/40 !border-red-800/60 !text-red-300"
          />
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email Address Field */}
          <FormField
            label="Email Address"
            htmlFor="login-email"
            required
            error={errors.email}
            className="[&_label]:!text-slate-300"
          >
            <Input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              error={Boolean(errors.email)}
              leftIcon={<Mail size={16} />}
              disabled={isSubmitting}
              className="!bg-slate-800/80 !text-white !border-slate-700 focus:!border-blue-500 placeholder:!text-slate-500"
            />
          </FormField>

          {/* Password Field */}
          <FormField
            label="Password"
            htmlFor="login-password"
            required
            error={errors.password}
            className="[&_label]:!text-slate-300"
          >
            <Input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) {
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              error={Boolean(errors.password)}
              leftIcon={<Lock size={16} />}
              disabled={isSubmitting}
              className="!bg-slate-800/80 !text-white !border-slate-700 focus:!border-blue-500 placeholder:!text-slate-500"
            />
          </FormField>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="w-full justify-center !bg-blue-600 hover:!bg-blue-500 active:!bg-blue-700 !text-white font-semibold shadow-md"
            >
              Sign In to Account
            </Button>
          </div>
        </form>

        {/* Security & Access Info */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
          <span>Encrypted JWT Enterprise Authentication</span>
        </div>
      </div>

      {/* Role Testing Hint Card */}
      <div className="mt-6 w-full max-w-md bg-slate-900/50 border border-slate-800/60 rounded-lg p-3 text-xs text-slate-400 text-center">
        <p className="font-medium text-slate-300 mb-1">Standard Seed Accounts (Password: Password123!)</p>
        <p className="text-[11px] text-slate-500">
          admin@peoplepay360.com · hrmanager@peoplepay360.com · payrolluser@peoplepay360.com · john.doe@peoplepay360.com
        </p>
      </div>
    </div>
  );
}

export default Login;
