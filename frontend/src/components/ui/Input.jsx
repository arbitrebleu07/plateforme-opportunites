export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white ${className}`}
      {...props}
    />
  )
}
