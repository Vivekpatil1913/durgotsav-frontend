import { lazy, useEffect } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { Layout } from "./components/layout/Layout.jsx";
import { RouteError } from "./components/layout/RouteError.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { SiteProvider } from "./context/SiteContext.jsx";
import { startSmoothScroll } from "./lib/smoothScroll.js";
import Home from "./pages/Home.jsx";

// Home ships in the main bundle (it is the landing page); everything else is code-split.
const About = lazy(() => import("./pages/About.jsx"));
const Forts = lazy(() => import("./pages/Forts.jsx"));
const FortDetail = lazy(() => import("./pages/FortDetail.jsx"));
const Participate = lazy(() => import("./pages/Participate.jsx"));
const Certificate = lazy(() => import("./pages/Certificate.jsx"));
const Gallery = lazy(() => import("./pages/Gallery.jsx"));
const Album = lazy(() => import("./pages/Album.jsx"));
const Videos = lazy(() => import("./pages/Videos.jsx"));
const Updates = lazy(() => import("./pages/Updates.jsx"));
const Faq = lazy(() => import("./pages/Faq.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));
const ContentPage = lazy(() => import("./pages/ContentPage.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Home /> },
      { path: "about", element: <About /> },
      { path: "forts", element: <Forts /> },
      { path: "forts/:slug", element: <FortDetail /> },
      { path: "participate", element: <Participate /> },
      { path: "certificate", element: <Certificate /> },
      { path: "gallery", element: <Gallery /> },
      { path: "album", element: <Album /> },
      { path: "videos", element: <Videos /> },
      { path: "updates", element: <Updates /> },
      { path: "faq", element: <Faq /> },
      { path: "contact", element: <Contact /> },
      { path: "rules", element: <ContentPage slug="rules" /> },
      { path: "privacy", element: <ContentPage slug="privacy" /> },
      { path: "terms", element: <ContentPage slug="terms" /> },
      // 2025 URLs
      { path: "mission", element: <Navigate to="/about" replace /> },
      { path: "photoalbum", element: <Navigate to="/album" replace /> },
      { path: "photoalbum-all", element: <Navigate to="/album" replace /> },
      { path: "photoalbum-approved", element: <Navigate to="/gallery" replace /> },
      { path: "testimonials", element: <Navigate to="/#voices" replace /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

export default function App() {
  useEffect(() => startSmoothScroll(), []);
  return (
    <LanguageProvider>
      <SiteProvider>
        <RouterProvider router={router} />
      </SiteProvider>
    </LanguageProvider>
  );
}
