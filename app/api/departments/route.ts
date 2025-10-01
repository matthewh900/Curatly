import { NextResponse } from "next/server";
import { getDepartments } from "@/lib/api/met";

export async function GET() {
  try {
    const depts = await getDepartments();
    return NextResponse.json(depts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}
