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
import GoogleBooksPage from './APIDemoPage/GoogleBooksPage'
import DictionaryPage from './APIDemoPage/DictionaryPage'
import ItunesPage from './APIDemoPage/ItunesPage'
import RawgGamesPage from './APIDemoPage/RawgGamesPage'
import ArticPage from './APIDemoPage/ArticPage'
import NasaApodPage from './APIDemoPage/NasaApodPage'
import KanyeQuotePage from './APIDemoPage/KanyeQuotePage'
import SuperheroPage from './APIDemoPage/SuperheroPage'
import DnDSpellsPage from './APIDemoPage/DnDSpellsPage'
import HackerNewsPage from './APIDemoPage/HackerNewsPage'
import PlantsPage from './APIDemoPage/PlantsPage'
import RandomFoxPage from './APIDemoPage/RandomFoxPage'
import AgifyPage from './APIDemoPage/AgifyPage'
import GenderizePage from './APIDemoPage/GenderizePage'
import NationalizePage from './APIDemoPage/NationalizePage'
import CitiesPage from './APIDemoPage/CitiesPage'
import QuickChartPage from './APIDemoPage/QuickChartPage'
import GravatarPage from './APIDemoPage/GravatarPage'
import DiceBearPage from './APIDemoPage/DiceBearPage'
import CocktailPage from './APIDemoPage/CocktailPage'
import OpenFoodPage from './APIDemoPage/OpenFoodPage'
import PeriodicTablePage from './APIDemoPage/PeriodicTablePage'
import DeckOfCardsPage from './APIDemoPage/DeckOfCardsPage'
import PokemonDetailsPage from './APIDemoPage/PokemonDetailsPage'
import OpenMeteoPage from './APIDemoPage/OpenMeteoPage'
import JikanAnimePage from './APIDemoPage/JikanAnimePage'
import RickMortyPage from './APIDemoPage/RickMortyPage'

import FreeToGamePage from './APIDemoPage/FreeToGamePage'
import OpenDotaPage from './APIDemoPage/OpenDotaPage'
import ChessPlayerPage from './APIDemoPage/ChessPlayerPage'
import IplDatasetPage from './APIDemoPage/IplDatasetPage'
import XenoCantoPage from './APIDemoPage/XenoCantoPage'
import NekosPage from './APIDemoPage/NekosPage'
import ColorMindPage from './APIDemoPage/ColorMindPage'
import EmojiHubPage from './APIDemoPage/EmojiHubPage'
import IconHorsePage from './APIDemoPage/IconHorsePage'
import XColorsPage from './APIDemoPage/XColorsPage'
import GitaPage from './APIDemoPage/GitaPage'
import BibleApiPage from './APIDemoPage/BibleApiPage'
import OpenLibraryPage from './APIDemoPage/OpenLibraryPage'
import PoetryPage from './APIDemoPage/PoetryPage'
import QuranApiPage from './APIDemoPage/QuranApiPage'
import GbifSpeciesPage from './APIDemoPage/GbifSpeciesPage'
import IDigBioPage from './APIDemoPage/IDigBioPage'
import MFPage from './APIDemoPage/MFPage'
import OpenBreweryPage from './APIDemoPage/OpenBreweryPage'
import FruityvicePage from './APIDemoPage/FruityvicePage'
import FoodishPage from './APIDemoPage/FoodishPage'
// import AmiiboPage from './APIDemoPage/AmiiboPage'
import DisneyCharactersPage from './APIDemoPage/DisneyCharactersPage'
import NarutoCharactersPage from './APIDemoPage/NarutoCharactersPage'
import OpenTopoPage from './APIDemoPage/OpenTopoPage'
import CovidCurrentPage from './APIDemoPage/CovidCurrentPage'
import OpenWhydPage from './APIDemoPage/OpenWhydPage'
import SpaceflightNewsPage from './APIDemoPage/SpaceflightNewsPage'
import UniversitiesPage from './APIDemoPage/UniversitiesPage'
import NobelPage from './APIDemoPage/NobelPage'
import GhContribPage from './APIDemoPage/GhContribPage'
import GithubReadmeStatsPage from './APIDemoPage/GithubReadmeStatsPage'
import DictumQuotesPage from './APIDemoPage/DictumQuotesPage'
import ForismaticPage from './APIDemoPage/ForismaticPage'
import IcanhazDadJokePage from './APIDemoPage/IcanhazDadJokePage'
import StoicQuotePage from './APIDemoPage/StoicQuotePage'
import WorldBankPage from './APIDemoPage/WorldBankPage'
import UsgsEarthquakePage from './APIDemoPage/UsgsEarthquakePage'
import TLEPage from './APIDemoPage/TLEPage'
import SunriseSunsetPage from './APIDemoPage/SunriseSunsetPage'
import IssMapPage from './APIDemoPage/IssMapPage'
import NASAImagesPage from './APIDemoPage/NASAImagesPage'
import LaunchLibraryPage from './APIDemoPage/LaunchLibraryPage'
import ChanApiPage from './APIDemoPage/ChanApiPage'
import SquigglePage from './APIDemoPage/SquigglePage'
import MLBRecordsPage from './APIDemoPage/MLBRecordsPage'
import CityBikesPage from './APIDemoPage/CityBikesPage'
import PostalPincodePage from './APIDemoPage/PostalPincodePage'
import AviationApiPage from './APIDemoPage/AviationApiPage'

