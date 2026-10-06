"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Exam = {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
};

type Lecture = {
  id: string;
  title: string;
  description: string | null;
  grade: string;
  video_url: string | null;
  pdf_url: string | null;
  has_homework: boolean;
  has_quiz: boolean;
  active: boolean;
  created_at: string;
};

type Student = {
  id: string;
  name: string;
  grade: string | null;
};

function getYouTubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }

      if (parsed.pathname.startsWith("/embed/")) {
        return url;
      }
    }

    if (parsed.hostname === "youtu.be") {
      const videoId = parsed.pathname.substring(1);

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function VideoPlayer({ url }: { url: string }) {
  const youtubeUrl = getYouTubeEmbedUrl(url);

  if (youtubeUrl) {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "56.25%",
          overflow: "hidden",
          borderRadius: 10,
          background: "#000",
          marginTop: 15,
        }}
      >
        <iframe
          src={youtubeUrl}
          title="Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: "none",
          }}
        />
      </div>
    );
  }

  return (
    <video
      controls
      playsInline
      preload="metadata"
      style={{
        width: "100%",
        borderRadius: 10,
        background: "#000",
        marginTop: 15,
      }}
      src={url}
    >
      المتصفح لا يدعم تشغيل الفيديو.
    </video>
  );
}

export default function Student() {
  const [student, setStudent] =
    useState<Student | null>(null);

  const [exams, setExams] =
    useState<Exam[]>([]);

  const [lectures, setLectures] =
    useState<Lecture[]>([]);

  const [attempts, setAttempts] =
    useState<string[]>([]);

  const [loadingLectures, setLoadingLectures] =
    useState(true);

  useEffect(() => {
    const raw =
      localStorage.getItem("yg_student");

    if (!raw) {
      location.href = "/login";
      return;
    }

    let s: Student;

    try {
      s = JSON.parse(raw);
    } catch {
      localStorage.removeItem("yg_student");
      location.href = "/login";
      return;
    }

    if (!s || !s.id) {
      localStorage.removeItem("yg_student");
      location.href = "/login";
      return;
    }

    setStudent(s);

    async function loadStudentData() {
      if (!supabase) {
        console.error(
          "Supabase is not configured."
        );

        setLoadingLectures(false);
        return;
      }

      // =========================
      // الامتحانات
      // =========================
      const examsResult = await supabase
        .from("exams")
        .select(
          "id,title,description,duration_minutes"
        )
        .eq("active", true)
        .order("created_at", {
          ascending: false,
        });

      if (examsResult.error) {
        console.error(
          "Exam loading error:",
          examsResult.error
        );
      }

      setExams(
        examsResult.data || []
      );

      // =========================
      // المحاضرات حسب المرحلة
      // =========================
      if (s.grade) {
        const lecturesResult =
          await supabase
            .from("lectures")
            .select(
              "id,title,description,grade,video_url,pdf_url,has_homework,has_quiz,active,created_at"
            )
            .eq("active", true)
            .eq("grade", s.grade)
            .order("created_at", {
              ascending: true,
            });

        if (lecturesResult.error) {
          console.error(
            "Lecture loading error:",
            lecturesResult.error
          );

          setLectures([]);
        } else {
          setLectures(
            lecturesResult.data || []
          );
        }
      } else {
        setLectures([]);
      }

      setLoadingLectures(false);

      // =========================
      // محاولات الامتحانات
      // =========================
      const attemptsResult =
        await supabase
          .from("exam_attempts")
          .select("exam_id")
          .eq("student_id", s.id);

      if (attemptsResult.error) {
        console.error(
          "Attempts loading error:",
          attemptsResult.error
        );
      }

      setAttempts(
        (attemptsResult.data || []).map(
          (item: { exam_id: string }) =>
            item.exam_id
        )
      );
    }

    loadStudentData();
  }, []);

  if (!student) {
    return null;
  }

  return (
    <div className="dashboard">
      {/* =========================
          NAVBAR
      ========================= */}
      <nav className="nav">
        <div className="brand">
          Yosra Gamal
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {/* متابعة الطالب */}
          <Link
            href="/student/progress"
            className="btn"
            style={{
              textDecoration: "none",
            }}
          >
            📊 متابعتي
          </Link>

          {/* خروج */}
          <button
            className="btn btn-light"
            onClick={() => {
              localStorage.removeItem(
                "yg_student"
              );

              location.href = "/login";
            }}
          >
            خروج
          </button>
        </div>
      </nav>

      <main className="container topspace">
        {/* =========================
            الترحيب
        ========================= */}
        <h1>
          أهلاً، {student.name}
        </h1>

        {/* =========================
            المرحلة الدراسية
        ========================= */}
        {student.grade && (
          <p
            style={{
              marginTop: 8,
              color: "#666",
            }}
          >
            المرحلة الدراسية:{" "}
            <strong
              style={{
                color: "#800020",
              }}
            >
              {student.grade}
            </strong>
          </p>
        )}

        {/* =========================
            المحاضرات
        ========================= */}
        <section className="section">
          <h2
            style={{
              color: "#800020",
            }}
          >
            📚 المحاضرات
          </h2>

          {!student.grade ? (
            <div className="card">
              <p>
                لم يتم تحديد المرحلة الدراسية
                لهذا الطالب.
              </p>
            </div>
          ) : loadingLectures ? (
            <div className="card">
              <p>
                جاري تحميل المحاضرات...
              </p>
            </div>
          ) : lectures.length === 0 ? (
            <div className="card">
              <p>
                لا توجد محاضرات متاحة لمرحلتك
                الدراسية حالياً.
              </p>
            </div>
          ) : (
            <div className="grid">
              {lectures.map(
                (lecture, index) => (
                  <div
                    className="card"
                    key={lecture.id}
                    style={{
                      textAlign: "right",
                    }}
                  >
                    {/* رقم المحاضرة */}
                    <div
                      style={{
                        fontSize: 14,
                        color: "#800020",
                        marginBottom: 6,
                        fontWeight: "bold",
                      }}
                    >
                      المحاضرة {index + 1}
                    </div>

                    {/* اسم المحاضرة */}
                    <h3>
                      {lecture.title}
                    </h3>

                    {/* الوصف */}
                    {lecture.description && (
                      <p
                        style={{
                          color: "#666",
                          lineHeight: 1.7,
                        }}
                      >
                        {lecture.description}
                      </p>
                    )}

                    {/* =====================
                        الفيديو
                    ===================== */}
                    {lecture.video_url && (
                      <>
                        <div
                          style={{
                            marginTop: 15,
                            fontWeight: "bold",
                          }}
                        >
                          🎥 فيديو المحاضرة
                        </div>

                        <VideoPlayer
                          url={
                            lecture.video_url
                          }
                        />
                      </>
                    )}

                    {/* =====================
                        PDF
                    ===================== */}
                    {lecture.pdf_url && (
                      <div
                        style={{
                          marginTop: 15,
                        }}
                      >
                        <a
                          href={
                            lecture.pdf_url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn"
                          style={{
                            display:
                              "inline-block",
                            textDecoration:
                              "none",
                          }}
                        >
                          📄 فتح ملف المحاضرة
                        </a>
                      </div>
                    )}

                    {/* =====================
                        الواجب
                    ===================== */}
                    {lecture.has_homework && (
                      <div
                        style={{
                          marginTop: 12,
                        }}
                      >
                        <Link
                          href={`/student/lecture/${lecture.id}/homework`}
                          className="btn btn-primary"
                          style={{
                            display:
                              "inline-block",
                            textDecoration:
                              "none",
                          }}
                        >
                          📝 فتح الواجب
                        </Link>
                      </div>
                    )}

                    {/* =====================
                        Quiz
                    ===================== */}
                    {lecture.has_quiz && (
                      <div
                        style={{
                          marginTop: 12,
                        }}
                      >
                        <Link
                          href={`/student/lecture/${lecture.id}/quiz`}
                          className="btn btn-primary"
                          style={{
                            display:
                              "inline-block",
                            textDecoration:
                              "none",
                          }}
                        >
                          ⚡ فتح Quiz
                        </Link>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* =========================
            الامتحانات
        ========================= */}
        <section className="section">
          <h2
            style={{
              color: "#800020",
            }}
          >
            الامتحانات
          </h2>

          {exams.length === 0 ? (
            <div className="card">
              <p>
                لا توجد امتحانات متاحة حالياً.
              </p>
            </div>
          ) : (
            <div className="grid">
              {exams.map((exam) => (
                <div
                  className="card"
                  key={exam.id}
                >
                  <h3>
                    {exam.title}
                  </h3>

                  <p>
                    {exam.description}
                  </p>

                  <p>
                    <span className="pill">
                      {
                        exam.duration_minutes
                      }{" "}
                      دقيقة
                    </span>
                  </p>

                  {attempts.includes(
                    exam.id
                  ) ? (
                    <button
                      className="btn"
                      disabled
                    >
                      تمت المحاولة
                    </button>
                  ) : (
                    <Link
                      className="btn btn-primary"
                      href={
                        `/student/exam/` +
                        exam.id
                      }
                    >
                      ابدأ الامتحان
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* =========================
          FOOTER
      ========================= */}
      <footer className="footer">
        الدعم: 01069225373
      </footer>
    </div>
  );
}