"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

type Student = {
  id: string;
  name: string;
  grade: string | null;
};

type Exam = {
  id: string;
  title: string;
};

type Lecture = {
  id: string;
  title: string;
};

type Assessment = {
  id: string;
  lecture_id: string;
  title: string;
  type: "homework" | "quiz";
  active: boolean;
};

type ExamAttempt = {
  id: string;
  exam_id: string;
  student_id: string;
  started_at: string;
  submitted_at: string | null;
  score: number | null;
  total_questions: number | null;
};

type AssessmentAttempt = {
  id: string;
  assessment_id: string;
  student_id: string;
  score: number | null;
  total_questions: number | null;
  submitted_at: string | null;
};

function getPercentage(
  score: number | null,
  total: number | null
) {
  if (
    score === null ||
    total === null ||
    total <= 0
  ) {
    return null;
  }

  return Math.round((score / total) * 100);
}

function formatDate(date: string | null) {
  if (!date) {
    return "لم يتم التسليم";
  }

  try {
    return new Date(date).toLocaleString(
      "ar-EG",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  } catch {
    return date;
  }
}

function ResultBadge({
  percentage,
}: {
  percentage: number | null;
}) {
  if (percentage === null) {
    return (
      <span
        className="pill"
        style={{
          background: "#eee",
          color: "#666",
        }}
      >
        غير مكتمل
      </span>
    );
  }

  let background = "#eee";
  let color = "#555";

  if (percentage >= 85) {
    background = "#dff6e4";
    color = "#187a35";
  } else if (percentage >= 70) {
    background = "#e7f0ff";
    color = "#2457a6";
  } else if (percentage >= 50) {
    background = "#fff3cd";
    color = "#856404";
  } else {
    background = "#fde2e2";
    color = "#a12626";
  }

  return (
    <span
      className="pill"
      style={{
        background,
        color,
        fontWeight: "bold",
      }}
    >
      {percentage}%
    </span>
  );
}

export default function StudentProgress() {
  const [student, setStudent] =
    useState<Student | null>(null);

  const [exams, setExams] =
    useState<Exam[]>([]);

  const [lectures, setLectures] =
    useState<Lecture[]>([]);

  const [assessments, setAssessments] =
    useState<Assessment[]>([]);

  const [examAttempts, setExamAttempts] =
    useState<ExamAttempt[]>([]);

  const [
    assessmentAttempts,
    setAssessmentAttempts,
  ] = useState<AssessmentAttempt[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const raw =
      localStorage.getItem("yg_student");

    if (!raw) {
      location.href = "/login";
      return;
    }

    let parsedStudent: Student;

    try {
      parsedStudent = JSON.parse(raw);
    } catch {
      localStorage.removeItem("yg_student");
      location.href = "/login";
      return;
    }

    if (!parsedStudent?.id) {
      localStorage.removeItem("yg_student");
      location.href = "/login";
      return;
    }

    setStudent(parsedStudent);

    async function loadProgress() {
      if (!supabase) {
        console.error(
          "Supabase is not configured."
        );
        setLoading(false);
        return;
      }

      const [
        examsResult,
        lecturesResult,
        assessmentsResult,
        examAttemptsResult,
        assessmentAttemptsResult,
      ] = await Promise.all([
        supabase
          .from("exams")
          .select("id,title")
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("lectures")
          .select("id,title")
          .order("created_at", {
            ascending: true,
          }),

        supabase
          .from("lecture_assessments")
          .select(
            "id,lecture_id,title,type,active"
          )
          .eq("active", true),

        supabase
          .from("exam_attempts")
          .select(
            "id,exam_id,student_id,started_at,submitted_at,score,total_questions"
          )
          .eq(
            "student_id",
            parsedStudent.id
          )
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("assessment_attempts")
          .select(
            "id,assessment_id,student_id,score,total_questions,submitted_at"
          )
          .eq(
            "student_id",
            parsedStudent.id
          )
          .order("created_at", {
            ascending: false,
          }),
      ]);

      if (examsResult.error) {
        console.error(
          "Exams error:",
          examsResult.error
        );
      }

      if (lecturesResult.error) {
        console.error(
          "Lectures error:",
          lecturesResult.error
        );
      }

      if (assessmentsResult.error) {
        console.error(
          "Assessments error:",
          assessmentsResult.error
        );
      }

      if (examAttemptsResult.error) {
        console.error(
          "Exam attempts error:",
          examAttemptsResult.error
        );
      }

      if (
        assessmentAttemptsResult.error
      ) {
        console.error(
          "Assessment attempts error:",
          assessmentAttemptsResult.error
        );
      }

      setExams(
        examsResult.data || []
      );

      setLectures(
        lecturesResult.data || []
      );

      setAssessments(
        assessmentsResult.data || []
      );

      setExamAttempts(
        examAttemptsResult.data || []
      );

      setAssessmentAttempts(
        assessmentAttemptsResult.data || []
      );

      setLoading(false);
    }

    loadProgress();
  }, []);

  const submittedExamAttempts =
    useMemo(() => {
      return examAttempts.filter(
        (attempt) =>
          attempt.submitted_at !== null
      );
    }, [examAttempts]);

  const submittedAssessmentAttempts =
    useMemo(() => {
      return assessmentAttempts.filter(
        (attempt) =>
          attempt.submitted_at !== null
      );
    }, [assessmentAttempts]);

  const homeworkAssessments =
    useMemo(() => {
      return assessments.filter(
        (assessment) =>
          assessment.type === "homework"
      );
    }, [assessments]);

  const quizAssessments =
    useMemo(() => {
      return assessments.filter(
        (assessment) =>
          assessment.type === "quiz"
      );
    }, [assessments]);

  const examAverage = useMemo(() => {
    const percentages =
      submittedExamAttempts
        .map((attempt) =>
          getPercentage(
            attempt.score,
            attempt.total_questions
          )
        )
        .filter(
          (
            value
          ): value is number =>
            value !== null
        );

    if (percentages.length === 0) {
      return null;
    }

    return Math.round(
      percentages.reduce(
        (sum, value) =>
          sum + value,
        0
      ) / percentages.length
    );
  }, [submittedExamAttempts]);

  const homeworkAverage =
    useMemo(() => {
      const homeworkIds =
        new Set(
          homeworkAssessments.map(
            (item) => item.id
          )
        );

      const percentages =
        submittedAssessmentAttempts
          .filter((attempt) =>
            homeworkIds.has(
              attempt.assessment_id
            )
          )
          .map((attempt) =>
            getPercentage(
              attempt.score,
              attempt.total_questions
            )
          )
          .filter(
            (
              value
            ): value is number =>
              value !== null
          );

      if (percentages.length === 0) {
        return null;
      }

      return Math.round(
        percentages.reduce(
          (sum, value) =>
            sum + value,
          0
        ) / percentages.length
      );
    }, [
      homeworkAssessments,
      submittedAssessmentAttempts,
    ]);

  const bestResult = useMemo(() => {
    const examPercentages =
      submittedExamAttempts
        .map((attempt) =>
          getPercentage(
            attempt.score,
            attempt.total_questions
          )
        )
        .filter(
          (
            value
          ): value is number =>
            value !== null
        );

    const assessmentPercentages =
      submittedAssessmentAttempts
        .map((attempt) =>
          getPercentage(
            attempt.score,
            attempt.total_questions
          )
        )
        .filter(
          (
            value
          ): value is number =>
            value !== null
        );

    const all = [
      ...examPercentages,
      ...assessmentPercentages,
    ];

    if (all.length === 0) {
      return null;
    }

    return Math.max(...all);
  }, [
    submittedExamAttempts,
    submittedAssessmentAttempts,
  ]);

  function getExamName(examId: string) {
    return (
      exams.find(
        (exam) => exam.id === examId
      )?.title || "امتحان"
    );
  }

  function getAssessment(
    assessmentId: string
  ) {
    return assessments.find(
      (assessment) =>
        assessment.id === assessmentId
    );
  }

  function getLectureName(
    lectureId: string
  ) {
    return (
      lectures.find(
        (lecture) =>
          lecture.id === lectureId
      )?.title || "محاضرة"
    );
  }

  function logout() {
    localStorage.removeItem(
      "yg_student"
    );

    location.href = "/login";
  }

  if (!student) {
    return null;
  }

  if (loading) {
    return (
      <div className="dashboard">
        <nav className="nav">
          <div className="brand">
            Yosra Gamal
          </div>

          <button
            className="btn btn-light"
            onClick={logout}
          >
            خروج
          </button>
        </nav>

        <main className="container topspace">
          <div className="card">
            <p>
              جاري تحميل متابعتك...
            </p>
          </div>
        </main>
      </div>
    );
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
          <Link
            href="/student"
            className="btn"
            style={{
              textDecoration: "none",
            }}
          >
            🏠 الرئيسية
          </Link>

          <button
            className="btn btn-light"
            onClick={logout}
          >
            خروج
          </button>
        </div>
      </nav>

      <main className="container topspace">
        {/* =========================
            HEADER
        ========================= */}
        <div
          style={{
            marginBottom: 25,
          }}
        >
          <h1>
            📊 متابعتي
          </h1>

          <p
            style={{
              marginTop: 8,
              color: "#666",
            }}
          >
            أهلاً {student.name}
          </p>

          {student.grade && (
            <p
              style={{
                marginTop: 5,
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
        </div>

        {/* =========================
            STATISTICS
        ========================= */}
        <section className="section">
          <h2
            style={{
              color: "#800020",
            }}
          >
            ملخص مستواك
          </h2>

          <div className="grid">
            <div className="card">
              <div
                style={{
                  fontSize: 14,
                  color: "#666",
                }}
              >
                الامتحانات المكتملة
              </div>

              <div
                style={{
                  fontSize: 32,
                  fontWeight: "bold",
                  color: "#800020",
                  marginTop: 8,
                }}
              >
                {
                  submittedExamAttempts.length
                }
              </div>
            </div>

            <div className="card">
              <div
                style={{
                  fontSize: 14,
                  color: "#666",
                }}
              >
                متوسط الامتحانات
              </div>

              <div
                style={{
                  fontSize: 32,
                  fontWeight: "bold",
                  color: "#800020",
                  marginTop: 8,
                }}
              >
                {examAverage === null
                  ? "—"
                  : `${examAverage}%`}
              </div>
            </div>

            <div className="card">
              <div
                style={{
                  fontSize: 14,
                  color: "#666",
                }}
              >
                متوسط الواجبات
              </div>

              <div
                style={{
                  fontSize: 32,
                  fontWeight: "bold",
                  color: "#800020",
                  marginTop: 8,
                }}
              >
                {homeworkAverage === null
                  ? "—"
                  : `${homeworkAverage}%`}
              </div>
            </div>

            <div className="card">
              <div
                style={{
                  fontSize: 14,
                  color: "#666",
                }}
              >
                أفضل نتيجة
              </div>

              <div
                style={{
                  fontSize: 32,
                  fontWeight: "bold",
                  color: "#800020",
                  marginTop: 8,
                }}
              >
                {bestResult === null
                  ? "—"
                  : `${bestResult}%`}
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            EXAMS
        ========================= */}
        <section className="section">
          <h2
            style={{
              color: "#800020",
            }}
          >
            نتائج الامتحانات
          </h2>

          {submittedExamAttempts.length ===
          0 ? (
            <div className="card">
              <p>
                لم تقم بتسليم أي امتحان
                حتى الآن.
              </p>
            </div>
          ) : (
            <div className="grid">
              {submittedExamAttempts.map(
                (attempt) => {
                  const percentage =
                    getPercentage(
                      attempt.score,
                      attempt.total_questions
                    );

                  return (
                    <div
                      className="card"
                      key={attempt.id}
                      style={{
                        textAlign: "right",
                      }}
                    >
                      <h3>
                        {getExamName(
                          attempt.exam_id
                        )}
                      </h3>

                      <p
                        style={{
                          marginTop: 10,
                        }}
                      >
                        النتيجة:{" "}
                        <strong>
                          {attempt.score ?? 0}
                          {" / "}
                          {attempt.total_questions ??
                            0}
                        </strong>
                      </p>

                      <p
                        style={{
                          marginTop: 10,
                        }}
                      >
                        النسبة:{" "}
                        <ResultBadge
                          percentage={
                            percentage
                          }
                        />
                      </p>

                      <p
                        style={{
                          marginTop: 10,
                          color: "#666",
                          fontSize: 14,
                        }}
                      >
                        تم التسليم:{" "}
                        {formatDate(
                          attempt.submitted_at
                        )}
                      </p>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* =========================
            HOMEWORK
        ========================= */}
        <section className="section">
          <h2
            style={{
              color: "#800020",
            }}
          >
            نتائج الواجبات
          </h2>

          {submittedAssessmentAttempts.filter(
            (attempt) => {
              const assessment =
                getAssessment(
                  attempt.assessment_id
                );

              return (
                assessment?.type ===
                "homework"
              );
            }
          ).length === 0 ? (
            <div className="card">
              <p>
                لم تقم بتسليم أي واجب
                حتى الآن.
              </p>
            </div>
          ) : (
            <div className="grid">
              {submittedAssessmentAttempts
                .filter((attempt) => {
                  const assessment =
                    getAssessment(
                      attempt.assessment_id
                    );

                  return (
                    assessment?.type ===
                    "homework"
                  );
                })
                .map((attempt) => {
                  const assessment =
                    getAssessment(
                      attempt.assessment_id
                    );

                  if (!assessment) {
                    return null;
                  }

                  const percentage =
                    getPercentage(
                      attempt.score,
                      attempt.total_questions
                    );

                  return (
                    <div
                      className="card"
                      key={attempt.id}
                      style={{
                        textAlign: "right",
                      }}
                    >
                      <h3>
                        {assessment.title}
                      </h3>

                      <p
                        style={{
                          color: "#666",
                          marginTop: 6,
                        }}
                      >
                        {
                          getLectureName(
                            assessment.lecture_id
                          )
                        }
                      </p>

                      <p
                        style={{
                          marginTop: 10,
                        }}
                      >
                        النتيجة:{" "}
                        <strong>
                          {attempt.score ?? 0}
                          {" / "}
                          {attempt.total_questions ??
                            0}
                        </strong>
                      </p>

                      <p
                        style={{
                          marginTop: 10,
                        }}
                      >
                        النسبة:{" "}
                        <ResultBadge
                          percentage={
                            percentage
                          }
                        />
                      </p>

                      <p
                        style={{
                          marginTop: 10,
                          color: "#666",
                          fontSize: 14,
                        }}
                      >
                        تم التسليم:{" "}
                        {formatDate(
                          attempt.submitted_at
                        )}
                      </p>
                    </div>
                  );
                })}
            </div>
          )}
        </section>

        {/* =========================
            QUIZZES
        ========================= */}
        <section className="section">
          <h2
            style={{
              color: "#800020",
            }}
          >
            نتائج الـ Quiz
          </h2>

          {submittedAssessmentAttempts.filter(
            (attempt) => {
              const assessment =
                getAssessment(
                  attempt.assessment_id
                );

              return (
                assessment?.type === "quiz"
              );
            }
          ).length === 0 ? (
            <div className="card">
              <p>
                لم تقم بتسليم أي Quiz
                حتى الآن.
              </p>
            </div>
          ) : (
            <div className="grid">
              {submittedAssessmentAttempts
                .filter((attempt) => {
                  const assessment =
                    getAssessment(
                      attempt.assessment_id
                    );

                  return (
                    assessment?.type === "quiz"
                  );
                })
                .map((attempt) => {
                  const assessment =
                    getAssessment(
                      attempt.assessment_id
                    );

                  if (!assessment) {
                    return null;
                  }

                  const percentage =
                    getPercentage(
                      attempt.score,
                      attempt.total_questions
                    );

                  return (
                    <div
                      className="card"
                      key={attempt.id}
                      style={{
                        textAlign: "right",
                      }}
                    >
                      <h3>
                        {assessment.title}
                      </h3>

                      <p
                        style={{
                          color: "#666",
                          marginTop: 6,
                        }}
                      >
                        {
                          getLectureName(
                            assessment.lecture_id
                          )
                        }
                      </p>

                      <p
                        style={{
                          marginTop: 10,
                        }}
                      >
                        النتيجة:{" "}
                        <strong>
                          {attempt.score ?? 0}
                          {" / "}
                          {attempt.total_questions ??
                            0}
                        </strong>
                      </p>

                      <p
                        style={{
                          marginTop: 10,
                        }}
                      >
                        النسبة:{" "}
                        <ResultBadge
                          percentage={
                            percentage
                          }
                        />
                      </p>

                      <p
                        style={{
                          marginTop: 10,
                          color: "#666",
                          fontSize: 14,
                        }}
                      >
                        تم التسليم:{" "}
                        {formatDate(
                          attempt.submitted_at
                        )}
                      </p>
                    </div>
                  );
                })}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        الدعم: 01069225373
      </footer>
    </div>
  );
}