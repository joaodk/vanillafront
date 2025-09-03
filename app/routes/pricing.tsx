import type { Route } from "./+types/pricing";
import { PricingTable } from '@clerk/react-router'
import { RouteProtection } from "~/components";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Pricing - React Router App" },
    { name: "description", content: "View our pricing plans" },
  ];
}

export default function Pricing() {
  return (
    <RouteProtection>
      <PricingTable />
    </RouteProtection>
  );
}
