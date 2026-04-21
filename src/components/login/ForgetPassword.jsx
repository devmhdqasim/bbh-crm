import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import logo from '../../assets/images/logo.svg';

const APP_VERSION = __APP_VERSION__ || '1.0.0';

const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
});

export default function ForgetPassword({
  login,
  loginBy,
  onNext,
  onBack,
  setCurrentStep
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const formik = useFormik({
    initialValues: {
      email: loginBy === 'email' ? login : '',
    },
    validationSchema: ForgotPasswordSchema,
    onSubmit: async (values) => {
      setIsLoading(true);

      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        toast.success('Reset link sent to your email!', {
          style: {
            background: '#4a1015',
            color: '#dea402',
            border: '1px solid #dea402',
          },
          iconTheme: {
            primary: '#dea402',
            secondary: '#4a1015',
          },
        });
        onNext();
      }, 1500);
    },
  });

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && formik.isValid && !isLoading) {
      e.preventDefault();
      formik.handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-[#1a0405] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Cinematic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(222,164,2,0.12),transparent_60%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(222,164,2,0.04),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(74,16,21,0.3),transparent_50%)]"></div>
      </div>

      <div className={`w-full max-w-md relative z-10 transition-all duration-1000 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute -top-12 left-0 text-[#dea402]/80 hover:text-[#dea402] flex items-center gap-2 transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Login</span>
        </button>

        {/* Card Container */}
        <div className="bg-[#37090b]/60 backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-8 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden">

          {/* Top shine border */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-0.5 bg-gradient-to-r from-transparent via-[#dea402] to-transparent rounded-full"></div>

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src={logo} alt="BBH Logo" className="h-16 w-auto object-contain" />
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Forgot Password?
            </h1>
            <p className="text-[#dea402]/80 text-sm font-medium">
              Enter your email to receive a reset link
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">

            {/* Email Field */}
            <div className="relative group">
              <input
                type="email"
                id="email"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={(e) => {
                  formik.handleBlur(e);
                  setIsFocused(false);
                }}
                onFocus={() => setIsFocused(true)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className={`w-full px-4 py-4 bg-white/[0.04] text-white rounded-xl border transition-all duration-300 placeholder-gray-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${formik.touched.email && formik.errors.email
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-white/[0.08] focus:border-[#dea402]/60 hover:border-white/[0.12]'
                  }`}
                placeholder=" "
              />
              <label
                htmlFor="email"
                className={`absolute left-4 transition-all duration-300 pointer-events-none ${isFocused || formik.values.email
                    ? '-top-2.5 text-xs bg-[#37090b] px-1 text-[#dea402]'
                    : 'top-4 text-gray-500'
                  }`}
              >
                Email Address
              </label>

              {/* Error text with smooth height transition */}
              <div className={`transition-all duration-300 overflow-hidden ${formik.touched.email && formik.errors.email ? 'max-h-10 opacity-100 mt-1.5' : 'max-h-0 opacity-0 mt-0'}`}>
                <div className="text-red-400 text-xs ml-1">
                  {formik.errors.email}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={formik.handleSubmit}
              disabled={isLoading || !formik.isValid || !formik.values.email}
              className="btn-animated btn-gold flex justify-center mx-auto !max-w-64 !w-full bg-gradient-to-r from-[#dea402] to-[#b38302] text-black font-bold text-lg py-4 rounded-lg disabled:from-[#6b6354] disabled:to-[#5a5447] disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-300 shadow-lg shadow-[#dea402]/20 hover:shadow-[#dea402]/40 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
              >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Sending Link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </span>

              {/* Shimmer effect */}
              {!isLoading && formik.isValid && formik.values.email && (
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
              )}
            </button>

          </div>
        </div>

        {/* Footer Text */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-[#dea402]/50 text-xs tracking-widest uppercase">Secured by BBH</p>
          <p className="text-[#dea402]/30 text-[10px] tracking-wider">
            v{APP_VERSION} &middot; &copy; {new Date().getFullYear()} BBH
          </p>
        </div>

      </div>
    </div>
  );
}