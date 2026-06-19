import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import ScoreAllButton from "@/components/ScoreAllButton";
import DealsView from "@/components/DealsView";

export default async function DealsPage() {
  const supabase = createSupabaseAdmin();

  const { data: properties, error } = await supabase
    .from("properties")
    .select("*")
    .order("deal_score", { ascending: false, nullsFirst: false })
    .limit(100);

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Deal Finder</h1>
        <p className="text-red-400 mt-4">{error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deal Finder</h1>
          <p className="text-gray-400 mt-1">
            AI-ranked county records from your imported property data.
          </p>
        </div>

        <ScoreAllButton />
      </div>

      <DealsView properties={properties || []} />
    </div>
  );
}