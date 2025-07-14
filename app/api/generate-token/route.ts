// app/api/generateTokens/route.ts
import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// These should match the configuration of your LiveKit server on AWS (3.7.175.158:7880)
// In a production environment, these should be stored in environment variables
const apiKey = "API7dq6FLToEPPL";
const apiSecret = "dRbxt8K2PzaMQLYzFnmyjmvywk02TzDKuJyXcFzffWB";

// Define expected body shape
interface TokenRequestBody {
  roomName: string;
  identity: string;
}

// Token generator function
async function generateToken(
  roomName: string,
  identity: string
): Promise<{ identity: string; token: string }> {
  const token = new AccessToken(apiKey, apiSecret, {
    identity,
    ttl: "1h",
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  const jwt = await token.toJwt();
  return { identity, token: jwt };
}

// API POST handler
export async function POST(request: NextRequest) {
  try {
    const body: TokenRequestBody = await request.json();
    const { roomName, identity } = body;

    if (!roomName || !identity) {
      return NextResponse.json({ error: "Missing house or identity" }, { status: 400 });
    }

    const { token } = await generateToken(roomName, identity);
    return NextResponse.json({ token });
  } catch (error) {
    console.error("Token generation failed:", error);
    return NextResponse.json({ error: "Token generation failed" }, { status: 500 });
  }
}
