import { Link } from 'react-router-dom'

export default function TermsPage() {
  return (
    <div className="p-3 max-w-2xl mx-auto space-y-3 pb-20">
      <header className="flex items-center justify-between">
        <h1 className="font-semibold">Terms of Service</h1>
        <Link to="/" className="btn-ghost">Back</Link>
      </header>

      <section className="card space-y-2">
        <div className="text-xs text-gray-400">Last updated: Oct 11, 2025</div>
        <p className="text-gray-200">
          By accessing or using SLUGMODE (the “Service”),
          you agree to these Terms. If you do not agree, do not use the Service.
        </p>
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold">1. Use of the Service</h2>
        <ul className="list-disc pl-6 space-y-1 text-gray-200">
          <li>You must be at least the age of majority in your jurisdiction.</li>
          <li>Do not misuse the Service or attempt to disrupt it.</li>
          <li>The Service is provided for informational purposes only.</li>
        </ul>
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold">2. Content & Intellectual Property</h2>
        <p className="text-gray-200">
          The Service may display third-party names, marks, and data that remain the
          property of their respective owners. You obtain no rights to such content.
        </p>
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold">3. No Warranty</h2>
        <p className="text-gray-200">
          The Service is provided “as is” and “as available” without warranties of
          any kind. We do not guarantee accuracy, availability, or fitness for a
          particular purpose.
        </p>
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold">4. Limitation of Liability</h2>
        <p className="text-gray-200">
          To the maximum extent permitted by law, we shall not be liable for any
          indirect, incidental, special, consequential, or punitive damages, or any
          loss of data, profits, or revenues.
        </p>
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold">5. Changes</h2>
        <p className="text-gray-200">
          We may update these Terms from time to time. Continued use constitutes
          acceptance of the revised Terms.
        </p>
      </section>
    </div>
  )
}
