import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/db/supabase';

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

    // Build template variables
    const knownLangs: Record<string, string> = {
      english: 'English', hebrew: 'Hebrew', spanish: 'Spanish', french: 'French',
    };
    const langName = knownLangs[language] || language;
    const langInstruction = `Write the lyrics in ${langName}.`;

    const purposeContext = purpose ? `The song is for a ${purpose} occasion.` : '';
    const moodContext = mood ? `The mood should be ${mood}.` : '';
    const genreContext = genre ? `The genre is ${genre}.` : '';
    const notesContext = importantNotes ? `Important details to include: ${importantNotes}` : '';

    // Fetch active lyrics prompt from database
    let promptTemplate = '';
    let temperature = 0.8;

    const supabase = getServiceSupabase();
    const { data: activePrompt, error: promptError } = await (supabase.from('system_prompts') as any)
      .select('content, temperature')
      .eq('type', 'lyrics')
      .eq('is_active', true)
      .maybeSingle();

    if (promptError) {
      console.error('Failed to fetch active lyrics prompt:', promptError);
    }

    if (activePrompt) {
      promptTemplate = activePrompt.content;
      temperature = activePrompt.temperature;
    }

    // Fallback to default prompt if no active prompt found
    if (!promptTemplate) {
      promptTemplate = `You are a professional songwriter. Create song lyrics with proper structure (verses, chorus, bridge). Use [Verse 1], [Chorus], [Verse 2], [Bridge] markers. The lyrics should be creative, emotional, and fitting for the genre and mood.

Write song lyrics about: {{topic}}

{{langInstruction}}
{{purposeContext}}
{{moodContext}}
{{genreContext}}
{{notesContext}}

Format the lyrics with section markers like [Verse 1], [Chorus], etc. Also suggest a title for the song.

Respond in this exact JSON format:
{"title": "Song Title Here", "lyrics": "full lyrics with section markers"}`;
    }

    // Replace template variables
    const prompt = promptTemplate
      .replace(/\{\{topic\}\}/g, topic)
      .replace(/\{\{langInstruction\}\}/g, langInstruction)
      .replace(/\{\{purposeContext\}\}/g, purposeContext)
      .replace(/\{\{moodContext\}\}/g, moodContext)
      .replace(/\{\{genreContext\}\}/g, genreContext)
      .replace(/\{\{notesContext\}\}/g, notesContext);

    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey) {
      // Use Gemini for lyrics generation
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        throw new Error('No content returned from Gemini');
      }

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
