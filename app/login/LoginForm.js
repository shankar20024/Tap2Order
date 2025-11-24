"use client";
import { signIn, getProviders } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PasswordInput from "../components/PasswordInput";
import Logo from "../components/Logo";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [staffPasscode, setStaffPasscode] = useState("");
  const [selectedHotel, setSelectedHotel] = useState("");
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [hotelSearch, setHotelSearch] = useState("");
  const [showHotelDropdown, setShowHotelDropdown] = useState(false);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState(null);
  const [activeTab, setActiveTab] = useState("admin"); // "admin" or "staff"
  const router = useRouter();
  const searchParams = useSearchParams();
  const hotelInputRef = useRef(null);

  // Check for OAuth callback error
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'OAuthCallback') {
      toast.error('You are not registered. Please sign up first.', {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'light',
      });
      // Clear the error from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  // Fetch auth providers on component mount
  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };
    fetchProviders();
  }, []);

  // Fetch hotels when staff tab is activated
  useEffect(() => {
    if (activeTab === "staff") {
      fetchHotels();
    }
  }, [activeTab]);

  // Update filtered hotels when hotels load
  useEffect(() => {
    setFilteredHotels(hotels);
  }, [hotels]);

  const fetchHotels = async () => {
    setLoadingHotels(true);
    try {
      const response = await fetch("/api/hotels");
      const result = await response.json();

      if (response.ok && result.success) {
        setHotels(result.hotels);

        if (result.hotels.length === 0) {
          toast.info("No hotels found. Please contact admin to add hotels.");
        }
      } else {
        toast.error(`Failed to load hotels: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error("Failed to load hotels. Please check your connection.");
    } finally {
      setLoadingHotels(false);
    }
  };

  const handleHotelSearch = (e) => {
    const value = e.target.value;
    setHotelSearch(value);
    setShowHotelDropdown(true);

    if (value.trim() === "") {
      setFilteredHotels(hotels);
    } else {
      const filtered = hotels.filter((hotel) => {
        const hotelCode = hotel.hotelCode.toLowerCase();
        const hotelName = hotel.businessName.toLowerCase();
        const searchValue = value.toLowerCase();
        return hotelCode.includes(searchValue) || hotelName.includes(searchValue);
      });
      setFilteredHotels(filtered);
    }
  };

  const handleHotelSelect = (hotel) => {
    setSelectedHotel(hotel._id);
    setHotelSearch(hotel.displayName); // Show "A0001 - Hotel Name" format
    setShowHotelDropdown(false);
  };

  const handleHotelInputFocus = () => {
    setShowHotelDropdown(true);
    if (hotelSearch === "") {
      setFilteredHotels(hotels);
    }
  };

  const handleHotelInputBlur = () => {
    // Delay hiding dropdown to allow clicks on options
    setTimeout(() => setShowHotelDropdown(false), 300);
  };

  const clearHotelSearch = () => {
    setHotelSearch("");
    setSelectedHotel("");
    setFilteredHotels(hotels);
    setShowHotelDropdown(true);
  };

  async function handleAdminLogin(e) {
    e.preventDefault();
    setLoading(true);

    try {
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
    } catch (error) {
      setLoading(false);
      toast.error("An error occurred during login. Please try again.", {
        position: "top-right",
        autoClose: 4000,
        theme: "colored",
      });
    }
  }

  async function handleStaffLogin(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/staff-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          passcode: staffPasscode,
          hotelId: selectedHotel
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Create session for staff user using staffToken (JWT)
        const signInRes = await signIn("credentials", {
          staffToken: result.staffToken,
          redirect: false,
        });

        if (signInRes.ok) {
          // Redirect based on staff department
          if (result.staff.department === "service") {
            router.push("/waiter");
          } else if (result.staff.department === "kitchen") {
            router.push("/kitchen");
          } else if (result.staff.department === "management") {
            router.push("/dashboard");
          } else {
            toast.info(`Welcome ${result.staff.name}! No specific dashboard available for your department.`);
            setLoading(false);
            return;
          }
        } else {
          throw new Error("Failed to create staff session");
        }
      } else {
        setLoading(false);
        toast.error(result.error || "Invalid passcode. Please try again.", {
          position: "top-right",
          autoClose: 4000,
          theme: "colored",
        });
      }
    } catch (error) {
      setLoading(false);
      toast.error("Staff login failed. Please try again.", {
        position: "top-right",
        autoClose: 4000,
        theme: "colored",
      });
    }
  }

  const handlePasscodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 4) {
      setStaffPasscode(value);
    }
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastStyle={{
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
        }}
      />

      {/* Background with gradient and pattern */}
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">

              {/* Left side - Branding */}
              <div className="hidden lg:block text-center lg:text-left">
                <div className="mb-8">
                  <Logo className="text-6xl xl:text-7xl mb-6 text-amber-600" />
                  <h1 className="text-4xl xl:text-5xl font-bold text-gray-800 mb-4 leading-tight">
                    Welcome to <span className="text-amber-600">Tap2Orders</span>
                  </h1>
                  <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                    {activeTab === "admin"
                      ? "Streamline your restaurant operations with our comprehensive management platform. Access powerful tools for orders, analytics, and team management."
                      : "Quick and secure staff access. Enter your 4-digit passcode to access your personalized dashboard and start managing orders efficiently."
                    }
                  </p>
                </div>

                {/* Feature highlights */}
                <div className="grid grid-cols-2 gap-6 mt-12">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">Analytics</h3>
                    <p className="text-sm text-gray-600">Real-time insights</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">Team Management</h3>
                    <p className="text-sm text-gray-600">Staff coordination</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">Order Management</h3>
                    <p className="text-sm text-gray-600">Seamless workflow</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">Secure Access</h3>
                    <p className="text-sm text-gray-600">Protected data</p>
                  </div>
                </div>
              </div>

              {/* Right side - Login Form */}
              <div className="w-full max-w-md mx-auto lg:max-w-lg">
                {/* Mobile logo */}
                <div className="lg:hidden text-center mb-8">
                  <Logo className="text-5xl mb-4 text-amber-600" />
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
                  <p className="text-gray-600">Sign in to continue</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 lg:p-10">
                  {/* Tab Navigation */}
                  <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
                    <button
                      type="button"
                      onClick={() => setActiveTab("admin")}
                      className={`flex-1 py-3 px-4 text-center font-semibold rounded-xl transition-all duration-300 ${activeTab === "admin"
                          ? "bg-white text-amber-600 shadow-lg transform scale-105"
                          : "text-gray-600 hover:text-amber-600"
                        }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                        <span>Admin / Owner</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("staff")}
                      className={`flex-1 py-3 px-4 text-center font-semibold rounded-xl transition-all duration-300 ${activeTab === "staff"
                          ? "bg-white text-blue-600 shadow-lg transform scale-105"
                          : "text-gray-600 hover:text-blue-600"
                        }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Staff Login</span>
                      </div>
                    </button>
                  </div>

                  {/* Admin/Owner Login Form */}
                  {activeTab === "admin" && (
                    <form onSubmit={handleAdminLogin} className="space-y-4 sm:space-y-5">
                      <div className="text-center mb-4 sm:mb-6">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">Admin & Owner Access</h2>
                        <p className="text-sm sm:text-base text-gray-600">Enter your credentials to access the management dashboard</p>
                      </div>

                      <div className="space-y-4 sm:space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg className="h-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                              </svg>
                            </div>
                            <input
                              type="email"
                              placeholder="Enter your email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className="w-full pl-8 sm:pl-10 pr-4 py-2.5 sm:py-3 md:py-4 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                          <PasswordInput
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            className="w-full py-2.5 sm:py-3 md:py-4 text-sm sm:text-base"
                          />
                        </div>

                        {/* Divider with "or" text */}
                        <div className="relative my-6">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or continue with</span>
                          </div>
                        </div>

                        {/* Google Sign In Button */}
                        <button
                          type="button"
                          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                          className="relative w-full flex items-center justify-center gap-3 py-2.5 px-4 border-2 border-black rounded-full font-medium bg-white hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 overflow-hidden group"
                        >
                          <div className="relative z-10 flex items-center">
                            <svg
                              className="w-5 h-5"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.28426 53.749 C -8.52426 55.229 -9.42452 56.479 -10.7842 57.329 L -10.7842 60.529 L -6.82477 60.529 C -4.56475 58.449 -3.264 55.199 -3.264 51.509 Z" />
                                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.80451 62.159 -6.82477 60.529 L -10.7842 57.329 C -11.7642 58.049 -13.074 58.489 -14.754 58.489 C -17.444 58.489 -19.654 56.579 -20.414 54.119 L -24.4608 54.129 L -24.4608 57.439 C -22.481 61.429 -18.964 63.239 -14.754 63.239 Z" />
                                <path fill="#FBBC05" d="M -20.414 54.119 C -20.664 53.359 -20.814 52.559 -20.814 51.739 C -20.814 50.919 -20.664 50.119 -20.404 49.359 L -20.404 46.049 L -24.4608 46.049 C -25.2808 47.669 -25.754 49.649 -25.754 51.739 C -25.754 53.829 -25.2808 55.809 -24.4608 57.429 L -20.414 54.119 Z" />
                                <path fill="#EA4335" d="M -14.754 45.049 C -12.984 45.049 -11.404 45.589 -10.064 46.619 L -6.82477 43.909 C -8.89475 42.019 -11.604 40.989 -14.754 40.989 C -18.964 40.989 -22.481 42.929 -24.4608 46.059 L -20.404 49.359 C -19.654 46.869 -17.444 45.049 -14.754 45.049 Z" />
                              </g>
                            </svg>
                            <span className="ml-2 group-hover:text-white transition-colors duration-300">Continue with Google</span>
                          </div>

                          {/* Animated wave effect */}
                          <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute top-1/2 left-0 w-full h-0 pb-[100%] -translate-y-1/2 scale-0 group-hover:scale-150 transition-transform duration-1000 origin-center">
                              <div className="absolute inset-0 bg-[#EB4335] opacity-0 group-hover:opacity-100 group-hover:animate-[wave_2s_ease-in-out_forwards]"></div>
                              <div className="absolute inset-0 bg-[#FBBC05] opacity-0 group-hover:opacity-100 group-hover:animate-[wave_2s_0.3s_ease-in-out_forwards]"></div>
                              <div className="absolute inset-0 bg-[#34A853] opacity-0 group-hover:opacity-100 group-hover:animate-[wave_2s_0.6s_ease-in-out_forwards]"></div>
                              <div className="absolute inset-0 bg-[#4285F4] opacity-0 group-hover:opacity-100 group-hover:animate-[wave_2s_0.9s_ease-in-out_forwards]"></div>
                            </div>
                          </div>
                        </button>

                        <button
                          type="submit"
                          disabled={loading}
                          className={`w-full py-2.5 sm:py-3 md:py-4 px-6 rounded-lg sm:rounded-xl font-semibold text-white transition-all duration-300 transform text-sm sm:text-base mt-4 ${loading
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 hover:scale-105 hover:shadow-xl"
                            }`}
                        >
                          {loading ? (
                            <div className="flex items-center justify-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-t-2 border-b-2 border-white"></div>
                              <span>Signing in...</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center space-x-2">
                              <span>Sign In</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                              </svg>
                            </div>
                          )}
                        </button>
                        {/* Contact Information */}
                        <div className="mt-4 text-center text-sm text-gray-600">
                          Sign up by contacting us at <br />
                          <a href="tel:7558776795" className="text-blue-600 hover:underline">7558776795</a> or
                          <a href="mailto:info.tap2order@gmail.com" className="text-blue-600 hover:underline"> info.tap2order@gmail.com</a>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* Staff Login Form */}
                  {activeTab === "staff" && (
                    <form onSubmit={handleStaffLogin} className="space-y-6">
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Staff Access</h2>
                        <p className="text-gray-600">Select your hotel and enter your 4-digit passcode</p>
                      </div>

                      <div className="space-y-6">
                        {/* Hotel Selection */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-3">Select Hotel</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <input
                              type="search"
                              placeholder="Search hotels"
                              value={hotelSearch}
                              onChange={handleHotelSearch}
                              onFocus={handleHotelInputFocus}
                              onBlur={handleHotelInputBlur}
                              required
                              className="w-full pl-10 pr-4 py-3 sm:py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base"
                              disabled={loadingHotels}
                              ref={hotelInputRef}
                            />
                            <div className={"absolute inset-y-0 right-0 pr-3 flex items-center " + (loadingHotels ? "pointer-events-none" : "")}>
                              {loadingHotels ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                              ) : hotelSearch === "" ? (
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    if (!showHotelDropdown) {
                                      if (hotelSearch === "") setFilteredHotels(hotels);
                                    }
                                    setShowHotelDropdown((prev) => !prev);
                                    hotelInputRef.current?.focus();
                                  }}
                                  className="p-1"
                                  aria-label="Toggle hotel options"
                                >
                                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              ) : (
                                <button type="button" onClick={clearHotelSearch}>
                                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                          {showHotelDropdown && (
                            <div className="absolute z-50 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg mt-2 max-h-60 overflow-y-auto">
                              {filteredHotels.length > 0 ? (
                                filteredHotels.map((hotel) => (
                                  <button
                                    key={hotel._id}
                                    type="button"
                                    onMouseDown={() => handleHotelSelect(hotel)}
                                    className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <span className="font-medium text-blue-600 text-sm">{hotel.hotelCode}</span>
                                      <span className="text-gray-600">-</span>
                                      <span className="text-gray-800 text-sm truncate">{hotel.businessName}</span>
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-3 text-gray-500 text-center">
                                  <div className="flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <span className="text-sm">No hotels found</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>



                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Staff Passcode</label>
                          <div className="relative">
                            <div className="text-center mb-3">
                              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-full">
                                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              </div>
                            </div>
                            <input
                              type="password"
                              placeholder="Enter 4-digit passcode"
                              value={staffPasscode}
                              onChange={handlePasscodeChange}
                              maxLength={4}
                              required
                              className="w-full text-center py-2.5 sm:py-3 md:py-4 px-4 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-lg sm:text-xl font-mono tracking-widest"
                            />
                            <div className="flex justify-center mt-3">
                              <div className="flex space-x-2">
                                {[...Array(4)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-200 ${i < staffPasscode.length
                                        ? "bg-blue-500 scale-110"
                                        : "bg-gray-300"
                                      }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500 text-center mt-2">
                              {staffPasscode.length}/4 digits entered
                            </p>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading || staffPasscode.length !== 4 || !selectedHotel}
                          className={`w-full py-2.5 sm:py-3 md:py-4 px-6 rounded-lg sm:rounded-xl font-semibold text-white transition-all duration-300 transform text-sm sm:text-base ${loading || staffPasscode.length !== 4 || !selectedHotel
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 hover:scale-105 hover:shadow-xl"
                            }`}
                        >
                          {loading ? (
                            <div className="flex items-center justify-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-t-2 border-b-2 border-white"></div>
                              <span>Accessing...</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center space-x-2">
                              <span>Access Dashboard</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </div>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                  <p className="text-sm text-gray-500">
                    2024 Tap2Orders. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </>
  );
}
