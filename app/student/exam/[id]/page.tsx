"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

type Q = {
  id: string;
  question_text: string;
  question_image_url?: string | null;
  options: string[];
  correct_option: number;
  order_no?: number;
};

type Attempt = {
  id: string;
  started_at: string | null;
  submitted_at: string | null;
  score: number | null;
  total_questions: number | null;
  answers: Record<string, number> | null;
};

export default function ExamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [exam, setExam] = useState<any>(null);
  const [qs, setQs] = useState<Q[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [student, setStudent] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("yg_student");

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

    async function loadExam() {
      if (!supabase) {
        setError("تعذر الاتصال بقاعدة البيانات.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      // ------------------------------------------------
      // 1. تحميل بيانات الامتحان
      // ------------------------------------------------

      const e = await supabase
        .from("exams")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (e.error) {
        console.error("EXAM ERROR:", e.error);
        setError(`خطأ في تحميل الامتحان: ${e.error.message}`);
        setLoading(false);
        return;
      }

      if (!e.data) {
        setError("الامتحان غير موجود.");
        setLoading(false);
        return;
      }

      setExam(e.data);

      // ------------------------------------------------
      // 2. تحميل الأسئلة
      // ------------------------------------------------

      const q = await supabase
        .from("questions")
        .select(
          "id,question_text,question_image_url,options,correct_option,order_no"
        )
        .eq("exam_id", id)
        .order("order_no", { ascending: true });

      if (q.error) {
        console.error("QUESTIONS ERROR:", q.error);
        setError(`خطأ في تحميل الأسئلة: ${q.error.message}`);
        setLoading(false);
        return;
      }

      const loadedQuestions = (q.data || []) as Q[];

      setQs(loadedQuestions);

      // ------------------------------------------------
      // 3. هل الطالب سلّم الامتحان بالفعل؟
      // ------------------------------------------------

      const submittedAttempt = await supabase
        .from("exam_attempts")
        .select(
          "id,started_at,submitted_at,score,total_questions,answers"
        )
        .eq("exam_id", id)
        .eq("student_id", s.id)
        .not("submitted_at", "is", null)
        .maybeSingle();

      if (submittedAttempt.error) {
        console.error(
          "CHECK SUBMITTED ATTEMPT ERROR:",
          submittedAttempt.error
        );
      }

      if (submittedAttempt.data) {
        const attempt = submittedAttempt.data as Attempt;

        setSubmitted(true);
        setScore(attempt.score ?? 0);
        setTotal(
          attempt.total_questions ?? loadedQuestions.length
        );

        // استرجاع إجابات الطالب
        if (attempt.answers) {
          setAnswers(attempt.answers);
        }

        setLoading(false);
        return;
      }

      // ------------------------------------------------
      // 4. البحث عن محاولة بدأت بالفعل
      // ------------------------------------------------

      let attempt = await supabase
        .from("exam_attempts")
        .select("id,started_at,submitted_at")
        .eq("exam_id", id)
        .eq("student_id", s.id)
        .is("submitted_at", null)
        .maybeSingle();

      if (attempt.error) {
        console.error("GET ATTEMPT ERROR:", attempt.error);
      }

      // ------------------------------------------------
      // 5. لو مفيش محاولة، ننشئ محاولة جديدة
      // ------------------------------------------------

      if (!attempt.data) {
        const newAttempt = await supabase
          .from("exam_attempts")
          .insert({
            exam_id: id,
            student_id: s.id,
            started_at: new Date().toISOString(),
          })
          .select("id,started_at,submitted_at")
          .single();

        if (newAttempt.error) {
          console.error(
            "CREATE ATTEMPT ERROR:",
            newAttempt.error
          );

          setError(
            `تعذر بدء الامتحان: ${newAttempt.error.message}`
          );

          setLoading(false);
          return;
        }

        attempt = {
          data: newAttempt.data,
          error: null,
        };
      }

      // ------------------------------------------------
      // 6. حساب الوقت المتبقي
      // ------------------------------------------------

      if (attempt.data?.started_at) {
        const durationMinutes =
          Number(e.data.duration_minutes) || 30;

        const startedAt =
          new Date(attempt.data.started_at).getTime();

        const endTime =
          startedAt + durationMinutes * 60 * 1000;

        const remaining = Math.max(
          0,
          Math.floor((endTime - Date.now()) / 1000)
        );

        setTimeLeft(remaining);
      }

      setLoading(false);
    }

    loadExam();
  }, [id, router]);

  // ------------------------------------------------
  // العداد
  // ------------------------------------------------

  useEffect(() => {
    if (
      timeLeft === null ||
      submitted ||
      loading
    ) {
      return;
    }

    if (timeLeft <= 0) {
      setTimeLeft(0);

      submitExam(true);

      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;

        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted, loading]);

  // ------------------------------------------------
  // اختيار الإجابة
  // ------------------------------------------------

  function chooseAnswer(
    questionId: string,
    optionIndex: number
  ) {
    if (submitted) return;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  }

  // ------------------------------------------------
  // تنسيق الوقت
  // ------------------------------------------------

  function formatTime(seconds: number | null) {
    if (seconds === null) {
      return "--:--";
    }

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      secs
    ).padStart(2, "0")}`;
  }

  // ------------------------------------------------
  // تسليم الامتحان
  // ------------------------------------------------

  async function submitExam(autoSubmit = false) {
    if (
      !supabase ||
      !student ||
      busy ||
      submitted
    ) {
      return;
    }

    if (!qs.length) {
      setError("لا توجد أسئلة في هذا الامتحان.");
      return;
    }

    // ------------------------------------------------
    // التسليم اليدوي
    // ------------------------------------------------

    if (!autoSubmit) {
      const unanswered = qs.filter(
        (q) => answers[q.id] === undefined
      );

      if (unanswered.length > 0) {
        setError(
          `يجب الإجابة على جميع الأسئلة. متبقي ${unanswered.length} سؤال.`
        );
        return;
      }

      const confirmed = window.confirm(
        "هل أنت متأكد من تسليم الامتحان؟\n\nبعد التسليم لن تستطيع دخول الامتحان مرة أخرى."
      );

      if (!confirmed) {
        return;
      }
    }

    setBusy(true);
    setError("");

    // ------------------------------------------------
    // تجهيز الإجابات
    // ------------------------------------------------

    const payload = qs.map((q) => ({
      question_id: q.id,
      selected_option:
        answers[q.id] ?? null,
    }));

    console.log("SUBMIT PAYLOAD:", payload);

    // ------------------------------------------------
    // إرسال الامتحان
    // ------------------------------------------------

    const r = await supabase.rpc(
      "submit_exam_once",
      {
        p_exam_id: id,
        p_student_id: student.id,
        p_answers: payload,
      }
    );

    console.log("SUBMIT RESPONSE:", r);

    if (r.error) {
      console.error("SUBMIT ERROR:", r.error);

      if (
        r.error.message &&
        r.error.message.includes(
          "ALREADY_ATTEMPTED"
        )
      ) {
        setSubmitted(true);

        setError(
          "لقد قمت بتسليم هذا الامتحان بالفعل."
        );
      } else {
        setError(
          `خطأ: ${r.error.message}`
        );
      }

      setBusy(false);
      return;
    }

    const result = r.data as any;

    console.log(
      "SUBMIT RESULT:",
      result
    );

    const finalScore =
      result?.score ?? 0;

    const finalTotal =
      result?.total_questions ??
      qs.length;

    setScore(finalScore);
    setTotal(finalTotal);

    // ------------------------------------------------
    // حفظ إجابات الطالب في المحاولة
    // ------------------------------------------------

    const updateAttempt = await supabase
      .from("exam_attempts")
      .update({
        answers: answers,
      })
      .eq("exam_id", id)
      .eq("student_id", student.id);

    if (updateAttempt.error) {
      console.error(
        "SAVE ANSWERS ERROR:",
        updateAttempt.error
      );
    }

    // ------------------------------------------------
    // إظهار المراجعة
    // ------------------------------------------------

    setSubmitted(true);
    setBusy(false);
    setTimeLeft(0);
  }

  // ------------------------------------------------
  // جاري التحميل
  // ------------------------------------------------

  if (loading) {
    return (
      <main className="auth">
        <div className="auth-box">
          <h2>جاري تحميل الامتحان...</h2>
        </div>
      </main>
    );
  }

  // ------------------------------------------------
  // خطأ يمنع تحميل الامتحان
  // ------------------------------------------------

  if (error && !exam) {
    return (
      <main className="auth">
        <div className="auth-box">
          <h2>{error}</h2>

          <button
            className="btn btn-primary"
            onClick={() =>
              router.push("/student")
            }
            style={{
              marginTop: 15,
            }}
          >
            العودة
          </button>
        </div>
      </main>
    );
  }

  // ------------------------------------------------
  // تم التسليم - عرض المراجعة
  // ------------------------------------------------

  if (submitted) {
    return (
      <main className="container topspace">
        <div className="card">

          <div
            style={{
              textAlign: "center",
              padding: 20,
              marginBottom: 30,
              borderRadius: 18,
              background: "#f5f5f5",
            }}
          >
            <div
              style={{
                fontSize: 55,
                marginBottom: 10,
              }}
            >
              ✅
            </div>

            <h1>
              تم تسليم الامتحان
            </h1>

            <p
              style={{
                marginTop: 10,
              }}
            >
              يمكنك الآن مراجعة إجاباتك.
            </p>

            {score !== null &&
              total !== null && (
                <div
                  style={{
                    marginTop: 20,
                    padding: 20,
                    borderRadius: 15,
                    background: "#ffffff",
                    border: "1px solid #ddd",
                  }}
                >
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: "bold",
                    }}
                  >
                    نتيجتك
                  </div>

                  <div
                    style={{
                      fontSize: 38,
                      fontWeight: "bold",
                      marginTop: 8,
                    }}
                  >
                    {score} / {total}
                  </div>
                </div>
              )}
          </div>

          <h2
            style={{
              marginBottom: 20,
            }}
          >
            📝 مراجعة الامتحان
          </h2>

          {qs.map((q, i) => {
            const studentAnswer =
              answers[q.id];

            const hasAnswer =
              studentAnswer !== undefined &&
              studentAnswer !== null;

            const isCorrect =
              hasAnswer &&
              studentAnswer ===
                q.correct_option;

            return (
              <div
                key={q.id}
                className="section"
                style={{
                  marginBottom: 25,
                  padding: 20,
                  borderRadius: 15,
                  border:
                    isCorrect
                      ? "2px solid #2e9d50"
                      : "2px solid #d33",
                  background:
                    isCorrect
                      ? "#f2fff5"
                      : "#fff5f5",
                }}
              >
                <h3>
                  {i + 1}.{" "}
                  {q.question_text ||
                    "السؤال"}
                </h3>

                {q.question_image_url && (
                  <img
                    src={
                      q.question_image_url
                    }
                    alt="صورة السؤال"
                    style={{
                      maxWidth: "100%",
                      borderRadius: 12,
                      margin:
                        "10px 0",
                    }}
                  />
                )}

                <div
                  style={{
                    marginTop: 15,
                    marginBottom: 15,
                    padding: 12,
                    borderRadius: 10,
                    fontWeight: "bold",
                    background:
                      isCorrect
                        ? "#dcfce7"
                        : "#fee2e2",
                    color:
                      isCorrect
                        ? "#166534"
                        : "#991b1b",
                  }}
                >
                  {isCorrect
                    ? "✅ إجابتك صحيحة"
                    : "❌ إجابتك خاطئة"}
                </div>

                <div>
                  {q.options.map(
                    (op, j) => {
                      const isStudentAnswer =
                        hasAnswer &&
                        studentAnswer === j;

                      const isCorrectAnswer =
                        q.correct_option === j;

                      let background =
                        "#ffffff";

                      let border =
                        "1px solid #ddd";

                      let textColor =
                        "inherit";

                      if (
                        isCorrectAnswer
                      ) {
                        background =
                          "#dcfce7";

                        border =
                          "2px solid #22c55e";

                        textColor =
                          "#166534";
                      } else if (
                        isStudentAnswer &&
                        !isCorrectAnswer
                      ) {
                        background =
                          "#fee2e2";

                        border =
                          "2px solid #ef4444";

                        textColor =
                          "#991b1b";
                      }

                      return (
                        <div
                          key={j}
                          style={{
                            padding: 12,
                            marginBottom: 8,
                            borderRadius: 10,
                            background,
                            border,
                            color:
                              textColor,
                            fontWeight:
                              isCorrectAnswer ||
                              isStudentAnswer
                                ? "bold"
                                : "normal",
                          }}
                        >
                          {op}

                          {isCorrectAnswer && (
                            <span
                              style={{
                                marginRight: 8,
                              }}
                            >
                              ✓ الإجابة
                              الصحيحة
                            </span>
                          )}

                          {isStudentAnswer &&
                            !isCorrectAnswer && (
                              <span
                                style={{
                                  marginRight: 8,
                                }}
                              >
                                ✗ إجابتك
                              </span>
                            )}
                        </div>
                      );
                    }
                  )}
                </div>

                {!hasAnswer && (
                  <div
                    style={{
                      marginTop: 10,
                      color: "#a11",
                      fontWeight: "bold",
                    }}
                  >
                    لم تُجب عن هذا السؤال.
                  </div>
                )}
              </div>
            );
          })}

          <button
            className="btn btn-primary"
            style={{
              marginTop: 10,
            }}
            onClick={() =>
              router.push("/student")
            }
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </main>
    );
  }

  // ------------------------------------------------
  // صفحة الامتحان
  // ------------------------------------------------

  return (
    <main className="container topspace">
      <div className="card">

        {/* العداد */}

        <div
          style={{
            position: "sticky",
            top: 10,
            zIndex: 20,
            marginBottom: 20,
            padding: 15,
            borderRadius: 15,
            textAlign: "center",
            background:
              timeLeft !== null &&
              timeLeft <= 60
                ? "#ffe5e5"
                : "#f5f5f5",
            border:
              timeLeft !== null &&
              timeLeft <= 60
                ? "2px solid #d33"
                : "1px solid #ddd",
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: "bold",
            }}
          >
            ⏱️ الوقت المتبقي
          </div>

          <div
            style={{
              fontSize: 32,
              fontWeight: "bold",
              marginTop: 5,
              color:
                timeLeft !== null &&
                timeLeft <= 60
                  ? "#d00"
                  : "inherit",
            }}
          >
            {formatTime(timeLeft)}
          </div>

          {timeLeft !== null &&
            timeLeft <= 60 &&
            timeLeft > 0 && (
              <div
                style={{
                  color: "#d00",
                  marginTop: 5,
                  fontWeight: "bold",
                }}
              >
                ⚠️ اقترب الوقت من الانتهاء
              </div>
            )}
        </div>

        <h1>
          {exam?.title || "الامتحان"}
        </h1>

        {exam?.description && (
          <p>{exam.description}</p>
        )}

        <div
          style={{
            marginTop: 15,
            marginBottom: 25,
            padding: 15,
            borderRadius: 12,
            background: "#f5f5f5",
          }}
        >
          <strong>
            عدد الأسئلة: {qs.length}
          </strong>
        </div>

        {qs.length === 0 ? (
          <div
            style={{
              padding: 20,
              textAlign: "center",
            }}
          >
            لا توجد أسئلة في هذا الامتحان حاليًا.
          </div>
        ) : (
          qs.map((q, i) => (
            <div
              className="section"
              key={q.id}
              style={{
                marginBottom: 25,
                padding: 20,
                borderRadius: 15,
              }}
            >
              <h3>
                {i + 1}.{" "}
                {q.question_text ||
                  "السؤال"}
              </h3>

              {q.question_image_url && (
                <img
                  src={
                    q.question_image_url
                  }
                  alt="صورة السؤال"
                  style={{
                    maxWidth: "100%",
                    borderRadius: 12,
                    margin:
                      "10px 0",
                  }}
                />
              )}

              <div
                style={{
                  marginTop: 15,
                }}
              >
                {q.options.map(
                  (op, j) => (
                    <label
                      className="exam-option"
                      key={j}
                      style={{
                        display: "block",
                        cursor: "pointer",
                        marginBottom: 10,
                      }}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={
                          answers[q.id] ===
                          j
                        }
                        onChange={() =>
                          chooseAnswer(
                            q.id,
                            j
                          )
                        }
                      />

                      <span
                        style={{
                          marginRight: 8,
                        }}
                      >
                        {op}
                      </span>
                    </label>
                  )
                )}
              </div>
            </div>
          ))
        )}

        {error && (
          <div
            style={{
              color: "#a11",
              background: "#fff0f0",
              padding: 12,
              borderRadius: 10,
              marginBottom: 15,
            }}
          >
            {error}
          </div>
        )}

        {qs.length > 0 && (
          <button
            className="btn btn-primary"
            disabled={busy}
            onClick={() =>
              submitExam(false)
            }
          >
            {busy
              ? "جاري تسليم الامتحان..."
              : "تسليم الامتحان"}
          </button>
        )}
      </div>
    </main>
  );
}