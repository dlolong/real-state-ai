import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function saveArcgisDiscovery({
  county,
  state,
  gisUrl,
  discovery,
}) {
  const supabase = createSupabaseAdmin();

  const { data: countySource, error: countyError } = await supabase
    .from("county_sources")
    .upsert(
      {
        county,
        state,
        gis_url: gisUrl,
        platform: "ArcGIS",
        api_type: "ArcGIS REST API",
        scraping_method: "Use ArcGIS REST API first. Use Playwright only as fallback.",
        confidence_score: discovery.service_count > 0 ? 95 : 50,
        notes: `Auto-discovered ${discovery.service_count} ArcGIS services.`,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "county,state",
      }
    )
    .select()
    .single();

  if (countyError) {
    throw new Error(countyError.message);
  }

  const savedServices = [];

  for (const service of discovery.services) {
    const { data: savedService, error: serviceError } = await supabase
      .from("arcgis_services")
      .upsert(
        {
          county_source_id: countySource.id,
          county,
          state,
          service_name: service.name,
          service_type: service.type,
          service_url: service.url,
          root_url: service.rootUrl,
          folder: service.folder,
          capabilities: service.capabilities,
          layer_count: service.layer_count,
          table_count: service.table_count,
          metadata: service.metadata,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "service_url",
        }
      )
      .select()
      .single();

    if (serviceError) {
      throw new Error(serviceError.message);
    }

    savedServices.push(savedService);

    if (Array.isArray(service.layers) && service.layers.length > 0) {
      const layerRows = service.layers.map((layer) => ({
        arcgis_service_id: savedService.id,
        county,
        state,
        service_url: service.url,
        layer_id: layer.layer_id,
        layer_name: layer.layer_name,
        layer_type: layer.layer_type,
        geometry_type: layer.geometry_type,
        object_id_field: layer.object_id_field,
        query_url: layer.query_url,
        sample_query_url: layer.sample_query_url,
        fields: layer.fields,
        metadata: layer.metadata,
      }));

      const { error: layerError } = await supabase
        .from("arcgis_layers")
        .upsert(layerRows, {
          onConflict: "service_url,layer_id",
        });

      if (layerError) {
        throw new Error(layerError.message);
      }
    }
  }

  return {
    county_source: countySource,
    services_saved: savedServices.length,
  };
}