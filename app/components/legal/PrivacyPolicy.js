import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-6">
      <div className="max-w-3xl w-full bg-white shadow-xl rounded-2xl p-10 border border-gray-100">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: September 01, 2025</p>

        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold text-gray-800">Our Commitment to Your Privacy</h2>
          <p className="text-gray-600 leading-relaxed">
            Welcome to Tap2Order! Your privacy matters to us. This policy explains what
            information we collect when you place orders and how we use it to provide a smooth
            and enjoyable experience.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold text-gray-800">Information We Collect</h2>
          <p className="text-gray-600 leading-relaxed">
            To process your order efficiently, we collect the following details:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>
              <span className="font-semibold text-gray-800">Your Details:</span> Your name
              and phone number help the restaurant identify your order and contact you if
              needed.
            </li>
            <li>
              <span className="font-semibold text-gray-800">Order Information:</span> Items
              ordered, special instructions, and your table number.
            </li>
            <li>
              <span className="font-semibold text-gray-800">Technical Information:</span>
              Browser type, IP address, and other usage data that help us improve functionality.
            </li>
          </ul>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold text-gray-800">How We Use Your Information</h2>
          <p className="text-gray-600 leading-relaxed">We use your information to:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Send your order details directly to the restaurant.</li>
            <li>Help the restaurant manage and prepare your order accurately.</li>
            <li>Improve our platform performance and fix issues.</li>
            <li>Communicate with you if your order requires clarification.</li>
          </ul>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold text-gray-800">Sharing Your Information</h2>
          <p className="text-gray-600 leading-relaxed">
            Your order details are shared only with the restaurant preparing your food. We do
            not sell your information to third parties. Information may be shared only if
            required by law or necessary to protect the platform.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold text-gray-800">Keeping Your Information Safe</h2>
          <p className="text-gray-600 leading-relaxed">
            We take reasonable steps to protect your personal information. While no online
            service is 100% secure, we are committed to safeguarding your data and ensuring it
            is handled responsibly.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Contact Us</h2>
          <p className="text-gray-600 leading-relaxed">
            Have questions about this Privacy Policy? Reach us at:
          </p>
          <p className="text-gray-900 font-medium">info@tap2order.com</p>
        </section>
      </div>
    </div>
  );
}
