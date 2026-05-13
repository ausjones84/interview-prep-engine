import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roleTitle, company, currentSalary, targetSalary, offerReceived, yearsExperience, location, skills } = body;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: `You are an elite salary negotiation coach who has helped engineers negotiate $10K-$50K raises. Give brutally honest, tactical advice.

Role: ${roleTitle}
Company: ${company || "Unknown"}
Current/Previous Salary: ${currentSalary || "Not provided"}
Target Salary: ${targetSalary || "Not specified"}
Offer Received: ${offerReceived || "No offer yet"}
Years Experience: ${yearsExperience || "Not specified"}
Location: ${location || "Not specified"}  
Key Skills: ${skills || "Not specified"}

Generate a complete salary negotiation playbook:

## MARKET VALUE ANALYSIS
Realistic salary range for this role/location/experience level. Be specific with numbers.

## YOUR LEVERAGE POINTS
Specific things that increase your value. Be direct.

## THE NEGOTIATION SCRIPT
Exact words to say when they give you an offer. Word-for-word scripts for:
- Counter-offer call
- Email follow-up
- When they push back
- If they say "this is our max"

## BEYOND BASE SALARY
Other comp to negotiate: signing bonus, equity, remote work, title, PTO, learning budget, review timeline

## RED LINES
When to walk away. Signs of lowball offers. What "we can't budge" really means.

## THE NUCLEAR OPTION
How to use competing offers (real or potential) to your advantage.

## POST-OFFER TIMELINE
Exact timing: when to respond, how long to ask for, when to push harder`
      }]
    });

    const content = (message.content[0] as {type: string; text: string}).text;
    return NextResponse.json({ playbook: content });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
