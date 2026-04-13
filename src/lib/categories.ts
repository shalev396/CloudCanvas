import { CloudProvider } from "./types";

export const CLOUD_PROVIDERS: CloudProvider[] = [
  {
    id: "aws",
    name: "aws",
    displayName: "AWS",
    iconPath: "/aws/AWS-Cloud-logo_32.svg",
    enabled: true,
  },
  {
    id: "azure",
    name: "azure",
    displayName: "Azure",
    enabled: false,
  },
  {
    id: "gcp",
    name: "gcp",
    displayName: "GCP",
    enabled: false,
  },
];

export function getEnabledProviders(): CloudProvider[] {
  return CLOUD_PROVIDERS.filter((provider) => provider.enabled);
}
