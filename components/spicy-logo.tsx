
import { useTheme } from "next-themes";

export function SpicyLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {/* <img 
      src={'/logo.png'}
      alt="SPICY Logo"
      className="w-8 h-auto"
      /> */}
      <span className="text-2xl font-bold text-foreground">SPICY</span>
    </div>
  )
}
