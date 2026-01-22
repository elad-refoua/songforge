import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic, language, purpose, importantNotes, genre, mood } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Build lyrics prompt
    const langInstruction = language === 'hebrew' ? 'Write the lyrics in Hebrew.' :
      language === 'spanish' ? 'Write the lyrics in Spanish.' :
      language === 'french' ? 'Write the lyrics in French.' :
      'Write the lyrics in English.';

    const purposeContext = purpose ? `The song is for a ${purpose} occasion.` : '';
    const moodContext = mood ? `The mood should be ${mood}.` : '';
    const genreContext = genre ? `The genre is ${genre}.` : '';
    const notesContext = importantNotes ? `Important details to include: ${importantNotes}` : '';

    const systemPrompt = `You are a professional songwriter. Create song lyrics with proper structure (verses, chorus, bridge). Use [Verse 1], [Chorus], [Verse 2], [Bridge] markers. The lyrics should be creative, emotional, and fitting for the genre and mood.`;

    const userPrompt = `Write song lyrics about: ${topic}

${langInstruction}
${purposeContext}
${moodContext}
${genreContext}
${notesContext}

Format the lyrics with section markers like [Verse 1], [Chorus], etc. Also suggest a title for the song.

Respond in this exact JSON format:
{"title": "Song Title Here", "lyrics": "full lyrics with section markers"}`;

    // Use ElevenLabs or fall back to a simple generation
    // For now, using a built-in approach without OpenAI dependency
    const openaiKey = process.env.OPENAI_API_KEY;

    if (openaiKey) {
      // Use OpenAI for lyrics generation
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.8,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      const parsed = JSON.parse(content);

      return NextResponse.json({
        title: parsed.title,
        lyrics: parsed.lyrics,
      });
    } else {
      // Fallback: Generate simple template lyrics without AI
      const title = `${topic.split(' ').slice(0, 4).join(' ')}`;
      const lyrics = generateTemplateLyrics(topic, language, mood, purpose, importantNotes);

      return NextResponse.json({ title, lyrics });
    }
  } catch (error: any) {
    console.error('Lyrics generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate lyrics' },
      { status: 500 }
    );
  }
}

function generateTemplateLyrics(
  topic: string,
  language: string,
  mood: string,
  purpose: string,
  notes: string
): string {
  // Simple template-based lyrics when no AI API is available
  if (language === 'hebrew') {
    return `[Verse 1]
שיר על ${topic}
מילים שנולדות מהלב
${notes ? notes : 'רגעים שלא נשכח'}

[Chorus]
${topic}
זה מה שאנחנו
${mood === 'happy' ? 'שמחה בלב' : mood === 'sad' ? 'דמעות של אהבה' : 'רגשות עמוקים'}

[Verse 2]
כל יום חדש
מביא איתו תקווה
${purpose === 'birthday' ? 'יום הולדת שמח' : purpose === 'love' ? 'אהבה אמיתית' : 'חלומות מתגשמים'}

[Chorus]
${topic}
זה מה שאנחנו
${mood === 'happy' ? 'שמחה בלב' : mood === 'sad' ? 'דמעות של אהבה' : 'רגשות עמוקים'}`;
  }

  return `[Verse 1]
A song about ${topic}
Words that come from the heart
${notes ? notes : 'Moments we will never forget'}

[Chorus]
${topic}
This is who we are
${mood === 'happy' ? 'Joy in our hearts' : mood === 'sad' ? 'Tears of love' : 'Deep emotions rising'}

[Verse 2]
Every new day
Brings hope and light
${purpose === 'birthday' ? 'Happy birthday to you' : purpose === 'love' ? 'True love never fades' : 'Dreams coming true'}

[Chorus]
${topic}
This is who we are
${mood === 'happy' ? 'Joy in our hearts' : mood === 'sad' ? 'Tears of love' : 'Deep emotions rising'}

[Bridge]
Through it all we stand together
Nothing can break what we have
${topic} - forever in our hearts`;
}
