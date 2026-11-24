import React from "react";
import { getCatalogVehicles } from "@/lib/catalog";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ShowroomExperience } from "@/components/storefront/showroom-experience";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const vehicles = await getCatalogVehicles();

  return (
    <>
      <SiteHeader variant="transparent-hero" />
      <ShowroomExperience vehicles={vehicles} />
      <SiteFooter />
    </>
  );
}
