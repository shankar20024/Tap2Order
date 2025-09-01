'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import PrivacyPolicy from '../../components/legal/PrivacyPolicy';
// Import other legal components here as they are created
import TermsOfService from '../../components/legal/TermsOfService';
import CookiePolicy from '../../components/legal/CookiePolicy';

const LegalPage = () => {
  const { slug } = useParams();

  const renderContent = () => {
    switch (slug) {
      case 'privacy':
        return <PrivacyPolicy />;
      case 'terms':
        return <TermsOfService />;
      case 'cookies':
        return <CookiePolicy />;
      default:
        return (
          <div className="text-center p-10">
            <h1 className="text-3xl font-bold">Document Not Found</h1>
            <p className="mt-4">The page you are looking for does not exist.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto py-12">
        {renderContent()}
      </div>
    </div>
  );
};

export default LegalPage;
