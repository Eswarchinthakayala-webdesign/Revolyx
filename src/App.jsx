import { useState } from 'react'
import { Button } from './components/ui/button'
import './App.css'
import {createBrowserRouter,RouterProvider} from 'react-router-dom'
import AppLayout from './layout/app-layout'
import Landing from './pages/Landing'
import ColorsPage from './pages/colorsPage'
import ChartsPage from './pages/chartPage'
import SpinnersPage from './pages/spinnersPage'
import IconsPage from './pages/IconsPage'
import BackgroundPage from './pages/BackgroundDesignPage'
import FlowchartPage from './pages/FlowchartPage'
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
      },
      {
        path:"/charts",
        element:<ChartsPage/>
      },
      {
        path:"/charts/:id",
        element:<ChartsPage/>
      },
      {
        path:"/spinners",
        element:<SpinnersPage/>
      },
      {
        path:"/spinners/:id",
        element:<SpinnersPage/>
      },
      {
        path:"/icons",
        element:<IconsPage/>
      },
       {
        path:"/designs",
        element:<BackgroundPage/>
      },
       {
        path:"/flow-chart",
        element:<FlowchartPage/>
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
