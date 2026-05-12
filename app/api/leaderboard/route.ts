import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = Redis.fromEnv();

export async function GET() {
  const scores = await redis.zrange("leaderboard", 0, 9, {
    rev: true,
    withScores: true,
  });

  const leaderboard = [];
  for (let i = 0; i < scores.length; i += 2) {
    leaderboard.push({
      address: scores[i],
      score: Number(scores[i + 1]),
    });
  }

  return NextResponse.json(leaderboard);
}

export async function POST(req: Request) {
  const { address, score } = await req.json();

  if (!address || score === undefined) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const current = await redis.zscore("leaderboard", address);
  if (current === null || score > Number(current)) {
    await redis.zadd("leaderboard", { score, member: address });
  }

  return NextResponse.json({ success: true });
}
