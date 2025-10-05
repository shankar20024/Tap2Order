'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiPhone, FiMail, FiMessageCircle, FiHelpCircle, FiArrowLeft, FiSend, FiClock, FiUser, FiSettings, FiBook } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Header from '../components/Header';

export default function SupportPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('contact');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supportForm, setSupportForm] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: session?.user?.phone || '',
    subject: '',
    message: '',
    priority: 'medium',
    issueType: 'technical'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!supportForm.name || !supportForm.email || !supportForm.subject || !supportForm.message) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Prepare data for CustomerSupport collection
      const supportData = {
        customerName: supportForm.name,
        customerEmail: supportForm.email,
        customerPhone: supportForm.phone || 'Not provided',
        hotelOwner: session?.user?.id || session?.user?._id,
        subject: supportForm.subject,
        description: supportForm.message,
        issueType: supportForm.issueType,
        priority: supportForm.priority === 'critical' ? 'urgent' : supportForm.priority
      };

      // Submit to CustomerSupport API
      const response = await fetch('/api/customer-support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supportData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit support request');
      }

      toast.success('Support request submitted successfully! We will get back to you soon.');
      
      // Reset form
      setSupportForm({
        ...supportForm,
        subject: '',
        message: '',
        issueType: 'technical',
        priority: 'medium'
      });

    } catch (error) {
      toast.error(error.message || 'Failed to submit support request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqItems = [
    {
      question: "How do I update an order status?",
      answer: "Click on the order card and use the status buttons (Start Preparing, Mark Ready, Mark Served) to update the order progress."
    },
    {
      question: "What if I accidentally cancel an order?",
      answer: "Contact your manager immediately. Cancelled orders cannot be restored from the waiter dashboard."
    },
    {
      question: "How do I check table availability?",
      answer: "Go to the Tables tab to see all tables with their current status (Available/Occupied)."
    },
    {
      question: "Why am I not receiving real-time updates?",
      answer: "Check your internet connection and look for the connection status in the header. If it shows 'Disconnected', try refreshing the page."
    },
    {
      question: "How do I handle special requests from customers?",
      answer: "Special requests should be communicated directly to the kitchen staff. The system currently doesn't support order modifications."
    }
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-20">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 mb-6 lg:mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 sm:px-8 py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-all duration-200"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <FiHelpCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Support Center</h1>
                  <p className="text-blue-100">Get help and support for Tap2Order</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FiPhone className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Call Support</h3>
            <p className="text-sm text-gray-600 mb-3">24/7 Phone Support</p>
            <a href="tel:+917558776795" className="text-green-600 font-semibold hover:text-green-700">
              7558776795
            </a>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FiMail className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Email Support</h3>
            <p className="text-sm text-gray-600 mb-3">Response within 2 hours</p>
            <a href="mailto:info.tap2order@gmail.com" className="text-blue-600 font-semibold hover:text-blue-700">
              info.tap2order@gmail.com
            </a>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FiMessageCircle className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Live Chat</h3>
            <p className="text-sm text-gray-600 mb-3">Instant help available</p>
            <button className="text-purple-600 font-semibold hover:text-purple-700">
              Start Chat
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex px-4 sm:px-6 lg:px-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab('contact')}
                className={`py-3 px-4 sm:px-6 text-sm font-medium rounded-t-lg transition-all duration-200 whitespace-nowrap ${
                  activeTab === 'contact'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Contact Form
              </button>
              <button
                onClick={() => setActiveTab('faq')}
                className={`py-3 px-4 sm:px-6 text-sm font-medium rounded-t-lg transition-all duration-200 whitespace-nowrap ${
                  activeTab === 'faq'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                FAQ
              </button>
              <button
                onClick={() => setActiveTab('guides')}
                className={`py-3 px-4 sm:px-6 text-sm font-medium rounded-t-lg transition-all duration-200 whitespace-nowrap ${
                  activeTab === 'guides'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                User Guides
              </button>
            </nav>
          </div>

          {/* Contact Form Tab */}
          {activeTab === 'contact' && (
            <div className="p-6">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Submit a Support Request</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={supportForm.name}
                        onChange={(e) => setSupportForm({...supportForm, name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={supportForm.email}
                        onChange={(e) => setSupportForm({...supportForm, email: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={supportForm.phone}
                      onChange={(e) => setSupportForm({...supportForm, phone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={supportForm.priority}
                      onChange={(e) => setSupportForm({...supportForm, priority: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low - General inquiry</option>
                      <option value="medium">Medium - Issue affecting work</option>
                      <option value="high">High - Urgent issue</option>
                      <option value="critical">Critical - System down</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Issue Type
                    </label>
                    <select
                      value={supportForm.issueType}
                      onChange={(e) => setSupportForm({...supportForm, issueType: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="technical">Technical Issue</option>
                      <option value="billing">Billing Issue</option>
                      <option value="general">General Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={supportForm.subject}
                      onChange={(e) => setSupportForm({...supportForm, subject: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      value={supportForm.message}
                      onChange={(e) => setSupportForm({...supportForm, message: e.target.value})}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Please describe your issue in detail..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <FiSend className="w-4 h-4 animate-spin" />
                        Submitting...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <FiSend className="w-4 h-4" />
                        Submit Support Request
                      </div>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqItems.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FiHelpCircle className="w-5 h-5 text-blue-600" />
                      {item.question}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Guides Tab */}
          {activeTab === 'guides' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">User Guides & Documentation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <FiBook className="w-6 h-6 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Getting Started</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Learn the basics of using the waiter dashboard and managing orders.</p>
                  <button className="text-blue-600 hover:text-blue-700 font-medium">Read Guide →</button>
                </div>

                <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <FiSettings className="w-6 h-6 text-green-600" />
                    <h3 className="font-semibold text-gray-900">Order Management</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Advanced tips for efficiently managing orders and table status.</p>
                  <button className="text-green-600 hover:text-green-700 font-medium">Read Guide →</button>
                </div>

                <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <FiUser className="w-6 h-6 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">Staff Training</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Training materials for new staff members and best practices.</p>
                  <button className="text-purple-600 hover:text-purple-700 font-medium">Read Guide →</button>
                </div>

                <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <FiClock className="w-6 h-6 text-orange-600" />
                    <h3 className="font-semibold text-gray-900">Troubleshooting</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Common issues and their solutions for quick problem resolution.</p>
                  <button className="text-orange-600 hover:text-orange-700 font-medium">Read Guide →</button>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  );
}
