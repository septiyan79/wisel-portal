import { ArrowLeft, KeyRound } from "lucide-react"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Back to login */}
      <div className="p-6">
        <a
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Sign In
        </a>
      </div>

      {/* Info card */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 rounded-xl mb-4">
              <KeyRound size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">Forgot Password?</h1>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm text-center">
            <p className="text-sm text-gray-600 leading-relaxed">
              Password reset is not self-service for this portal. Please contact your
              administrator and ask them to reset your password for you.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mt-3">
              Once your admin has set a new password, you can sign back in and change it
              yourself from <span className="font-semibold text-gray-800">My Profile</span>.
            </p>
          </div>

          <a
            href="/login"
            className="mt-6 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
          >
            Back to Sign In
          </a>
        </div>
      </div>
    </div>
  )
}
