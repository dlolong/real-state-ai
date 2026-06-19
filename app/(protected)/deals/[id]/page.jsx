import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import RefreshFullDetailsButton from "@/components/RefreshFullDetailsButton";
import Link from "next/link";
import RawFieldsTable from "@/components/RawFieldsTable";

function isValidUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value || ""
    );
}

export default async function PropertyDetailsPage({ params }) {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id || !isValidUuid(id)) {
        return (
            <div className="w-full min-w-0">
                <Link href="/deals" className="text-gray-400 hover:text-white">
                    ← Back to Deals
                </Link>

                <div className="mt-6 bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl">
                    Invalid property ID: {id || "missing"}
                </div>
            </div>
        );
    }

    const supabase = createSupabaseAdmin();

    const { data: property, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error || !property) {
        return (
            <div className="w-full min-w-0">
                <Link href="/deals" className="text-gray-400 hover:text-white">
                    ← Back to Deals
                </Link>

                <div className="mt-6 bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl">
                    {error?.message || "Property not found"}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-w-0 space-y-6">
            <Link href="/deals" className="text-gray-400 hover:text-white">
                ← Back to Deals
            </Link>

            <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between min-w-0">
                <div className="min-w-0">
                    <h1 className="text-2xl md:text-3xl font-bold break-words">
                        {property.address || "No address"}
                    </h1>

                    <p className="text-gray-400 mt-1 break-words">
                        {property.county}, {property.state}
                    </p>

                    {property.parcel_id && (
                        <p className="text-sm text-gray-500 mt-1 break-all">
                            APN: {property.parcel_id}
                        </p>
                    )}
                </div>

                <div className="shrink-0">
                    <RefreshFullDetailsButton propertyId={property.id} />
                </div>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    label="Deal Score"
                    value={property.deal_score ? `${property.deal_score}/100` : "Unscored"}
                />
                <StatCard label="Grade" value={property.deal_grade || "—"} />
                <StatCard
                    label="Est. Profit"
                    value={formatMoney(property.estimated_profit)}
                />
                <StatCard label="Owner" value={property.owner_name || "Unknown"} />
            </div>

            <div className="grid lg:grid-cols-3 gap-6 min-w-0">
                <section className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 min-w-0">
                    <h2 className="text-lg font-bold">Property Details</h2>

                    <div className="grid md:grid-cols-2 gap-4 mt-4 min-w-0">
                        <Info label="Parcel ID / APN" value={property.parcel_id} />
                        <Info label="Owner" value={property.owner_name} />
                        <Info label="Address" value={property.address} />
                        <Info label="Mailing Address" value={property.mailing_address} />
                        <Info label="Tax Status" value={property.tax_status} />
                        <Info
                            label="Assessed Value"
                            value={formatMoney(property.assessed_value)}
                        />
                        <Info label="Land Value" value={formatMoney(property.land_value)} />
                        <Info
                            label="Improvement Value"
                            value={formatMoney(property.improvement_value)}
                        />
                        <Info
                            label="Estimated Market Value"
                            value={formatMoney(property.estimated_market_value)}
                        />
                        <Info
                            label="Listing Price"
                            value={formatMoney(property.listing_price)}
                        />
                        <Info
                            label="Last Sale Price"
                            value={formatMoney(property.last_sale_price)}
                        />
                        <Info label="Last Sale Date" value={property.last_sale_date} />
                    </div>
                </section>

                <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 min-w-0">
                    <h2 className="text-lg font-bold">AI Deal Summary</h2>

                    <p className="text-gray-300 text-sm leading-relaxed mt-4 break-words">
                        {property.deal_summary ||
                            "No deal summary yet. Score this deal first."}
                    </p>

                    <div className="mt-5 space-y-3 text-sm">
                        <MiniScore label="ROI" value={property.roi_score} />
                        <MiniScore label="Motivation" value={property.motivation_score} />
                        <MiniScore label="Risk" value={property.risk_score} />
                    </div>
                </section>
            </div>

            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 min-w-0">
                <h2 className="text-lg font-bold">County Source</h2>

                <div className="grid md:grid-cols-2 gap-4 mt-4 min-w-0">
                    <Info label="Source" value={property.source} />
                    <Info label="Service URL" value={property.source_service_url} />
                    <Info label="Layer ID" value={property.source_layer_id} />
                    <Info label="Object ID" value={property.source_object_id} />
                    <Info
                        label="Full Details Fetched"
                        value={formatDate(property.full_details_fetched_at)}
                    />
                    <Info label="Updated" value={formatDate(property.updated_at)} />
                </div>
            </section>

            <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden min-w-0">
                <div className="p-4 md:p-6 border-b border-slate-800">
                    <h2 className="text-lg font-bold">Raw County Fields</h2>
                    <p className="text-gray-400 text-sm mt-1">
                        Use these field names to map Assessed, Land, and Improvement values.
                    </p>
                </div>

                <RawFieldsTable rawData={property.raw_data} />
            </section>

            <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden min-w-0">
                <div className="p-4 md:p-6 border-b border-slate-800">
                    <h2 className="text-lg font-bold">Raw County Data</h2>
                    <p className="text-gray-400 text-sm mt-1">
                        Original ArcGIS/county record stored for verification.
                    </p>
                </div>

                <div className="w-full overflow-x-auto">
                    <pre className="p-4 md:p-6 bg-slate-950 text-xs max-h-[500px] overflow-auto whitespace-pre-wrap break-words">
                        {JSON.stringify(property.raw_data || {}, null, 2)}
                    </pre>
                </div>
            </section>

            {property.raw_geometry && (
                <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden min-w-0">
                    <div className="p-4 md:p-6 border-b border-slate-800">
                        <h2 className="text-lg font-bold">Raw Geometry</h2>
                    </div>

                    <div className="w-full overflow-x-auto">
                        <pre className="p-4 md:p-6 bg-slate-950 text-xs max-h-[400px] overflow-auto whitespace-pre-wrap break-words">
                            {JSON.stringify(property.raw_geometry, null, 2)}
                        </pre>
                    </div>
                </section>
            )}
        </div>
    );
}

function StatCard({ label, value }) {
    return (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl min-w-0">
            <p className="text-gray-400 text-sm">{label}</p>
            <h3 className="text-xl font-bold mt-1 truncate">{value || "—"}</h3>
        </div>
    );
}

function Info({ label, value }) {
    return (
        <div className="bg-slate-800/70 rounded-xl p-4 min-w-0">
            <p className="text-xs text-gray-400">{label}</p>
            <p className="font-medium mt-1 break-words overflow-hidden">
                {value || "—"}
            </p>
        </div>
    );
}

function MiniScore({ label, value }) {
    const number = Number(value);

    return (
        <div className="min-w-0">
            <div className="flex justify-between text-gray-400 gap-3">
                <span>{label}</span>
                <span>{Number.isFinite(number) ? `${number}/100` : "—"}</span>
            </div>

            <div className="h-2 bg-slate-800 rounded-full mt-1 overflow-hidden">
                <div
                    className="h-full bg-white"
                    style={{
                        width: `${Number.isFinite(number) ? number : 0}%`,
                    }}
                />
            </div>
        </div>
    );
}

function formatMoney(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) return "—";

    return `$${number.toLocaleString()}`;
}

function formatDate(value) {
    if (!value) return "—";

    return new Date(value).toLocaleString();
}