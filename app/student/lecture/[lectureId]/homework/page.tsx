"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../../lib/supabase";

type Question = {
  id: string;
  question_text: string;
  options: string[];
  correct_option: number;
  order_no: number;
};

type Assessment = {
  id: string;
  lecture_id: string;
  title: string;
  type: string;
  active: boolean;
};

type PreviousAttempt = {
  score: number | null;
  total_questions: number | null;
  answers: Record<string, number> | null;
  submitted_at: string | null;
};

export default function HomeworkPage() {
  const params = useParams();
  const router = useRouter();

  const lectureId = params.lectureId as string;

  const [student, setStudent] =
    useState<any>(null);

  const [assessment, setAssessment] =
    useState<Assessment | null>(null);

  const [questions, setQuestions] =
    useState<Question[]>([]);

  const [answers, setAnswers] =
    useState<Record<string, number>>({});

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [result, setResult] =
    useState<number | null>(null);

  const [message, setMessage] =
    useState("");

  const [submitted, setSubmitted] =
    useState(false);

  useEffect(() => {
    const raw =
      localStorage.getItem("yg_student");

    if (!raw) {
      router.replace("/login");
      return;
    }

    let s: any;

    try {
      s = JSON.parse(raw);
    } catch {
      localStorage.removeItem("yg_student");
      router.replace("/login");
      return;
    }

    setStudent(s);

    loadHomework(s.id);
  }, [lectureId]);

  async function loadHomework(
    studentId: string
  ) {
    if (!supabase) return;

    setLoading(true);
    setMessage("");

    // =========================
    // تحميل الواجب
    // =========================
    const a = await supabase
      .from("lecture_assessments")
      .select(
        "id,lecture_id,title,type,active"
      )
      .eq("lecture_id", lectureId)
      .eq("type", "homework")
      .eq("active", true)
      .order("created_at", {
        ascending: true,
      })
      .limit(1)
      .maybeSingle();

    if (a.error) {
      console.error(a.error);

      setMessage(
        "حدث خطأ أثناء تحميل الواجب: " +
          a.error.message
      );

      setLoading(false);
      return;
    }

    if (!a.data) {
      setMessage(
        "لا يوجد واجب مضاف لهذه المحاضرة حتى الآن."
      );

      setLoading(false);
      return;
    }

    setAssessment(a.data);

    // =========================
    // تحميل الأسئلة
    // =========================
    const q = await supabase
      .from("assessment_questions")
      .select(
        "id,question_text,options,correct_option,order_no"
      )
      .eq(
        "assessment_id",
        a.data.id
      )
      .order("order_no", {
        ascending: true,
      });

    if (q.error) {
      console.error(q.error);

      setMessage(
        "حدث خطأ أثناء تحميل أسئلة الواجب: " +
          q.error.message
      );

      setLoading(false);
      return;
    }

    setQuestions(q.data || []);

    // =========================
    // محاولة سابقة
    // =========================
    const attempt = await supabase
      .from("assessment_attempts")
      .select(
        "score,total_questions,answers,submitted_at"
      )
      .eq(
        "assessment_id",
        a.data.id
      )
      .eq(
        "student_id",
        studentId
      )
      .maybeSingle();

    if (attempt.error) {
      console.error(
        "Attempt loading error:",
        attempt.error
      );
    }

    if (
      attempt.data?.submitted_at
    ) {
      const previous =
        attempt.data as PreviousAttempt;

      setSubmitted(true);

      setResult(
        previous.score ?? 0
      );

      if (
        previous.answers &&
        typeof previous.answers ===
          "object"
      ) {
        setAnswers(
          previous.answers
        );
      }

      setMessage(
        `تم تسليم الواجب من قبل. درجتك: ${
          previous.score ?? 0
        }/${previous.total_questions ?? 0}`
      );
    }

    setLoading(false);
  }

  function chooseAnswer(
    questionId: string,
    optionIndex: number
  ) {
    if (submitted) return;

    setAnswers((prev) => ({
      ...prev,
      [questionId]:
        optionIndex,
    }));
  }

  async function submitHomework() {
    if (
      !supabase ||
      !student ||
      !assessment
    ) {
      return;
    }

    if (submitted) return;

    if (questions.length === 0) {
      setMessage(
        "لا توجد أسئلة في هذا الواجب."
      );
      return;
    }

    const unanswered =
      questions.filter(
        (q) =>
          answers[q.id] ===
          undefined
      );

    if (unanswered.length > 0) {
      setMessage(
        `لسه فيه ${unanswered.length} سؤال بدون إجابة.`
      );
      return;
    }

    const confirmed =
      window.confirm(
        "هل أنت متأكد من تسليم الواجب؟ لن تستطيع تعديل إجاباتك بعد التسليم."
      );

    if (!confirmed) return;

    setSubmitting(true);
    setMessage("");

    let score = 0;

    questions.forEach((q) => {
      if (
        answers[q.id] ===
        q.correct_option
      ) {
        score++;
      }
    });

    const insert = await supabase
      .from("assessment_attempts")
      .insert({
        assessment_id:
          assessment.id,

        student_id:
          student.id,

        score,

        total_questions:
          questions.length,

        answers,

        submitted_at:
          new Date().toISOString(),
      });

    if (insert.error) {
      if (
        insert.error.code ===
        "23505"
      ) {
        setMessage(
          "لقد قمت بتسليم هذا الواجب من قبل."
        );

        await loadHomework(
          student.id
        );
      } else {
        setMessage(
          "فشل تسليم الواجب: " +
            insert.error.message
        );
      }

      setSubmitting(false);
      return;
    }

    setResult(score);
    setSubmitted(true);

    setMessage(
      `تم تسليم الواجب بنجاح. درجتك ${score}/${questions.length}`
    );

    setSubmitting(false);
  }

  if (!student) {
    return null;
  }

  if (loading) {
    return (
      <div className="dashboard">
        <main className="container topspace">
          <div className="card">
            <p>
              جاري تحميل الواجب...
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

        <button
          className="btn btn-light"
          onClick={() =>
            router.push(
              "/student"
            )
          }
        >
          ← العودة للمحاضرات
        </button>
      </nav>

      <main className="container topspace">
        {/* =========================
            العنوان
        ========================= */}
        <div className="card">
          <h1>
            📝 الواجب
          </h1>

          {assessment && (
            <h2
              style={{
                color: "#800020",
                marginTop: 10,
              }}
            >
              {assessment.title}
            </h2>
          )}

          <p
            style={{
              color: "#666",
              marginTop: 8,
            }}
          >
            عدد الأسئلة:{" "}
            {questions.length}
          </p>
        </div>

        {/* =========================
            الرسالة
        ========================= */}
        {message && (
          <div
            className="card"
            style={{
              marginTop: 15,
              borderRight:
                "4px solid #800020",
            }}
          >
            <p>{message}</p>
          </div>
        )}

        {/* =========================
            النتيجة
        ========================= */}
        {result !== null && (
          <div
            className="card"
            style={{
              marginTop: 15,
              textAlign: "center",
            }}
          >
            <h2
              style={{
                color: "#800020",
              }}
            >
              🎉 نتيجتك
            </h2>

            <div
              style={{
                fontSize: 38,
                fontWeight: "bold",
                marginTop: 10,
              }}
            >
              {result} /{" "}
              {questions.length}
            </div>

            <p
              style={{
                marginTop: 10,
                color: "#666",
              }}
            >
              {result ===
              questions.length
                ? "ممتاز! كل إجاباتك صحيحة 🎉"
                : `أجبت بشكل صحيح على ${result} من ${questions.length} سؤال.`}
            </p>
          </div>
        )}

        {/* =========================
            الأسئلة
        ========================= */}
        {questions.length > 0 && (
          <section
            className="section"
            style={{
              marginTop: 20,
            }}
          >
            {questions.map(
              (
                question,
                index
              ) => {
                const studentAnswer =
                  answers[
                    question.id
                  ];

                const isCorrect =
                  studentAnswer ===
                  question.correct_option;

                return (
                  <div
                    className="card"
                    key={
                      question.id
                    }
                    style={{
                      marginBottom: 18,
                    }}
                  >
                    {/* السؤال */}
                    <h3>
                      {index + 1}.{" "}
                      {
                        question.question_text
                      }
                    </h3>

                    {/* حالة السؤال بعد التسليم */}
                    {submitted && (
                      <div
                        style={{
                          marginTop: 12,
                          padding: 10,
                          borderRadius: 8,
                          background:
                            isCorrect
                              ? "#e8f7ee"
                              : "#fdeaea",
                          color:
                            isCorrect
                              ? "#167a3e"
                              : "#b00020",
                          fontWeight:
                            "bold",
                        }}
                      >
                        {isCorrect
                          ? "✅ إجابتك صحيحة"
                          : "❌ إجابتك خاطئة"}
                      </div>
                    )}

                    {/* الاختيارات */}
                    <div
                      style={{
                        marginTop: 15,
                        display: "grid",
                        gap: 10,
                      }}
                    >
                      {question.options.map(
                        (
                          option,
                          optionIndex
                        ) => {
                          const selected =
                            studentAnswer ===
                            optionIndex;

                          const correct =
                            question.correct_option ===
                            optionIndex;

                          let background =
                            "#fff";

                          let border =
                            "1px solid #ddd";

                          let textColor =
                            "#222";

                          if (
                            submitted &&
                            correct
                          ) {
                            background =
                              "#e8f7ee";

                            border =
                              "2px solid #16803c";

                            textColor =
                              "#167a3e";
                          } else if (
                            submitted &&
                            selected &&
                            !correct
                          ) {
                            background =
                              "#fdeaea";

                            border =
                              "2px solid #b00020";

                            textColor =
                              "#b00020";
                          } else if (
                            selected
                          ) {
                            background =
                              "#f8e9ef";

                            border =
                              "2px solid #800020";
                          }

                          return (
                            <button
                              key={
                                optionIndex
                              }
                              type="button"
                              disabled={
                                submitted
                              }
                              onClick={() =>
                                chooseAnswer(
                                  question.id,
                                  optionIndex
                                )
                              }
                              style={{
                                textAlign:
                                  "right",
                                padding:
                                  "12px 15px",
                                borderRadius:
                                  10,
                                border,
                                background,
                                color:
                                  textColor,
                                cursor:
                                  submitted
                                    ? "default"
                                    : "pointer",
                                fontSize: 16,
                              }}
                            >
                              <strong>
                                {String.fromCharCode(
                                  65 +
                                    optionIndex
                                )}
                                .
                              </strong>{" "}
                              {option}

                              {/* علامة الإجابة الصحيحة */}
                              {submitted &&
                                correct && (
                                  <span
                                    style={{
                                      marginRight:
                                        8,
                                      fontWeight:
                                        "bold",
                                    }}
                                  >
                                    ✓ الإجابة الصحيحة
                                  </span>
                                )}

                              {/* علامة اختيار الطالب */}
                              {submitted &&
                                selected &&
                                !correct && (
                                  <span
                                    style={{
                                      marginRight:
                                        8,
                                      fontWeight:
                                        "bold",
                                    }}
                                  >
                                    ✗ إجابتك
                                  </span>
                                )}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </section>
        )}

        {/* =========================
            تسليم
        ========================= */}
        {questions.length >
          0 &&
          !submitted && (
            <div
              style={{
                marginTop: 20,
                marginBottom: 40,
                textAlign: "center",
              }}
            >
              <button
                className="btn btn-primary"
                onClick={
                  submitHomework
                }
                disabled={
                  submitting
                }
                style={{
                  minWidth: 200,
                }}
              >
                {submitting
                  ? "جاري التسليم..."
                  : "📤 تسليم الواجب"}
              </button>
            </div>
          )}
      </main>

      <footer className="footer">
        الدعم: 01069225373
      </footer>
    </div>
  );
}