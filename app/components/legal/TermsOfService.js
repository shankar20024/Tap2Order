import React from "react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-6">
      <div className="max-w-3xl w-full bg-white shadow-xl rounded-2xl p-10 border border-gray-100">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: September 01, 2025</p>

        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold text-gray-800">Welcome to Tap2Order!</h2>
          <p className="text-gray-600 leading-relaxed">
            Thanks for choosing Tap2Order! These terms outline the rules for using our
            platform. By placing an order, you agree to follow these simple guidelines.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold text-gray-800">Using Our Service</h2>
          <p className="text-gray-600 leading-relaxed">
            Tap2Order is designed to make food ordering effortless. To help us serve you
            better, please provide accurate details when placing your order. Our platform
            connects you directly with the restaurant kitchen for a seamless experience.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold text-gray-800">Our Role & Responsibilities</h2>
          <p className="text-gray-600 leading-relaxed">
            Tap2Order works as a digital bridge between you and the restaurant. While we offer
            the platform for placing orders, the restaurant is responsible for preparing and
            serving your food. For any food-related concerns, please speak directly with the
            restaurant staff.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold text-gray-800">Changes & Availability</h2>
          <p className="text-gray-600 leading-relaxed">
            We're always working to enhance Tap2Order. This means features or services may
            change occasionally. While we aim for uninterrupted service, we cannot guarantee
            24/7 availability.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold text-gray-800">Respectful Use</h2>
          <p className="text-gray-600 leading-relaxed">
            We ask that you use Tap2Order respectfully. Misuse of the app that impacts other
            users or restaurant operations may result in limited or restricted access.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Contact Us</h2>
          <p className="text-gray-600 leading-relaxed">
            Have questions about these terms? Feel free to reach out:
          </p>
          <p className="text-gray-900 font-medium">info@tap2order.com</p>
        </section>
      </div>
    </div>
  );
}