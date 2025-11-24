import React from "react";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-6">
      <div className="max-w-3xl w-full bg-white shadow-xl rounded-2xl p-10 border border-gray-100">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Cookie Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: September 01, 2025</p>

        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold text-gray-800">What Are Cookies?</h2>
          <p className="text-gray-600 leading-relaxed">
            Cookies are small text files stored on your device when you visit a website. They
            help remember your preferences, login state, and improve your browsing experience
            across pages.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold text-gray-800">How We Use Cookies</h2>
          <p className="text-gray-600 leading-relaxed">
            We use cookies strictly to enhance your app experience:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>
              <span className="font-semibold text-gray-800">Keeping You Logged In:</span> If
              you have an account, cookies let us maintain your login session securely as you
              navigate.
            </li>
            <li>
              <span className="font-semibold text-gray-800">Improving Performance:</span> Cookies
              help us understand usage patterns so we can improve features and user experience.
            </li>
          </ul>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold text-gray-800">Your Choices</h2>
          <p className="text-gray-600 leading-relaxed">
            Our app uses minimal cookies required for functionality. You may control cookie
            permissions through your browser settings. Disabling cookies may affect your
            personalized experience or login functionality.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Contact Us</h2>
          <p className="text-gray-600 leading-relaxed">
            If you have questions regarding our cookie usage, please reach out at:
          </p>
          <p className="text-gray-900 font-medium">info@tap2order.com</p>
        </section>
      </div>
    </div>
  );
}
