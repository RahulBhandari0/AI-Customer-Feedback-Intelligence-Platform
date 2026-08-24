import { NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/rbac';
import { prisma } from '@/lib/db';
import { classifyFeedback } from '@/lib/ai';
import { generateSimpleEmbedding } from '@/lib/search';
import { Sentiment, FeedbackStatus } from '@prisma/client';

const SIMULATED_CHANNEL_FEEDBACK = [
  { content: "Zendesk Ticket #4012: Customer reporting that SAML 2.0 single sign-on redirect loop fails with HTTP 500.", channel: "Zendesk Support", customerLabel: "Enterprise Tier Customer" },
  { content: "App Store 1-Star Review: Latest v2.4 mobile update keeps crashing on invoice PDF export screen.", channel: "App Store Integration", customerLabel: "Mobile Reviewer" },
  { content: "Intercom Live Chat: Can someone please increase our team member limit from 10 to 50?", channel: "Intercom Live Chat", customerLabel: "Growth Plan Lead" },
  { content: "Gong Sales Call: Prospect wants automated daily Voice-of-Customer PDF summaries sent to Slack before buying.", channel: "Gong Sales Integration", customerLabel: "High Value Lead" },
  { content: "Typeform NPS Comment: The Ask LOOP feature is game changing! We found 12 recurring bug reports instantly.", channel: "Typeform NPS Channel", customerLabel: "NPS Respondent" },
];

export async function POST() {
  const auth = await authorizeRequest(['ADMIN', 'ANALYST']);
  if (!auth.authorized || !auth.session) return auth.response;

  const workspaceId = auth.session.user.workspaceId;

  try {
    const existingThemes = await prisma.theme.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
    });

    const createdItems = [];

    for (const item of SIMULATED_CHANNEL_FEEDBACK) {
      const classification = await classifyFeedback(
        item.content,
        existingThemes.map((t) => t.name)
      );

      const feedback = await prisma.feedback.create({
        data: {
          content: item.content,
          channel: item.channel,
          customerLabel: item.customerLabel,
          sourceRef: `SIMULATED-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          sentiment: classification.sentiment as Sentiment,
          sentimentScore: classification.sentimentScore,
          featureArea: classification.featureArea,
          status: FeedbackStatus.NEW,
          workspaceId,
        },
      });

      for (const themeName of classification.themes) {
        let themeObj = existingThemes.find((t) => t.name.toLowerCase() === themeName.toLowerCase());
        if (!themeObj) {
          themeObj = await prisma.theme.create({
            data: {
              name: themeName,
              description: `Theme for ${classification.featureArea}`,
              workspaceId,
            },
          });
          existingThemes.push({ id: themeObj.id, name: themeObj.name });
        }

        await prisma.feedbackTheme.create({
          data: {
            feedbackId: feedback.id,
            themeId: themeObj.id,
            confidence: 0.9,
          },
        });
      }

      const vector = generateSimpleEmbedding(feedback.content);
      await prisma.embedding.create({
        data: {
          feedbackId: feedback.id,
          vector: JSON.stringify(vector),
        },
      });

      createdItems.push(feedback);
    }

    return NextResponse.json({
      message: `Simulated ingestion successful: Created ${createdItems.length} live channel feedback items`,
      items: createdItems,
    });
  } catch (error: any) {
    console.error('Simulated channel ingestion error:', error);
    return NextResponse.json({ error: 'Failed to simulate channel ingestion' }, { status: 500 });
  }
}

