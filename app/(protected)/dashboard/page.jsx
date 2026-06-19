import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export default async function DashboardPage() {
  const supabase = createSupabaseAdmin();

  const [
    propertiesResult,
    sourcesResult,
    layersResult,
    importRunsResult,
    topDealsResult,
  ] = await Promise.all([
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("county_sources")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("arcgis_layers")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("import_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),

    supabase
      .from("properties")
      .select("*")
      .order("deal_score", { ascending: false, nullsFirst: false })
      .limit(5),
  ]);

  const totalProperties = propertiesResult.count || 0;
  const totalSources = sourcesResult.count || 0;
  const totalLayers = layersResult.count || 0;
  const importRuns = importRunsResult.data || [];
  const topDeals = topDealsResult.data || [];

  const hotDeals = topDeals.filter((deal) => Number(deal.deal_score) >= 70);
  const bestDeal = topDeals[0];

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-blue-300 font-medium">
            AI Real Estate Operating System
          </p>

          <h1 className="text-2xl md:text-3xl font-bold mt-1">
            Dashboard
          </h1>

          <p className="text-gray-400 mt-2 max-w-2xl">
            Monitor county data sources, imported properties, AI deal scores,
            field mappings, and your investor workflow in one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/county-detector"
            className="bg-white text-black px-5 py-3 rounded-xl font-semibold hover:bg-gray-200"
          >
            Discover County
          </Link>

          <Link
            href="/deals"
            className="bg-slate-800 text-white px-5 py-3 rounded-xl font-semibold hover:bg-slate-700"
          >
            View Deals
          </Link>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Imported Properties"
          value={totalProperties}
          subtitle="Records saved from ArcGIS layers"
          icon="🏡"
        />

        <MetricCard
          title="Hot AI Deals"
          value={hotDeals.length}
          subtitle="Deals scored 70+"
          icon="🔥"
        />

        <MetricCard
          title="County Sources"
          value={totalSources}
          subtitle="Detected GIS data sources"
          icon="🧩"
        />

        <MetricCard
          title="Discovered Layers"
          value={totalLayers}
          subtitle="ArcGIS layers available for mapping"
          icon="🗺"
        />
      </div>

      {/* MAIN GRID */}
      <div className="grid xl:grid-cols-3 gap-6">
        {/* AI OPPORTUNITY PANEL */}
        <section className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 min-w-0">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">
                AI Opportunity Preview
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Your highest-ranked imported property based on ROI, motivation,
                and risk.
              </p>
            </div>

            <Link
              href="/deals"
              className="shrink-0 bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-700 text-sm"
            >
              Open Deal Finder
            </Link>
          </div>

          {bestDeal ? (
            <div className="mt-5 bg-slate-950 border border-slate-800 rounded-2xl p-5">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-xl font-bold break-words">
                    {bestDeal.address || "No address"}
                  </h3>

                  <p className="text-gray-400 mt-1">
                    {bestDeal.county}, {bestDeal.state}
                  </p>

                  {bestDeal.parcel_id && (
                    <p className="text-xs text-gray-500 mt-1 break-all">
                      APN: {bestDeal.parcel_id}
                    </p>
                  )}
                </div>

                <GradeBadge
                  grade={bestDeal.deal_grade}
                  score={bestDeal.deal_score}
                />
              </div>

              <div className="grid md:grid-cols-4 gap-3 mt-5">
                <MiniStat
                  label="Est. Profit"
                  value={formatMoney(bestDeal.estimated_profit)}
                  highlight
                />
                <MiniStat
                  label="Assessed"
                  value={formatMoney(bestDeal.assessed_value)}
                />
                <MiniStat
                  label="Land"
                  value={formatMoney(bestDeal.land_value)}
                />
                <MiniStat
                  label="Improve"
                  value={formatMoney(bestDeal.improvement_value)}
                />
              </div>

              <div className="mt-5 bg-slate-900 rounded-xl p-4">
                <p className="text-sm text-gray-300 leading-relaxed break-words">
                  🧠{" "}
                  {bestDeal.deal_summary ||
                    "Score this deal to generate an AI summary."}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/deals/${bestDeal.id}`}
                  className="bg-white text-black px-4 py-2 rounded-xl font-semibold hover:bg-gray-200"
                >
                  View Full Details
                </Link>

                <Link
                  href="/deals"
                  className="bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-700"
                >
                  Compare Deals
                </Link>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No deals yet"
              description="Start by discovering a county, opening a layer, mapping fields, and importing records."
              actionHref="/county-detector"
              actionLabel="Start County Detector"
            />
          )}
        </section>

        {/* PIPELINE STATUS */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 min-w-0">
          <h2 className="text-lg font-bold">Pipeline Status</h2>
          <p className="text-gray-400 text-sm mt-1">
            Your county data workflow progress.
          </p>

          <div className="mt-5 space-y-4">
            <PipelineStep
              number="1"
              title="Discover County"
              description="Find ArcGIS services from county GIS URLs."
              href="/county-detector"
              complete={totalSources > 0}
            />

            <PipelineStep
              number="2"
              title="Review Data Sources"
              description="Open detected counties and inspect layers."
              href="/sources"
              complete={totalLayers > 0}
            />

            <PipelineStep
              number="3"
              title="Map Layer Fields"
              description="Connect APN, address, owner, land, improve, and assessed fields."
              href="/sources"
              complete={totalProperties > 0}
            />

            <PipelineStep
              number="4"
              title="Score Deals"
              description="Rank imported properties using your AI deal scoring engine."
              href="/deals"
              complete={hotDeals.length > 0}
            />
          </div>
        </section>
      </div>

      {/* FEATURE PREVIEWS */}
      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Important Features</h2>
            <p className="text-gray-400 text-sm mt-1">
              Quick access to the most valuable parts of your SaaS.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
          <FeatureCard
            icon="🔥"
            title="County Detector"
            description="Input a county GIS URL and auto-discover ArcGIS REST services."
            href="/county-detector"
            cta="Detect Sources"
          />

          <FeatureCard
            icon="🧩"
            title="Data Sources"
            description="Review counties, services, layers, and possible value fields."
            href="/sources"
            cta="View Sources"
          />

          <FeatureCard
            icon="🏡"
            title="Deal Finder"
            description="Browse imported properties in table or thumbnail view."
            href="/deals"
            cta="Analyze Deals"
          />

          <FeatureCard
            icon="📋"
            title="CRM Leads"
            description="Move high-potential properties into your investor pipeline."
            href="/leads"
            cta="Open CRM"
          />
        </div>
      </section>

      {/* BOTTOM GRID */}
      <div className="grid xl:grid-cols-2 gap-6">
        {/* TOP DEALS */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden min-w-0">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Top AI Deals</h2>
              <p className="text-gray-400 text-sm mt-1">
                Highest-scoring imported properties.
              </p>
            </div>

            <Link
              href="/deals"
              className="text-sm text-blue-300 hover:text-blue-200"
            >
              View all
            </Link>
          </div>

          <div className="divide-y divide-slate-800">
            {topDeals.length > 0 ? (
              topDeals.map((deal) => (
                <DealPreviewRow key={deal.id} deal={deal} />
              ))
            ) : (
              <div className="p-5 text-gray-400 text-sm">
                No scored properties yet.
              </div>
            )}
          </div>
        </section>

        {/* RECENT IMPORTS */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden min-w-0">
          <div className="p-5 border-b border-slate-800">
            <h2 className="text-lg font-bold">Recent Imports</h2>
            <p className="text-gray-400 text-sm mt-1">
              Latest ArcGIS import activity.
            </p>
          </div>

          <div className="divide-y divide-slate-800">
            {importRuns.length > 0 ? (
              importRuns.map((run) => (
                <ImportRunRow key={run.id} run={run} />
              ))
            ) : (
              <div className="p-5 text-gray-400 text-sm">
                No import history yet. Re-import a mapped layer to create import logs.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon }) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-gray-400 text-sm">{title}</p>
          <h3 className="text-3xl font-bold mt-2">{value}</h3>
        </div>

        <div className="h-11 w-11 rounded-xl bg-slate-800 flex items-center justify-center text-xl shrink-0">
          {icon}
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-3 break-words">
        {subtitle}
      </p>
    </div>
  );
}

function FeatureCard({ icon, title, description, href, cta }) {
  return (
    <Link
      href={href}
      className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-slate-600 transition block min-w-0"
    >
      <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center text-xl">
        {icon}
      </div>

      <h3 className="font-bold mt-4">{title}</h3>

      <p className="text-sm text-gray-400 mt-2 leading-relaxed break-words">
        {description}
      </p>

      <p className="text-sm text-blue-300 mt-4">
        {cta} →
      </p>
    </Link>
  );
}

function PipelineStep({ number, title, description, href, complete }) {
  return (
    <Link
      href={href}
      className="flex gap-3 p-3 rounded-xl hover:bg-slate-800 transition"
    >
      <div
        className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
          complete
            ? "bg-green-500 text-black"
            : "bg-slate-800 text-gray-400"
        }`}
      >
        {complete ? "✓" : number}
      </div>

      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-gray-400 mt-1 break-words">
          {description}
        </p>
      </div>
    </Link>
  );
}

function DealPreviewRow({ deal }) {
  return (
    <Link
      href={`/deals/${deal.id}`}
      className="block p-5 hover:bg-slate-800/70 transition min-w-0"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold break-words">
            {deal.address || "No address"}
          </p>

          <p className="text-xs text-gray-500 mt-1 break-words">
            {deal.county}, {deal.state}
          </p>

          {deal.owner_name && (
            <p className="text-xs text-gray-400 mt-1 break-words">
              Owner: {deal.owner_name}
            </p>
          )}
        </div>

        <GradeBadge
          grade={deal.deal_grade}
          score={deal.deal_score}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
        <MiniStat
          label="Profit"
          value={formatMoney(deal.estimated_profit)}
          highlight
        />
        <MiniStat
          label="Assessed"
          value={formatMoney(deal.assessed_value)}
        />
        <MiniStat
          label="Motivation"
          value={deal.motivation_score ? `${deal.motivation_score}/100` : "—"}
        />
      </div>
    </Link>
  );
}

function ImportRunRow({ run }) {
  const success = run.status === "success";

  return (
    <div className="p-5 min-w-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold break-words">
            {run.county}, {run.state}
          </p>

          <p className="text-xs text-gray-500 mt-1 break-words">
            Layer {run.layer_id || "—"}
          </p>
        </div>

        <span
          className={`text-xs px-3 py-1 rounded-full shrink-0 ${
            success
              ? "bg-green-500/20 text-green-300"
              : "bg-red-500/20 text-red-300"
          }`}
        >
          {run.status || "unknown"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <MiniStat label="Pulled" value={run.pulled || 0} />
        <MiniStat label="Inserted" value={run.inserted || 0} />
      </div>

      {run.message && (
        <p className="text-xs text-gray-400 mt-3 break-words">
          {run.message}
        </p>
      )}
    </div>
  );
}

function MiniStat({ label, value, highlight }) {
  return (
    <div className="bg-slate-800/70 rounded-xl p-3 min-w-0">
      <p className="text-xs text-gray-400">{label}</p>
      <p
        className={`text-sm font-semibold mt-1 truncate ${
          highlight ? "text-green-300" : "text-white"
        }`}
      >
        {value || "—"}
      </p>
    </div>
  );
}

function GradeBadge({ grade, score }) {
  const value = grade || "—";
  const number = Number(score);

  const className =
    value === "A"
      ? "bg-green-500/20 text-green-300"
      : value === "B"
      ? "bg-blue-500/20 text-blue-300"
      : value === "C"
      ? "bg-yellow-500/20 text-yellow-300"
      : value === "D"
      ? "bg-red-500/20 text-red-300"
      : "bg-slate-700 text-gray-300";

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${className}`}
    >
      {value} · {Number.isFinite(number) ? `${number}/100` : "Unscored"}
    </span>
  );
}

function EmptyState({ title, description, actionHref, actionLabel }) {
  return (
    <div className="mt-5 border border-dashed border-slate-700 rounded-2xl p-8 text-center">
      <h3 className="font-bold text-lg">{title}</h3>

      <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
        {description}
      </p>

      <Link
        href={actionHref}
        className="inline-block mt-5 bg-white text-black px-5 py-3 rounded-xl font-semibold hover:bg-gray-200"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

function formatMoney(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return "—";

  return `$${number.toLocaleString()}`;
}