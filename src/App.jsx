import { useState } from 'react'
import { Button } from './components/ui/button'
import './App.css'
import {createBrowserRouter,RouterProvider} from 'react-router-dom'
import AppLayout from './layout/app-layout'
import Landing from './pages/Landing'
import ColorsPage from './pages/colorsPage'
const router=createBrowserRouter([
  {

    element:<AppLayout/>,
    children:[
      {
        path:"/",
        element:<Landing/>
      },
      {
        path:"/colors",
        element:<ColorsPage/>
      }
    ]
  }


])

function App() {
  
  return (
   <RouterProvider router={router}/>
  )
}

export default App
