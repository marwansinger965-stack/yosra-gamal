# Yosra Gamal — Educational Platform

## What is included
- Burgundy/white Arabic RTL interface.
- Student login by unique access code.
- Teacher dashboard:
  - add/activate/deactivate students
  - add videos
  - create exams
- Exam page with questions.
- One-attempt-per-student-per-exam enforced at database level.
- Supabase SQL schema + atomic submission RPC.
- Support: 01069225373.

## Run
```bash
npm install
npm run dev
```

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Then run `supabase/schema.sql` in Supabase SQL Editor.

## Important production security
The included teacher dashboard is intentionally a functional development dashboard. Before opening it publicly, replace its temporary login with Supabase Auth and restrict all teacher CRUD operations with RLS tied to the authenticated teacher. Do not expose a shared teacher password.

For real video files, use Supabase Storage (prefer private buckets + signed URLs for paid/private lessons).

## One-attempt protection
`exam_attempts` contains:
`unique(exam_id, student_id)`

The `submit_exam_once` PostgreSQL function inserts the attempt and answers atomically. A second submission receives `ALREADY_ATTEMPTED`, even if a student refreshes or submits from another device.

## Support
01069225373

## Questions and automatic grading
The teacher can create a multiple-choice question with text, four options, and a correct option. The submission RPC calculates the score automatically and stores the attempt and answers. Question images are supported through `question_image_url` and the `question-images` Supabase Storage bucket.
