import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'

// Existing pages
import CalendarPage from './pages/Calendar'
import MatchupsPage from './pages/Matchups'
import TeamsPage from './pages/Teams'
import PlayersPage from './pages/Players'
import GameDetailsPage from './pages/GameDetails'

// NEW: legal/info pages
import AboutPage from './pages/AboutPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'

function NotFound() {
  return <div className="p-3 max-w-2xl mx-auto">Not found.</div>
}

export default function App() {
  return (
    <div className="min-h-full">
      <NavBar />
      <main className="pt-14 max-w-2xl mx-auto">
        <Routes>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/matchups" element={<MatchupsPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/game/:id" element={<GameDetailsPage />} />

          {/* NEW routes */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}
