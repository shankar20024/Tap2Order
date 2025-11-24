// Enhanced Legal Page with Sidebar, Breadcrumbs, SEO Metadata, Animations, Unified Layout
"use client";

import React from "react";
import { useParams } from "next/navigation";
import Head from "next/head";

// Import legal components
import PrivacyPolicy from "../../components/legal/PrivacyPolicy";
import TermsOfService from "../../components/legal/TermsOfService";
import CookiePolicy from "../../components/legal/CookiePolicy";

// Page title mapping
const titles = {
  privacy: "Privacy Policy",
  terms: "Terms of Service",
  cookies: "Cookie Policy",
};

const LegalPage = () => {
  const { slug } = useParams();

  const renderContent = () => {
    switch (slug) {
      case "privacy":
        return <PrivacyPolicy />;
      case "terms":
        return <TermsOfService />;
      case "cookies":
        return <CookiePolicy />;
      default:
        return (
          <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-10 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 animate-[fadeIn_0.4s_ease-in-out_forwards]">
            <h1 className="text-3xl font-bold text-gray-900">Document Not Found</h1>
            <p className="mt-3 text-gray-600">
              The legal document you are looking for does not exist.
            </p>
          </div>
        );
    }
  };

  const pageTitle = titles[slug] || "Legal Document";

  return (
    <>
      {/* SEO Metadata */}
      <Head>
        <title>{pageTitle} | Tap2Order</title>
        <meta
          name="description"
          content={`Read the ${pageTitle} of Tap2Order. Learn about your rights, data usage, and our service policies.`}
        />
        <link rel="canonical" href={`https://tap2order.com/legal/${slug}`} />
      </Head>

      <div className="min-h-screen bg-gray-50 py-12 px-6">
        <div className="max-w-6xl mx-auto flex gap-10">
          {/* Sidebar Navigation */}
          <aside className="w-64 bg-white shadow-lg rounded-xl p-6 border border-gray-100 h-fit sticky top-10 opacity-0 animate-[slideInLeft_0.4s_ease-in-out_forwards]">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Legal Documents</h3>
            <nav className="space-y-3">
              <a
                href="/legal/privacy"
                className={`block px-4 py-2 rounded-lg transition-all text-sm font-medium
                  ${slug === "privacy" ? "bg-amber-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
              >
                Privacy Policy
              </a>
              <a
                href="/legal/terms"
                className={`block px-4 py-2 rounded-lg transition-all text-sm font-medium
                  ${slug === "terms" ? "bg-amber-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
              >
                Terms of Service
              </a>
              <a
                href="/legal/cookies"
                className={`block px-4 py-2 rounded-lg transition-all text-sm font-medium
                  ${slug === "cookies" ? "bg-amber-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
              >
                Cookie Policy
              </a>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 opacity-0 animate-[fadeIn_0.4s_ease-in-out_forwards]">
            {/* Breadcrumbs */}
            <div className="mb-6 text-sm text-gray-600">
              <a href="/" className="hover:underline">Home</a>
              <span className="mx-2">/</span>
              <a href="/legal/privacy" className="hover:underline">Legal</a>
              <span className="mx-2">/</span>
              <span className="font-semibold text-gray-900">{pageTitle}</span>
            </div>

            {/* Legal Document Content */}
            <div className="bg-white shadow-xl rounded-2xl p-10 border border-gray-100">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default LegalPage;



