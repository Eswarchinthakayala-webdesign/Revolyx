import React from 'react'
import Header from '../components/Header'
import { Outlet } from 'react-router-dom'
import { useTheme } from '../components/theme-provider'
import { Toaster } from 'sonner'
const AppLayout = () => {
    
  return (
    <div>

        <div className='grid-background'></div>
        <main className='min-h-screen max-w-8xl pb-10 sm:pb-1 mx-auto'>
            <Toaster position="bottom-right" />
         <Header/>
         <Outlet/>

        </main>
         {/* === Footer === */}
      <footer className="hidden sm:flex items-center justify-center py-10 border-t border-gray-200 dark:border-white/10 text-center text-sm text-gray-600 dark:bg-black/50 dark:text-gray-400">
        © {new Date().getFullYear()} Revolyx. Made with ❤️ by Eswar
      </footer>
    </div>
  )
}

export default AppLayout