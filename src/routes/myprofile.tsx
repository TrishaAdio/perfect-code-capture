import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/myprofile")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard", search: { panel: "settings" } });
  },
  component: () => null,
});
