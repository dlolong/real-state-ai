import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* NAVBAR */}
     {/* NAVBAR */}
<nav className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
  <h1 className="text-xl font-bold">
    DealAI
  </h1>

  <div className="flex items-center gap-3">

    <Link
      href="/login"
      className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 transition"
    >
      Login
    </Link>

    <Link
      href="/signup"
      className="bg-white text-black px-4 py-2 rounded-xl font-semibold hover:bg-gray-200 transition"
    >
      Sign Up
    </Link>

  </div>
</nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
          Find Off-Market Real Estate Deals Before Anyone Else
        </h1>

        <p className="mt-6 text-lg text-gray-300 max-w-2xl mx-auto">
          AI-powered deal finder + CRM that scans county data to uncover
          undervalued properties, motivated sellers, and high ROI opportunities.
        </p>

       <div className="mt-8 flex justify-center gap-4">

  <Link
    href="/signup"
    className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-200"
  >
    Start Free
  </Link>

  <Link
    href="/login"
    className="border border-gray-600 px-6 py-3 rounded-xl hover:bg-gray-800"
  >
    Login
  </Link>

</div>
<p className="mt-4 text-sm text-gray-400">
  No credit card required • Free account • Instant access
</p>
      </section>

      {/* SOCIAL PROOF */}
      <section className="text-center text-gray-400 py-6">
        Trusted by real estate investors & wholesalers
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-20 grid md:grid-cols-2 gap-10">

        <div className="bg-slate-900 p-6 rounded-2xl">
          <h3 className="text-xl font-semibold">🔍 AI Deal Finder</h3>
          <p className="mt-3 text-gray-400">
            Discover off-market properties, tax delinquent owners, and hidden opportunities from county data.
          </p>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl">
          <h3 className="text-xl font-semibold">🏡 Smart Property Insights</h3>
          <p className="mt-3 text-gray-400">
            Get AI-powered ROI scores, ownership history, and deal analysis instantly.
          </p>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl">
          <h3 className="text-xl font-semibold">📋 Built-in CRM</h3>
          <p className="mt-3 text-gray-400">
            Track leads from discovery to closing with a simple pipeline system.
          </p>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl">
          <h3 className="text-xl font-semibold">👥 Team & VA Management</h3>
          <p className="mt-3 text-gray-400">
            Assign leads, track activity, and scale your operations with ease.
          </p>
        </div>

      </section>

      {/* HOW IT WORKS */}
      <section className="bg-slate-900 py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold">How It Works</h2>

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div>
              <h4 className="font-semibold">1. Search County</h4>
              <p className="text-gray-400 mt-2">
                Choose a county and apply filters like tax delinquent or absentee owners.
              </p>
            </div>

            <div>
              <h4 className="font-semibold">2. AI Finds Deals</h4>
              <p className="text-gray-400 mt-2">
                Our AI analyzes data and highlights high ROI opportunities.
              </p>
            </div>

            <div>
              <h4 className="font-semibold">3. Close Deals</h4>
              <p className="text-gray-400 mt-2">
                Manage leads in your CRM and convert them into profit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* EXAMPLE */}
      <section className="max-w-4xl mx-auto text-center py-20 px-4">
        <h2 className="text-3xl font-bold">Real Example</h2>
        <p className="mt-6 text-gray-300 text-lg">
          Found a tax delinquent property → Bought at $95k → Sold at $145k
        </p>
        <p className="mt-2 text-green-400 font-semibold">
          $50,000 profit from one lead
        </p>
      </section>


      {/* FOOTER */}
      <footer className="text-center text-gray-500 py-10 text-sm">
        © {new Date().getFullYear()} DealAI. All rights reserved.
      </footer>


    </main>
  );
}