import TVMazePage from './APIDemoPage/TVMazePage'
import ThronesApiPage from './APIDemoPage/ThronesApiPage'
import SwapiPage from './APIDemoPage/SwapiPage'
import FinalSpacePage from './APIDemoPage/FinalSpacePage'
import GoldApiPage from './APIDemoPage/GoldApiPage'
import GoldApiPage2 from './APIDemoPage/GoldApiPage2'
import FDAAnimalVetPage from './APIDemoPage/FDAAnimalVetPage'

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
      },
      {
        path:"apis/googlebooks",
        element:<GoogleBooksPage/>
      },
      {
        path:"/apis/dictionary",
        element:<DictionaryPage/>
      },
      {
        path:"/apis/itunes",
        element:<ItunesPage/>
      },
      {
        path:"/apis/rawg",
        element:<RawgGamesPage/>
      },
      {
        path:"/apis/artic",
        element:<ArticPage/>
      },

      {
        path:"/apis/nasa_apod",
        element:<NasaApodPage/>
      },
      {
        path:"/apis/kanye",
        element:<KanyeQuotePage/>
      },
      {
        path:"/apis/superhero",
        element:<SuperheroPage/>
      },
       {
        path:"/apis/dnd_spells",
        element:<DnDSpellsPage/>
      },
      {
        path:"/apis/hackernews",
        element:<HackerNewsPage/>
      },
      {
        path:"/apis/perenual",
        element:<PlantsPage/>
      },
      {
        path:"/apis/randomfox",
        element:<RandomFoxPage/>
      },
        {
        path:"/apis/agify",
        element:<AgifyPage/>
      },
      {
        path:"/apis/genderize",
        element:<GenderizePage/>
      },
      {
        path:"/apis/nationalize",
        element:<NationalizePage/>
      },
      {
        path:"/apis/geodb_graphql",
        element:<CitiesPage/>
      },
      {path:"/apis/quickchart",
        element:<QuickChartPage/>
      }
      ,
      {
        path:"/apis/gravatar",
        element:<GravatarPage/>
      },
      {
        path:"/apis/dicebear",
        element:<DiceBearPage/>
      },

      {
        path:"/apis/cocktaildb",
        element:<CocktailPage/>
      },
      {
        path:"/apis/openfoodfacts",
        element:<OpenFoodPage/>
      },
      {
        path:"/apis/periodic_table",
        element:<PeriodicTablePage/>
      },
      {
        path:"/apis/deckofcards",
        element:<DeckOfCardsPage/>
      },
      {
        path:"/apis/pokemon",
        element:<PokemonDetailsPage/>
      },
      {
        path:"/apis/openmeteo",
        element:<OpenMeteoPage/>
      },
      {
        path:"/apis/jikan",
        element:<JikanAnimePage/>
      },
      {
        path:"/apis/rickmorty",
        element:<RickMortyPage/>
      },
     
      {
        path:"/apis/freetogame",
        element:<FreeToGamePage/>
      },
      {
        path:'/apis/opendota',
        element:<OpenDotaPage/>
      },
      {
        path:"/apis/chesscom_player",
        element:<ChessPlayerPage/>
      },
      {
        path:"/apis/ipl_dataset",
        element:<IplDatasetPage/>
      },
      {
        path:"/apis/xenocanto",
        element:<XenoCantoPage/>
      },
      {
        path:"/apis/nekosbest",
        element:<NekosPage/>
      },
      {
        path:"/apis/colormind",
        element:<ColorMindPage/>
      },
      {
        path:"/apis/colormind",
        element:<ColorMindPage/>
       },
       {
        path:"/apis/emojihub",
        element:<EmojiHubPage/>
       },

       {
        path:"/apis/iconhorse",
        element:<IconHorsePage/>
       },
       {
        path:"/apis/xcolors",
        element:<XColorsPage/>
       },
       {
        path:"/apis/gita_telugu_odia",
        element:<GitaPage/>
       },
       {
        path:"/apis/bible",
        element:<BibleApiPage/>
       },
       {
        path:"/apis/openlibrary",
        element:<OpenLibraryPage/>
       }
       ,
       {
        path:"/apis/poetrydb",
        element:<PoetryPage/>
       },
       {
        path:"/apis/quran_api",
        element:<QuranApiPage/>
       },
       {
        path:"/apis/gbif",
        element:<GbifSpeciesPage/>
       }  ,
       {
              path:"/apis/idigbio",
              element:<IDigBioPage/>
       },
       {
        path:"/apis/indian_mutual_fund",
        element:<MFPage/>
       },
       {
        path:"/apis/openbrewery",
        element:<OpenBreweryPage/>
       },
       {
        path:"/apis/fruityvice",
        element:<FruityvicePage/>
       },
       {
        path:"/apis/foodish",
        element:<FoodishPage/>
       },
      //  {
      //   path:"/apis/amiibo",
      //   element:<AmiiboPage/>
      //  },
       {
        path:"/apis/disney",
        element:<DisneyCharactersPage/>
       },
       {
        path:"/apis/naruto_characters",
        element:<NarutoCharactersPage/>
       },
       {
        path:"/apis/opentopodata",
        element:<OpenTopoPage/>
       },
       {
        path:"/apis/covid_current",
        element:<CovidCurrentPage/>
       },
       {
        path:"/apis/openwhyd",
        element:<OpenWhydPage/>
       } ,
       {
        path:"/apis/spaceflightnews",
        element:<SpaceflightNewsPage/>
       },
       {
        path:"/apis/universities",
        element:<UniversitiesPage/>
       },
       {
        path:"/apis/nobelprize",
        element:<NobelPage/>
       },
       {
        path:"/apis/github_contributions",
        element:<GhContribPage/>
       },
       {
        path:"/apis/github_readme_stats",
        element:<GithubReadmeStatsPage/>
       },
       {
        path:"/apis/dictum",
        element:<DictumQuotesPage/>
       },
       {
        path:"/apis/forismatic",
        element:<ForismaticPage/>
       },
       {
        path:"/apis/icanhazdadjoke",
        element:<IcanhazDadJokePage/>
       },
       {
        path:"/apis/stoicquote",
        element:<StoicQuotePage/>
       },
       {
        path:"/apis/worldbank",
        element:<WorldBankPage/>
       },
       {
        path:"/apis/usgs_earthquakes",
        element:<UsgsEarthquakePage/>
       },
       {
        path:"/apis/tle",
        element:<TLEPage/>
       },
       {
        path:"/apis/sunrise_sunset",
        element:<SunriseSunsetPage/>
       },
       {
        path:"/apis/opennotify_iss",
        element:<IssMapPage/>
       },
       {
        path:"/apis/nasa_images",
        element:<NASAImagesPage/>
       },
       {
        path:"/apis/launchlibrary",
        element:<LaunchLibraryPage/>
       },
       {
        path:"/apis/4chan",
        element:<ChanApiPage/>
       },
       {
        path:"apis/squiggle",
        element:<SquigglePage/>
       },
       {
        path:"/apis/mlb-records",
        element:<MLBRecordsPage/>
       },
       {
        path:"/apis/citybikes",
        element:<CityBikesPage/>
       },
       {
        path:"/apis/postalpincode",
        element:<PostalPincodePage/>
       },
       {
        path:"/apis/aviationapi",
        element:<AviationApiPage/>
       },
    
       {
        path:"/apis/tvmaze",
        element:<TVMazePage/>
       },
       {
        path:"/apis/thronesapi",
        element:<ThronesApiPage/>
       },
       {

       path:"/apis/swapi",
       element:<SwapiPage/>
      
      },
      {
        path:"/apis/finalspace",
        element:<FinalSpacePage/>
      },
      {
        path:"/apis/goldapi",
        element:<GoldApiPage/>
      },
      {
        path:"/apis/goldapi2",
        element:<GoldApiPage2/>
      },
      {
        path:"/apis/fdaAnimalVet",
        element:<FDAAnimalVetPage/>
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
