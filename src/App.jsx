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
import APIPage from './pages/APIPage'
import IpaApiPage from './APIDemoPage/Ipapipage'
import RandomUserPage from './APIDemoPage/GitHubUserApiPage'
import DogApiPage from './APIDemoPage/DogApiPage'
import CatFactPage from './APIDemoPage/CatFactPage'
import QuotablePage from './APIDemoPage/QuotablePage'
import PicsumPage from './APIDemoPage/PicsumPage'
import GitHubUserPage from './APIDemoPage/GitHubUserPage'
import WeatherApiPage from './APIDemoPage/WeatherApiPage'
import ProgrammingJokePage from './APIDemoPage/ProgrammingJokePage'
import MealApiPage from './APIDemoPage/MealApiPage'
import CountriesPage from './APIDemoPage/CountriesPage'
import NewsApiPage from './APIDemoPage/NewsApiPage'
import CryptoPricesPage from './APIDemoPage/CryptoPricesPage'
import OmdbMoviePage from './APIDemoPage/OmdbMoviePage'
import AdviceApiPage from './APIDemoPage/AdviceApiPage'
import ActivityPage from './APIDemoPage/ActivityPage'
import ChuckNorrisPage from './APIDemoPage/ChuckNorrisPage'
import HarryPotterPage from './APIDemoPage/HarryPotterPage'
import SpaceXLatestPage from './APIDemoPage/SpaceXLatestPage'
import PublicApisPage from './APIDemoPage/PublicApisPage'
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
      {
        path:"/apis",
        element:<APIPage/>
      },
      {
        path:"/apis/ipapi",
        element:<IpaApiPage/>
      },
      {
        path:"/apis/randomuser",
        element:<RandomUserPage/>
      },
      {
        path:"/apis/dog",
        element:<DogApiPage/>
      },
      {
        path:'/apis/catfact',
        element:<CatFactPage/>
      },
      {
        path:"/apis/quotes",
        element:<QuotablePage/>
      },
      {
        path:"/apis/picsum",
        element:<PicsumPage/>
      },
      {
        path:"/apis/github",
        element:<GitHubUserPage/>
      },
      {
        path:"/apis/weather",
        element:<WeatherApiPage/>
      },
      {
        path:"/apis/joke",
        element:<ProgrammingJokePage/>
      },
      {
        path:"/apis/meal",
        element:<MealApiPage/>
      },
      {
        path:"/apis/country",
        element:<CountriesPage/>
      },
      {
        path:"/apis/news",
        element:<NewsApiPage/>
      },
      {
        path:"/apis/crypto",
        element:<CryptoPricesPage/>
      },
      {
        path:"/apis/movie",
        element:<OmdbMoviePage/>
      },
      {
        path:"/apis/advice",
        element:<AdviceApiPage/>
      },
      {
        path:"/apis/activity",
        element:<ActivityPage/>
      },
      {
        path:"/apis/chucknorris",
        element:<ChuckNorrisPage/>
      },
      {
        path:"/apis/harrypotter",
        element:<HarryPotterPage/>
      },
      {
        path:"/apis/spacex",
        element:<SpaceXLatestPage/>
      },
      {
        path:"/apis/publicapis",
        element:<PublicApisPage/>
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
