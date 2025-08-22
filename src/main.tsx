import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import HomePage from './pages/HomePage.tsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import GrafikPage from './pages/GrafikPage.tsx'

const router = createBrowserRouter([
   {
        path: "/",
        element: <HomePage/>
    },
    {
        path: "/grafik",
        element: <GrafikPage/>
    },
    {
        path: "*",
      // element: <NotFoundPage/>
    }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>,
)
