export interface Resource {
  name: string;
  category: "Emergency" | "Islamic Organizations" | "Mental Health & Social";
  detail: string;
  contact?: string; // phone number, only when independently verifiable/well-known
  url?: string;
  note?: string;
}

export const RESOURCES: Resource[] = [
  {
    name: "Emergency Medical Services (EMS)",
    category: "Emergency",
    detail: "National emergency medical dispatch — ambulance, accidents, medical emergencies.",
    contact: "1669",
  },
  {
    name: "Royal Thai Police",
    category: "Emergency",
    detail: "National police emergency line.",
    contact: "191",
  },
  {
    name: "Fire and Rescue",
    category: "Emergency",
    detail: "Fire department emergency line.",
    contact: "199",
  },
  {
    name: "Mental Health Hotline (Department of Mental Health)",
    category: "Mental Health & Social",
    detail: "24-hour mental health crisis and counseling line run by Thailand's Department of Mental Health.",
    contact: "1323",
  },
  {
    name: "Central Islamic Council of Thailand (CICOT)",
    category: "Islamic Organizations",
    detail:
      "National body overseeing Islamic affairs in Thailand, including halal certification and mosque administration. Based at the National Islamic Affairs Administration Center, Nong Chok, Bangkok.",
    url: "https://www.cicot.or.th",
  },
  {
    name: "Halal Standard Institute of Thailand",
    category: "Islamic Organizations",
    detail: "Halal certification and standards body affiliated with CICOT.",
    url: "https://www.halalstandard.org",
  },
];

export const RESOURCE_DISCLAIMER =
  "Phone numbers listed here are well-established national hotlines. For organizations, we link to their official website rather than list a phone number directly, since contact details change — please verify current details there before relying on them in an emergency.";
