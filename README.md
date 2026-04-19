# AI Mock Interview - Next.js Edition

A modern Next.js application for practicing mock interviews with AI-powered feedback, PDF analysis, and voice recording capabilities.

## Features

- ✅ **User Authentication** - Secure authentication with Clerk
- ✅ **Mock Interviews** - Create and practice mock interviews
- ✅ **AI-Powered Questions** - Auto-generated interview questions using Google Generative AI
- ✅ **PDF Upload & Analysis** - Upload resumes/CVs with OCR text extraction
- ✅ **Voice Recording** - Record your interview answers
- ✅ **Real-time Feedback** - AI-powered feedback on your responses
- ✅ **Performance Tracking** - Track your interview history and improvements
- ✅ **Responsive Design** - Beautiful UI with Tailwind CSS and shadcn/ui

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Auth**: Clerk
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **AI**: Google Generative AI (Gemini)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **PDF Processing**: pdf.js, Tesseract.js (OCR)

## Getting Started

### Prerequisites

- Node.js 18+
- npm/pnpm package manager

### Installation

1. Navigate to the project directory:
   ```bash
   cd ai-mock-interview-nextjs
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

   Fill in your credentials:
   - Clerk publishable and secret keys
   - Firebase configuration
   - Google Generative AI API key

### Running the Application

**Development mode:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

**Production build:**
```bash
npm run build
npm run start
```

## Environment Variables

Create a `.env.local` file with:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_key

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_id

# Google Generative AI
NEXT_PUBLIC_GEMINI_API_KEY=your_key
```

## Project Structure

```
src/
├── app/                    # Pages and routes
├── config/                 # Firebase config
├── lib/                    # Utilities and helpers
├── components/             # React components
└── middleware.ts           # Auth middleware
```

## Available Routes

- `/` - Home page
- `/sign-in` - Sign in
- `/sign-up` - Sign up
- `/dashboard` - User dashboard
- `/create-interview` - Create new interview
- `/contact` - Contact page
- `/about` - About page
- `/services` - Services page

## Setup Instructions

### 1. Clerk Authentication
- Go to [clerk.com](https://clerk.com) and create an account
- Create a new application
- Copy your keys to `.env.local`

### 2. Firebase Setup
- Create a project at [firebase.google.com](https://firebase.google.com)
- Enable Firestore and Storage
- Copy your credentials

### 3. Google Generative AI
- Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Add to `.env.local`

## Features Implemented

- ✅ Home page with hero section
- ✅ Authentication with Clerk
- ✅ Dashboard with interview list
- ✅ Create interview form
- ✅ Contact, About, Services pages
- ✅ Responsive design with Tailwind
- ✅ Firebase integration ready
- ✅ PDF OCR ready for implementation
- ✅ Gemini AI integration ready

## Next Steps to Complete

1. Implement interview creation logic with Firebase
2. Add PDF upload and OCR processing
3. Create interview questions page
4. Implement voice recording for answers
5. Add AI feedback generation
6. Create user profile management

## Troubleshooting

### Port already in use
```bash
npm run dev -- -p 3001
```

### Module not found
```bash
npm install
npm run dev
```

## Deployment

Deploy to Vercel with one click:
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo)

Or deploy to any Node.js hosting platform.

## License

MIT
