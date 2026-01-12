import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed bottom-4 right-4 z-40 bg-accent text-white p-3 rounded-full shadow-lg hover:opacity-90 transition-opacity"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <>
            <div 
              className="lg:hidden fixed inset-0 bg-black/70 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="lg:hidden fixed right-0 top-0 h-full z-50">
              <Sidebar />
            </div>
          </>
        )}

        <main className="flex-1 overflow-y-auto bg-bg">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
