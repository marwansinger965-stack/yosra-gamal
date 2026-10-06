-- Yosra Gamal database schema
create extension if not exists pgcrypto;

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  access_code text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  video_url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  duration_minutes integer not null default 30 check(duration_minutes > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  question_text text,
  options jsonb not null,
  correct_option integer not null,
  order_no integer not null default 0
);

create table if not exists exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  score integer,
  submitted_at timestamptz not null default now(),
  unique(exam_id, student_id)
);

create table if not exists exam_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references exam_attempts(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  selected_option integer
);

-- Atomic "one attempt only" submission.
-- The UNIQUE constraint is the final protection against duplicate attempts.
create or replace function submit_exam_once(
  p_exam_id uuid,
  p_student_id uuid,
  p_answers jsonb
) returns uuid
language plpgsql
security definer
as $$
declare
  v_attempt_id uuid;
  v_score integer := 0;
  v_answer jsonb;
  v_q record;
begin
  if exists(select 1 from exam_attempts where exam_id=p_exam_id and student_id=p_student_id) then
    raise exception 'ALREADY_ATTEMPTED';
  end if;

  insert into exam_attempts(exam_id,student_id,score)
  values(p_exam_id,p_student_id,0)
  returning id into v_attempt_id;

  for v_answer in select * from jsonb_array_elements(p_answers)
  loop
    select * into v_q from questions where id=(v_answer->>'question_id')::uuid and exam_id=p_exam_id;
    if found then
      insert into exam_answers(attempt_id,question_id,selected_option)
      values(v_attempt_id,v_q.id,nullif(v_answer->>'selected_option','')::integer);
      if (v_answer->>'selected_option')::integer = v_q.correct_option then
        v_score := v_score + 1;
      end if;
    end if;
  end loop;

  update exam_attempts set score=v_score where id=v_attempt_id;
  return v_attempt_id;
exception
  when unique_violation then
    raise exception 'ALREADY_ATTEMPTED';
end;
$$;

-- For initial development only. Tighten these policies when adding real teacher auth.
alter table students enable row level security;
alter table videos enable row level security;
alter table exams enable row level security;
alter table questions enable row level security;
alter table exam_attempts enable row level security;
alter table exam_answers enable row level security;

create policy "public read active students for login"
on students for select using (active = true);

create policy "public read active videos"
on videos for select using (active = true);

create policy "public read active exams"
on exams for select using (active = true);

create policy "public read questions"
on questions for select using (true);

-- The RPC is security definer so students do not need direct insert/update access.
grant execute on function submit_exam_once(uuid,uuid,jsonb) to anon, authenticated;


-- Development policies for the teacher dashboard.
-- IMPORTANT: before public production, replace these with policies tied to Supabase Auth.
create policy "development insert students" on students for insert with check (true);
create policy "development update students" on students for update using (true) with check (true);
create policy "development insert videos" on videos for insert with check (true);
create policy "development insert exams" on exams for insert with check (true);

-- A student can see only their own attempts once authenticated in a production setup.
-- Keep teacher/admin result policies restricted by teacher identity in production.


-- Student code authentication without exposing the student table to anonymous SELECT.
drop policy if exists "public read active students for login" on students;

create or replace function login_student_by_code(p_code text)
returns table(id uuid, full_name text)
language sql
security definer
set search_path = public
as $$
  select s.id, s.full_name
  from students s
  where s.access_code = p_code and s.active = true
  limit 1;
$$;

revoke all on function login_student_by_code(text) from public;
grant execute on function login_student_by_code(text) to anon, authenticated;

-- Teacher-only CRUD: the teacher must be authenticated.
-- For a single-teacher deployment, authenticated is enough.
create policy "authenticated insert students" on students for insert to authenticated with check (true);
create policy "authenticated update students" on students for update to authenticated using (true) with check (true);
create policy "authenticated select students" on students for select to authenticated using (true);
create policy "authenticated insert videos" on videos for insert to authenticated with check (true);
create policy "authenticated update videos" on videos for update to authenticated using (true) with check (true);
create policy "authenticated insert exams" on exams for insert to authenticated with check (true);
create policy "authenticated update exams" on exams for update to authenticated using (true) with check (true);


-- Question authoring
-- options is JSON array of strings. question_image_url is optional.
alter table questions add column if not exists question_image_url text;

-- Optional per-exam assignment. If no rows exist for an exam, all active students can see it.
create table if not exists exam_students (
  exam_id uuid not null references exams(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  primary key (exam_id, student_id)
);

alter table exam_students enable row level security;
create policy "authenticated manage exam students" on exam_students
for all to authenticated using (true) with check (true);

create policy "public read exam student assignments" on exam_students
for select to anon using (true);

-- Storage bucket for question images. Create it in Supabase if the SQL editor
-- does not permit bucket creation in your project.
insert into storage.buckets (id,name,public)
values ('question-images','question-images',true)
on conflict (id) do nothing;

create policy "authenticated upload question images"
on storage.objects for insert to authenticated
with check (bucket_id='question-images');

create policy "public read question images"
on storage.objects for select to public
using (bucket_id='question-images');

-- Restrict active exam visibility to assigned students when assignments exist.
create or replace function can_student_access_exam(p_exam_id uuid,p_student_id uuid)
returns boolean
language sql
security definer
set search_path=public
as $$
  select
    exists(select 1 from exams e where e.id=p_exam_id and e.active=true)
    and (
      not exists(select 1 from exam_students es where es.exam_id=p_exam_id)
      or exists(select 1 from exam_students es where es.exam_id=p_exam_id and es.student_id=p_student_id)
    );
$$;

-- Allow image-only questions in existing databases.
alter table questions alter column question_text drop not null;
