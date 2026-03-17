import { ActionGetResponse, ACTIONS_CORS_HEADERS } from "@solana/actions";
import { NextResponse } from "next/server";

const headers = {
  ...ACTIONS_CORS_HEADERS,
  "Access-Control-Allow-Private-Network": "true",
};

// Handle preflight
export async function OPTIONS() {
  return NextResponse.json(null, { headers });
}

export async function GET(request: Request) {
  const actionMetaData: ActionGetResponse = {
  icon: "...",
  title: "Vote for your favorite peanut butter",
  description:
    "Vote for your favorite peanut butter and help us determine the best one in the market!",
  label: "Vote",
  links: {
    actions: [
      {
        label: "Vote for Crunchy",
        href: "/api/vote?candidate=crunchy",
        type: "transaction"
      },
      {
        label: "Vote for Smooth",
        href: "/api/vote?candidate=smooth",
        type: "transaction"
      },
    ],
  },
};
 

  return NextResponse.json(actionMetaData, { headers });
}