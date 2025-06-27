import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { APP_TITLE } from "~/lib/constants";

export function meta({}: Route.MetaArgs) {
  return [
    { title: APP_TITLE },
    { name: "description", content: `Welcome to ${APP_TITLE}!` },
  ];
}

export default function Home() {
  return <Welcome />;
}
