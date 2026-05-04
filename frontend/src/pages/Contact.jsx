import { Link } from 'react-router-dom';

const Contact = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Prathamesh Sir</h1>
          <p className="text-xl text-gray-600">Get in touch for course enrollment and support</p>
        </div>

        {/* QR Codes Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Quick Connect & Payment</h2>
          <p className="text-gray-600 text-center mb-8">Scan the QR codes below to reach me or make payments instantly</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* WhatsApp QR */}
            <div className="bg-green-50 rounded-xl p-6 text-center border-2 border-green-200">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-bold text-green-800 mb-2">WhatsApp Me</h3>
              <p className="text-green-600 text-sm mb-4">Scan to chat directly</p>
              
              <div className="bg-white p-4 rounded-lg shadow-inner mb-4">
                <img 
                  src="/assets/whatsapp-qr.png" 
                  alt="WhatsApp QR Code"
                  className="w-48 h-48 mx-auto object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-48 h-48 mx-auto bg-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-500 hidden">
                  <span className="text-4xl mb-2">📱</span>
                  <p className="text-xs text-center px-4">Add your WhatsApp QR to /public/assets/whatsapp-qr.png</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Phone:</span> +91 XXXXX XXXXX
              </p>
              <p className="text-xs text-gray-500 mt-2">Available 9 AM - 7 PM</p>
            </div>

            {/* GPay QR */}
            <div className="bg-blue-50 rounded-xl p-6 text-center border-2 border-blue-200">
              <div className="text-4xl mb-4">💳</div>
              <h3 className="text-xl font-bold text-blue-800 mb-2">Pay via GPay</h3>
              <p className="text-blue-600 text-sm mb-4">Scan to make payment</p>
              
              <div className="bg-white p-4 rounded-lg shadow-inner mb-4">
                <img 
                  src="/assets/gpay-qr.png" 
                  alt="GPay QR Code"
                  className="w-48 h-48 mx-auto object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-48 h-48 mx-auto bg-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-500 hidden">
                  <span className="text-4xl mb-2">💰</span>
                  <p className="text-xs text-center px-4">Add your GPay QR to /public/assets/gpay-qr.png</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600">
                <span className="font-semibold">UPI ID:</span> prathameshsir@upi
              </p>
              <p className="text-xs text-gray-500 mt-2">All UPI apps accepted</p>
            </div>
          </div>

          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h4 className="font-semibold text-yellow-900">Payment Instructions</h4>
                <p className="text-yellow-800 text-sm mt-1">
                  After payment, please share the screenshot via WhatsApp to get your login credentials 
                  activated within 24 hours. Mention your name and email in the message.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Contact Information</h2>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <span className="text-2xl">👨‍🏫</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Prathamesh Sir</h3>
                  <p className="text-gray-600">Founder & Lead Educator</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <span className="text-2xl">📱</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Phone / WhatsApp</h3>
                  <p className="text-gray-600">+91 XXXXX XXXXX</p>
                  <p className="text-sm text-gray-500">Available 9 AM - 7 PM</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <span className="text-2xl">📧</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Email</h3>
                  <p className="text-gray-600">contact@prathameshsir.com</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <span className="text-2xl">📍</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Address</h3>
                  <p className="text-gray-600">[Your Institute Address]</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Other Payment Options</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">🏦 Bank Transfer</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Account Name:</span> Prathamesh Sir Education</p>
                  <p><span className="font-medium">Account Number:</span> XXXX XXXX XXXX</p>
                  <p><span className="font-medium">IFSC Code:</span> XXXX0001234</p>
                  <p><span className="font-medium">Bank:</span> [Bank Name]</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">💵 Cash Payment</h3>
                <p className="text-sm text-gray-600">
                  Visit our center directly for cash payment and instant enrollment.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">📲 Other UPI Apps</h3>
                <p className="text-sm text-blue-800">
                  UPI ID: <span className="font-mono font-bold">prathameshsir@upi</span>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Works with PhonePe, Paytm, Amazon Pay, and all UPI apps
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-900">How many devices can I use?</h3>
              <p className="text-gray-600 mt-1">Each account is limited to 2 devices (IP addresses) for security purposes.</p>
            </div>
            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-900">What if I switch devices?</h3>
              <p className="text-gray-600 mt-1">Contact Prathamesh Sir via WhatsApp to reset your IP slots if you need to switch devices.</p>
            </div>
            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-900">Can I download videos?</h3>
              <p className="text-gray-600 mt-1">No, all content is streaming-only with DRM protection to prevent piracy.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">What courses are available?</h3>
              <p className="text-gray-600 mt-1">We offer comprehensive courses for JEE, NEET, and Board examinations.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
