import { Routes, Route, Link } from 'react-router-dom'
import NavBar from './components/NavBar'

import CalendarPage from './pages/Calendar'
import MatchupsPage from './pages/Matchups'
import TeamsPage from './pages/Teams'
import PlayersPage from './pages/Players'
import GameDetailsPage from './pages/GameDetails'
import AboutPage from './pages/AboutPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'

function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-24 sm:px-6 lg:px-8">
      <div className="card-panel max-w-xl p-8 text-center">
        <div className="eyebrow mx-auto w-fit">404</div>
        <h1 className="mt-4 text-2xl font-bold">This page is off the board.</h1>
        <p className="mt-2 text-gray-300">Try heading back to the PennantGrid dashboard.</p>
        <div className="mt-6">
          <Link to="/" className="btn">Back to dashboard</Link>
        </div>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-outfield/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-gray-400 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <div className="font-semibold text-gray-200">PennantGrid</div>
          <div>Grid-first MLB scoreboard, teams and player tracker powered by public MLB data.</div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/about" className="hover:text-white">About</Link>
          <Link to="/terms" className="hover:text-white">Terms</Link>
          <Link to="/privacy" className="hover:text-white">Privacy</Link>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <div className="min-h-full bg-diamond text-chalk">
      <NavBar />
      <main className="mx-auto min-h-screen max-w-7xl px-4 pb-28 pt-20 sm:px-6 lg:px-8 lg:pb-12">
        <Routes>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/matchups" element={<MatchupsPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/game/:id" element={<GameDetailsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
