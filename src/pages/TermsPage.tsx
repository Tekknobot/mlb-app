import { Link } from 'react-router-dom'

export default function TermsPage() {
  return (
    <div className="space-y-5 pb-4">
      <header className="card-panel p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="eyebrow">Terms</div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">Terms of Service</h1>
          </div>
          <Link to="/" className="btn-ghost">Back to dashboard</Link>
        </div>
      </header>

      <section className="card space-y-3">
        <div className="text-xs text-gray-400">Last updated: Aug 25, 2026</div>
        <p className="text-gray-200">
          By accessing or using Slugline (the “Service”), you agree to these Terms. If you do not agree,
          please do not use the Service.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <section className="card space-y-2">
          <h2 className="font-semibold">1. Use of the Service</h2>
          <ul className="list-disc space-y-1 pl-6 text-gray-200">
            <li>You must be at least the age of majority in your jurisdiction.</li>
            <li>Do not misuse the Service or attempt to disrupt it.</li>
            <li>The Service is provided for informational purposes only.</li>
          </ul>
        </section>

        <section className="card space-y-2">
          <h2 className="font-semibold">2. Content & Intellectual Property</h2>
          <p className="text-gray-200">
            The Service may display third-party names, marks, logos, photographs, and data that remain the property of their respective owners.
            You obtain no rights to such content by using the Service.
          </p>
        </section>

        <section className="card space-y-2">
          <h2 className="font-semibold">3. No Warranty</h2>
          <p className="text-gray-200">
            The Service is provided “as is” and “as available” without warranties of any kind.
            We do not guarantee accuracy, availability, or fitness for a particular purpose.
          </p>
        </section>

        <section className="card space-y-2">
          <h2 className="font-semibold">4. Limitation of Liability</h2>
          <p className="text-gray-200">
            To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages, or any loss of data, profits, or revenues.
          </p>
        </section>
      </section>
    </div>
  )
}
