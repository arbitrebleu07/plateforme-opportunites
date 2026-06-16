export function AuthLayout({ title, error, footer, children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {title}
        </h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {children}

        {footer && (
          <p className="text-center text-sm text-gray-500 mt-4">
            {footer}
          </p>
        )}
      </div>
    </div>
  )
}
