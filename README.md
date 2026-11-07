# TuniMind: mental wellness web app for university students

A web app that helps Tunisian university students look after their mental health: an AI chatbot for supportive conversations, mood tracking, emotion detection from the webcam, voice input, and relaxation and self-care pages.

Live demo: [tuni-mind.vercel.app](https://tuni-mind.vercel.app/)

## Features

| Feature | How it works |
|---|---|
| **AI support chatbot** | Llama 3 8B through the Groq API, with a system prompt written for Tunisian students |
| **Emotion detection** | Webcam facial-expression recognition in the browser with the pretrained models of [face-api.js](https://github.com/justadudewhohacks/face-api.js) |
| **Voice input** | Web Speech API (speech recognition) for hands-free input |
| **Mood tracker** | Daily mood log and history in the dashboard |
| **Relaxation and self-care** | Breathing, mindfulness and self-care pages |
| **Accounts** | Sign-up and login with Supabase |

## Tech stack

Next.js · TypeScript · Tailwind CSS · Groq API (Llama 3 8B) · face-api.js · Web Speech API · Supabase · Vercel

## Run it

```bash
git clone https://github.com/Med-Amine-03/TuniMind.git
cd TuniMind
npm install
```

Create a `.env.local` file:

```
API_KEY=your_groq_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
npm run dev   # http://localhost:3000
```

## Limits

TuniMind is a student project, not a medical tool. The chatbot can give general wellness support but is not a replacement for a professional.
