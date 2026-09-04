export interface AIAnalysisResult {
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  sentimentScore: number;
  category: 'Performance' | 'Bug' | 'Feature Request' | 'UI/UX' | 'Billing' | 'Support' | 'General';
  urgency: 'High' | 'Medium' | 'Low';
  summary: string;
  tags: string[];
}

/**
 * Intelligent feedback classification engine.
 * Computes sentiment, sentiment score (-1 to 1), category, urgency, tags, and summary.
 */
export function analyzeFeedbackWithAI(content: string): AIAnalysisResult {
  const text = content.toLowerCase();

  // 1. Sentiment Keywords & Scoring
  const positiveWords = [
    'great', 'love', 'awesome', 'excellent', 'amazing', 'fast', 'smooth', 'helpful',
    'fantastic', 'perfect', 'easy', 'seamless', 'good', 'best', 'superb', 'enjoy',
    'intuitive', 'clean', 'impressed', 'brilliant', 'wonderful', 'favorite', 'reliable'
  ];

  const negativeWords = [
    'slow', 'lag', 'broken', 'error', 'bug', 'crash', 'terrible', 'worst', 'horrible',
    'frustrating', 'hard', 'confusing', 'hate', 'down', 'fail', 'failed', 'issue',
    'problem', 'expensive', 'charge', 'stuck', 'freeze', 'unusable', 'bad', 'poor', 'glitch'
  ];

  let posScore = 0;
  let negScore = 0;

  positiveWords.forEach((word) => {
    if (text.includes(word)) posScore += 1;
  });

  negativeWords.forEach((word) => {
    if (text.includes(word)) negScore += 1;
  });

  let sentiment: 'Positive' | 'Neutral' | 'Negative' = 'Neutral';
  let sentimentScore = 0;

  if (posScore > negScore) {
    sentiment = 'Positive';
    sentimentScore = Math.min(1.0, 0.4 + posScore * 0.2);
  } else if (negScore > posScore) {
    sentiment = 'Negative';
    sentimentScore = Math.max(-1.0, -0.4 - negScore * 0.2);
  } else {
    sentiment = 'Neutral';
    sentimentScore = 0.0;
  }

  // 2. Category Detection
  let category: AIAnalysisResult['category'] = 'General';
  const tags: string[] = [];

  if (text.includes('slow') || text.includes('loading') || text.includes('speed') || text.includes('latency') || text.includes('lag') || text.includes('freeze')) {
    category = 'Performance';
    tags.push('speed', 'latency');
  } else if (text.includes('bug') || text.includes('crash') || text.includes('error') || text.includes('broken') || text.includes('failed') || text.includes('glitch')) {
    category = 'Bug';
    tags.push('defect', 'stability');
  } else if (text.includes('feature') || text.includes('add') || text.includes('would love') || text.includes('wish') || text.includes('support for') || text.includes('could you')) {
    category = 'Feature Request';
    tags.push('enhancement', 'feature');
  } else if (text.includes('ui') || text.includes('ux') || text.includes('layout') || text.includes('design') || text.includes('dark mode') || text.includes('button') || text.includes('color') || text.includes('mobile')) {
    category = 'UI/UX';
    tags.push('design', 'interface');
  } else if (text.includes('price') || text.includes('pricing') || text.includes('billing') || text.includes('subscription') || text.includes('charge') || text.includes('invoice') || text.includes('refund') || text.includes('plan')) {
    category = 'Billing';
    tags.push('pricing', 'payment');
  } else if (text.includes('agent') || text.includes('support') || text.includes('ticket') || text.includes('helpdesk') || text.includes('response time')) {
    category = 'Support';
    tags.push('customer-service');
  }

  // 3. Urgency Detection
  let urgency: 'High' | 'Medium' | 'Low' = 'Low';
  const highUrgencyWords = ['urgent', 'emergency', 'asap', 'broken', 'crash', 'cannot login', 'charged twice', 'data loss', 'down', 'production', 'blocker'];
  const mediumUrgencyWords = ['issue', 'problem', 'slow', 'confusing', 'wrong', 'help', 'fix'];

  if (highUrgencyWords.some((w) => text.includes(w)) || (sentiment === 'Negative' && (category === 'Bug' || category === 'Billing'))) {
    urgency = 'High';
  } else if (mediumUrgencyWords.some((w) => text.includes(w)) || sentiment === 'Negative') {
    urgency = 'Medium';
  }

  // 4. Clean 1-sentence summary
  const cleanFirstSentence = content.split(/[.!?]/)[0]?.trim() || content.slice(0, 100);
  const summary = cleanFirstSentence.length > 90 ? `${cleanFirstSentence.slice(0, 87)}...` : cleanFirstSentence;

  if (tags.length === 0) {
    tags.push('feedback', category.toLowerCase());
  }

  return {
    sentiment,
    sentimentScore: Number(sentimentScore.toFixed(2)),
    category,
    urgency,
    summary: summary || 'Customer provided general feedback.',
    tags,
  };
}
