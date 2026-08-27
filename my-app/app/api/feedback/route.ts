import { NextResponse } from "next/server";

// Sample array in memory (test karne ke liye)
let memoryFeedbacks: any[] = [];

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const newFeedback = {
      id: Date.now().toString(),
      content: `${body.title}: ${body.description}`,
      sentiment: "POSITIVE",
      source: "Web Form",
      createdAt: new Date(),
    };

    memoryFeedbacks.unshift(newFeedback);

    return NextResponse.json(
      { success: true, data: newFeedback },
      { status: 201 }
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(memoryFeedbacks, { status: 200 });
}