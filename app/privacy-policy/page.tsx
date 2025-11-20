'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NM2TechLogo from '@/components/NM2TechLogo';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  // Helper to get basePath
  const getBasePath = () => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname.startsWith('/nm2timesheet')) {
        return '/nm2timesheet';
      }
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <NM2TechLogo size="sm" />
            <button
              onClick={() => router.push(`${getBasePath()}/`)}
              className="text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100"
            >
              Home
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last Updated: November 20, 2025</p>

          <div className="prose prose-sm max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
              <p className="text-gray-700 mb-4">
                NM2TECH LLC ("we," "our," or "us") operates the NM2Timesheet mobile application and web service (the "Service"). 
                This Privacy Policy informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Personal Information</h3>
              <p className="text-gray-700 mb-4">We collect the following personal information when you use NM2Timesheet:</p>
              
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li><strong>Account Information:</strong> Email address, name, user role (employee/contractor/admin)</li>
                <li><strong>Time Entry Data:</strong> Work hours, project assignments, work descriptions, dates worked</li>
                <li><strong>Usage Data:</strong> Login timestamps, IP addresses (for security purposes), device information</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">How We Collect Information</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Information you provide when creating an account</li>
                <li>Information you enter when logging time entries</li>
                <li>Automatic collection of usage data through server logs</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use the collected information for the following purposes:</p>
              
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>To provide and maintain our Service:</strong> Authenticate users, process and store time entries, generate timesheets for approval</li>
                <li><strong>To manage your account:</strong> Verify your identity, manage user roles and permissions</li>
                <li><strong>For business operations:</strong> Process payroll and billing, generate reports for project management, comply with legal obligations</li>
                <li><strong>For security:</strong> Detect and prevent fraud, monitor for unauthorized access, maintain system security</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Storage and Security</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Storage Location:</strong> Your data is stored on secure servers</li>
                <li><strong>Data Retention:</strong> We retain your data as long as your account is active or as required by law</li>
                <li><strong>Security Measures:</strong> We use industry-standard security measures to protect your data, including:
                  <ul className="list-circle pl-6 mt-2 space-y-1">
                    <li>Encrypted data transmission (HTTPS)</li>
                    <li>Secure authentication</li>
                    <li>Access controls</li>
                  </ul>
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Sharing</h2>
              <p className="text-gray-700 mb-4">
                We do not sell your personal information. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>With your employer/contractor:</strong> Time entry data is shared with authorized administrators for payroll and project management purposes</li>
                <li><strong>Service Providers:</strong> We may use third-party services (e.g., hosting providers) that have access to your data only to perform services on our behalf</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
              <p className="text-gray-700 mb-4">You have the following rights regarding your personal information:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Access:</strong> You can access your personal information through your account</li>
                <li><strong>Correction:</strong> You can update your information through your account settings</li>
                <li><strong>Deletion:</strong> You can request deletion of your account and data (subject to legal retention requirements)</li>
                <li><strong>Data Portability:</strong> You can request a copy of your data</li>
              </ul>
              <p className="text-gray-700 mt-4">
                To exercise these rights, contact us at: <a href="mailto:michael@nm2tech.com" className="text-blue-600 hover:underline">michael@nm2tech.com</a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies and Tracking</h2>
              <p className="text-gray-700 mb-4">We use cookies and similar technologies to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Maintain your login session</li>
                <li>Remember your preferences</li>
                <li>Analyze usage patterns</li>
              </ul>
              <p className="text-gray-700 mt-4">You can control cookies through your browser settings.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Children's Privacy</h2>
              <p className="text-gray-700">
                Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Privacy Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Posting the new Privacy Policy on this page</li>
                <li>Updating the "Last Updated" date</li>
                <li>Sending you an email notification (if significant changes)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700 mb-4">If you have any questions about this Privacy Policy, please contact us:</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 font-semibold mb-2">NM2TECH LLC</p>
                <p className="text-gray-700">
                  Email: <a href="mailto:michael@nm2tech.com" className="text-blue-600 hover:underline">michael@nm2tech.com</a>
                </p>
                <p className="text-gray-700">
                  Website: <a href="https://nm2tech-sas.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://nm2tech-sas.com</a>
                </p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <button
              onClick={() => router.push(`${getBasePath()}/`)}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

