import { BrowserRouter, Routes, Route } from "react-router-dom"
import { RootLayout } from "@/components/layouts/root-layout"
import { HomePage } from "@/pages/home-page"
import { CountryPage } from "@/pages/country-page"
import { AsnDetailPage } from "@/pages/asn-detail-page"
import { SearchPage } from "@/pages/search-page"
import { AboutPage } from "@/pages/about-page"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="country/:code" element={<CountryPage />} />
          <Route path="asn/:number" element={<AsnDetailPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="about" element={<AboutPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
