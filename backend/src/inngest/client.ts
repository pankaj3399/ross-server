import { Inngest } from "inngest";

// Create a client to send and receive events
const inngestConfig: {
  id: string;
  name: string;
  eventKey?: string;
  isDev?: boolean;
} = {
  id: "ross-server",
  name: "ROSS Server",
};

// If INNGEST_EVENT_KEY is set, use it for cloud connection
if (process.env.INNGEST_EVENT_KEY) {
  inngestConfig.eventKey = process.env.INNGEST_EVENT_KEY;
} else if (process.env.INNGEST_DEV === "1") {
  inngestConfig.isDev = true;
}

export const inngest = new Inngest(inngestConfig);

