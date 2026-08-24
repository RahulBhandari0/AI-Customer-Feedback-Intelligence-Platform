import { NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/rbac';
import { prisma } from '@/lib/db';
import { classifyFeedback } from '@/lib/ai';
import { generateSimpleEmbedding } from '@/lib/search';
import { Sentiment, FeedbackStatus } from '@prisma/client';

export async function POST(req: Request) {
  const auth = await authorizeRequest(['ADMIN', 'ANALYST']);
  if (!auth.authorized || !auth.session) return auth.response;

  const workspaceId = auth.session.user.workspaceId;

  try {
    const body = await req.json();
    const rows: Array<{ content: string; channel?: string; customerLabel?: string }> = Array.isArray(body)
      ? body
      : body.items || [];

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No items provided for import' }, { status: 400 });
    }

    const existingThemes = await prisma.theme.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
    });

    let importedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const row of rows) {
      if (!row.content || typeof row.content !== 'string' || row.content.trim().length < 3) {
        failedCount++;
        errors.push(`Row missing valid content: "${row.content || ''}"`);
        continue;
      }

      try {
        const channel = row.channel || 'CSV Import';
        const customerLabel = row.customerLabel || `CSV User #${Math.floor(Math.random() * 9000 + 1000)}`;

        const classification = await classifyFeedback(
          row.content,
          existingThemes.map((t) => t.name)
        );

        const feedback = await prisma.feedback.create({
          data: {
            content: row.content,
            channel,
            customerLabel,
            sourceRef: `BULK-${Date.now()}-${importedCount}`,
            sentiment: classification.sentiment as Sentiment,
            sentimentScore: classification.sentimentScore,
            featureArea: classification.featureArea,
            status: FeedbackStatus.NEW,
            workspaceId,
          },
        });

        // Link themes
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

        // Add embedding
        const vector = generateSimpleEmbedding(feedback.content);
        await prisma.embedding.create({
          data: {
            feedbackId: feedback.id,
            vector: JSON.stringify(vector),
          },
        });

        importedCount++;
      } catch (err: any) {
        failedCount++;
        errors.push(`Error importing "${row.content.slice(0, 30)}...": ${err.message}`);
      }
    }

    return NextResponse.json({
      message: `Bulk import completed: ${importedCount} imported, ${failedCount} failed`,
      summary: {
        total: rows.length,
        importedCount,
        failedCount,
        errors,
      },
    });
  } catch (error: any) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ error: 'Failed to process bulk upload' }, { status: 500 });
  }
}

