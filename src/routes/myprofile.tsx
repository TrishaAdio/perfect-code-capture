import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/myprofile")({
  head: () => ({
    meta: [
      { title: "Settings — SymDeals" },
      { name: "description", content: "Account, security and performance settings." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard", search: { panel: "settings" } });
  },
  component: () => null,
});
