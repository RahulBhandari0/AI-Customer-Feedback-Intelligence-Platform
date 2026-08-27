import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeFeedbackWithAI } from '@/lib/ai';

const sampleFeedbacks = [
  {
    content: 'The new dashboard is blazing fast and the dark theme is gorgeous! Super impressed with the analytics update.',
    source: 'Twitter',
    customerName: 'Sarah Jenkins',
    customerEmail: 'sarah.j@techcorp.io',
  },
  {
    content: 'Export to CSV is completely broken when selecting more than 100 rows. Throws a 500 error every time.',
    source: 'Support Ticket',
    customerName: 'Marcus Vance',
    customerEmail: 'mvance@acme.com',
  },
  {
    content: 'Would love to have Slack and webhook integration for real-time customer alert notifications.',
    source: 'Discord',
    customerName: 'Alex Rivera',
    customerEmail: 'alex@startup.co',
  },
  {
    content: 'I got charged twice for my annual subscription on invoice #88419! Please refund the duplicate charge ASAP.',
    source: 'Email',
    customerName: 'Elena Rostova',
    customerEmail: 'elena.r@enterprise.org',
  },
  {
    content: 'The mobile responsiveness on the settings page needs serious work. Input buttons are overlapping on iPhone 15.',
    source: 'App Store',
    customerName: 'David Chen',
    customerEmail: 'david.chen@gmail.com',
  },
  {
    content: 'Customer support agent Priya resolved our SSO setup in 5 minutes. Brilliant customer service experience!',
    source: 'Survey',
    customerName: 'Rachel Green',
    customerEmail: 'rachel@fashionhub.com',
  },
  {
    content: 'Page load latency spikes to 4+ seconds during peak morning hours. Please optimize database queries.',
    source: 'Email',
    customerName: 'Liam O’Connor',
    customerEmail: 'liam@fintechlabs.com',
  },
  {
    content: 'The sentiment analysis accuracy is genuinely impressive! Correctly flagged sarcasm in our survey results.',
    source: 'Twitter',
    customerName: 'Zack Morris',
    customerEmail: 'zack@growthmatrix.com',
  }
];

export async function POST() {
  try {
    const createdItems = [];

    for (const item of sampleFeedbacks) {
      const ai = analyzeFeedbackWithAI(item.content);
      const record = await prisma.feedback.create({
        data: {
          content: item.content,
          source: item.source,
          customerName: item.customerName,
          customerEmail: item.customerEmail,
          sentiment: ai.sentiment,
          sentimentScore: ai.sentimentScore,
          category: ai.category,
          urgency: ai.urgency,
          summary: ai.summary,
          tags: ai.tags,
          status: 'NEW',
        },
      });
      createdItems.push(record);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${createdItems.length} realistic customer feedback items`,
      count: createdItems.length,
    });
  } catch (error: unknown) {
    console.error('Error seeding feedbacks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed sample feedback items' },
      { status: 500 }
    );
  }
}
