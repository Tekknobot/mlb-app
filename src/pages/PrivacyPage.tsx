import { Link } from 'react-router-dom'

export default function PrivacyPage() {
  return (
    <div className="p-3 max-w-2xl mx-auto space-y-3 pb-20">
      <header className="flex items-center justify-between">
        <h1 className="font-semibold">Privacy Policy</h1>
        <Link to="/" className="btn-ghost">Back</Link>
      </header>

      <section className="card space-y-2">
        <div className="text-xs text-gray-400">Last updated: Oct 11, 2025</div>
        <p className="text-gray-200">
          This Privacy Policy explains how SLUG (“we”, “us”) handles your information.
          In short: we don’t collect personal data, we don’t run analytics, we don’t use tracking cookies, and we don’t have user accounts.
        </p>
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold">No Accounts</h2>
        <p className="text-gray-200">
          The Service does not offer user registration or sign-in. We do not create or maintain user profiles.
        </p>
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold">No Personal Data Collection</h2>
        <p className="text-gray-200">
          We do not intentionally collect, store, or process personal information. There are no forms asking for your
          name, email address, or other identifiers.
        </p>
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold">Server Logs (Minimal & Transient)</h2>
        <p className="text-gray-200">
          Like most websites, our hosting environment may automatically generate basic, transient logs (e.g., IP address,
          request URL, timestamp, and user-agent) to operate and secure the Service. We do not use these logs to identify
          you, and we do not retain them longer than necessary for security and reliability.
        </p>
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold">Third-Party Content</h2>
        <p className="text-gray-200">
          The Service may display third-party content (e.g., scores or team data). Any external links you follow are
          governed by those sites’ own privacy policies.
        </p>
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold">Changes to This Policy</h2>
        <p className="text-gray-200">
          If we make material changes (e.g., enabling accounts or analytics), we will update this page and revise the
          “Last updated” date above.
        </p>
      </section>
    </div>
  )
}
