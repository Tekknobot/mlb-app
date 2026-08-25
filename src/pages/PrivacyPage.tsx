import { Link } from 'react-router-dom'

export default function PrivacyPage() {
  return (
    <div className="space-y-5 pb-4">
      <header className="card-panel p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="eyebrow">Privacy</div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">Privacy Policy</h1>
          </div>
          <Link to="/" className="btn-ghost">Back to dashboard</Link>
        </div>
      </header>

      <section className="card space-y-3">
        <div className="text-xs text-gray-400">Last updated: Aug 25, 2026</div>
        <p className="text-gray-200">
          This Privacy Policy explains how PennantGrid handles your information.
          In short: there are no user accounts, no third-party sports-data logins, and no intentional personal data collection.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <section className="card space-y-2">
          <h2 className="font-semibold">No Accounts</h2>
          <p className="text-gray-200">The Service does not offer user registration or sign-in. We do not create or maintain user profiles.</p>
        </section>

        <section className="card space-y-2">
          <h2 className="font-semibold">No Personal Data Collection</h2>
          <p className="text-gray-200">We do not intentionally collect or store personal information such as names, emails, or account identifiers.</p>
        </section>

        <section className="card space-y-2">
          <h2 className="font-semibold">Minimal Server Logs</h2>
          <p className="text-gray-200">Like most websites, hosting infrastructure may generate short-lived technical logs for security and reliability.</p>
        </section>

        <section className="card space-y-2">
          <h2 className="font-semibold">Third-Party Content</h2>
          <p className="text-gray-200">The Service may display third-party content such as scores, logos, and player images. External links are governed by their own privacy policies.</p>
        </section>
      </section>
    </div>
  )
}
