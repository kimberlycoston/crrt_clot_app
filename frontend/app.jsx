import React, { useState } from 'react'
import Top10Page from './top10page'
import Full57Page from './full57page'
import Full57InputPage from './full57inputpage'

function App() {
  const [currentPage, setCurrentPage] = useState('top10')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="nav-glass sticky top-0 z-50 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <img src="/crrt_icon.png" alt="CRRT Icon" className="w-12 h-12 object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  CRRT Clot Risk <span className="gradient-text">Prediction</span>
                </h1>
                <p className="text-xs text-gray-600 mt-0.5">Clinical Decision Support System</p>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <div className="hidden md:flex items-center space-x-1 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setCurrentPage('top10')}
                className={`nav-tab rounded-lg ${
                  currentPage === 'top10'
                    ? 'active bg-white shadow-md text-blue-600'
                    : 'text-gray-600'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${
                    currentPage === 'top10' ? 'bg-blue-500' : 'bg-gray-400'
                  }`}></span>
                  <span>Quick Input</span>
                </span>
              </button>
              <button
                onClick={() => setCurrentPage('demo')}
                className={`nav-tab rounded-lg ${
                  currentPage === 'demo'
                    ? 'active bg-white shadow-md text-blue-600'
                    : 'text-gray-600'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${
                    currentPage === 'demo' ? 'bg-blue-500' : 'bg-gray-400'
                  }`}></span>
                  <span>Demo Scenarios</span>
                </span>
              </button>
              <button
                onClick={() => setCurrentPage('full57')}
                className={`nav-tab rounded-lg ${
                  currentPage === 'full57'
                    ? 'active bg-white shadow-md text-blue-600'
                    : 'text-gray-600'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${
                    currentPage === 'full57' ? 'bg-blue-500' : 'bg-gray-400'
                  }`}></span>
                  <span>Full Model</span>
                </span>
              </button>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          <div className="md:hidden pb-3 flex space-x-2 overflow-x-auto">
            <button
              onClick={() => setCurrentPage('top10')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                currentPage === 'top10'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Quick Input
            </button>
            <button
              onClick={() => setCurrentPage('demo')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                currentPage === 'demo'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Demo
            </button>
            <button
              onClick={() => setCurrentPage('full57')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                currentPage === 'full57'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Full Model
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="animate-slide-in">
          {currentPage === 'top10' && <Top10Page />}
          {currentPage === 'demo' && <Full57Page />}
          {currentPage === 'full57' && <Full57InputPage />}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-gray-200 bg-white/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-600">
            <p>For research and educational purposes only. Not for clinical use.</p>
            <p className="mt-1 text-xs text-gray-500">
              © 2024 CRRT Clot Prediction System
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App