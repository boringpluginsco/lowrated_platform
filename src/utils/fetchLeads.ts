import type { Business } from "../types";

/**
 * Fetch live leads for a given category. Uses different endpoints for specific categories.
 */
export async function fetchLeads(category: string): Promise<Business[]> {
  let url: string;
  switch (category) {
    case "Animal Health":
      url = "https://aramexshipping.app.n8n.cloud/webhook/animal-health";
      break;
    case "Cats & Dogs":
      url = "https://aramexshipping.app.n8n.cloud/webhook/Cats&Dogs";
      break;
    case "Animal Parks & Zoo":
      url = "https://aramexshipping.app.n8n.cloud/webhook/AnimalParks&Zoo";
      break;
    default:
      url = "https://aramexshipping.app.n8n.cloud/webhook/leads";
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch leads (${res.status})`);

  // Example element: { Website: "Spot Pet Insurance", Rating: 4.78, Reviews: 553, Address: "990 …", Domain: "spotpetins.com" }
  const json: Array<Record<string, unknown>> = await res.json();

  return json.map((row, idx) => {
    const address = String(row.Address ?? "");
    const city = address.split(",")[0].trim();

    return {
      id: `${category}-${idx}`,
      name: String(row.Website ?? "Unknown"),
      rating: Number(row.Rating ?? 0),
      reviews: Number(row.Reviews ?? 0),
      city,
      domain: row.Domain ? String(row.Domain) : undefined,
      isStarred: false,
    } satisfies Business;
  });
}