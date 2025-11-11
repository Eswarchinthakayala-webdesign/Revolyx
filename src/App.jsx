import { useState } from 'react'
import { Button } from './components/ui/button'
import './App.css'
import {createBrowserRouter,RouterProvider} from 'react-router-dom'
import AppLayout from './layout/app-layout'
import Landing from './pages/Landing'
import ColorsPage from './pages/colorsPage'
import ChartsPage from './pages/chartPage'
import SpinnersPage from './pages/spinnersPage'
import BackgroundPage from './pages/BackgroundDesignPage'
import FlowchartPage from './pages/FlowchartPage'
import AllIconsPage from './pages/AlliconsPage'
import Documentation from './pages/Documention'
import QRGeneratorPage from './pages/QRMakerPage'
import ResourcePage from './pages/ResourcePage'
import CodeSnippetGenerator from './pages/CodeSnippetGenerator'
import RevolyxFontsPage from './pages/FontsPage'
import NeumorphismDesignPage from './pages/NeoMorphismPage'
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
        path:"/designs",
        element:<BackgroundPage/>
      },
       {
        path:"/flow-chart",
        element:<FlowchartPage/>
      },
       {
        path:"/all-icons",
        element:<AllIconsPage/>
      },
      {
        path:"/docs",
        element:<Documentation/>
      },
        {
        path:"/qr-code",
        element:<QRGeneratorPage/>
      },
         {
        path:"/resources",
        element:<ResourcePage/>
      },
         {
        path:"/code-snippet",
        element:<CodeSnippetGenerator/>
      },
           {
        path:"/fonts",
        element:<RevolyxFontsPage/>
      },
           {
        path:"/neumorphism",
        element:<NeumorphismDesignPage/>
      },
    ]
  }


])

function App() {
  
  return (
   <RouterProvider router={router}/>
  )
}

export default App
