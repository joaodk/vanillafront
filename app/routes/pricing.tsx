import type { Route } from "./+types/pricing";
import { PricingTable } from '@clerk/react-router'

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Pricing - React Router App" },
    { name: "description", content: "View our pricing plans" },
  ];
}

export default function Pricing() {
  return (
    <PricingTable />
  );
}
