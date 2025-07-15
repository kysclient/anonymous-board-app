export function SpicyLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
        <div className="w-4 h-4 bg-white rounded-full"></div>
      </div> */}
      <span className="text-2xl font-bold text-gray-900">SPICY</span>
    </div>
  )
}
