import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { company, jobTitle, jobDescription } = body;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: `You are an expert company researcher and interview coach. Research this company and give a candidate a competitive edge.

Company: ${company}
Role: ${jobTitle || "Not specified"}
Job Description: ${jobDescription?.substring(0, 1000) || "Not provided"}

Generate a comprehensive company intelligence brief with these sections:

## COMPANY SNAPSHOT
- What they do, market position, size, recent news/funding
- Key products/services, main customers/clients

## TECH STACK & TOOLS  
- Technologies they likely use based on the JD and company type
- Tools, frameworks, cloud providers, methodologies

## CULTURE & VALUES
- Work style, team culture indicators from JD language
- What they seem to value in candidates (read between the lines)
- Common interview themes for this type of company

## SMART QUESTIONS TO ASK THEM
- 5 questions that show you've done deep research
- Questions that demonstrate strategic thinking
- Questions about their specific challenges

## RED FLAGS TO WATCH FOR
- Common challenges at companies like this
- What to clarify before accepting an offer

## SALARY INTELLIGENCE
- Estimated comp range for this role based on company size/stage
- Key comp components to negotiate (base, bonus, equity, benefits)
- Negotiation leverage points specific to this role

## YOUR POSITIONING STATEMENT
- How to open the interview (30-second hook)
- The 3 things you want them to remember about you
- How to tie your background to their specific needs`
      }]
    });

    const content = (message.content[0] as {type: string; text: string}).text;
    return NextResponse.json({ research: content });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
