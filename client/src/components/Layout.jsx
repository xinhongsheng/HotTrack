import { useState } from 'react'
import Sidebar from './Sidebar'
import Toast from './Toast'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="app-shell flex h-dvh overflow-hidden">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main
        className={`relative z-10 flex-1 overflow-y-auto transition-[margin] duration-300 ${
          sidebarOpen ? 'ml-16 md:ml-64' : 'ml-16'
        }`}
      >
        <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 md:px-8 md:py-7">
          {children}
        </div>
      </main>
      <Toast />
    </div>
  )
}
