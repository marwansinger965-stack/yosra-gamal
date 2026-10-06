"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Student = {
  id: string;
  full_name: string;
  access_code: string;
  grade: string | null;
  active: boolean;
};

type Video = {
  id: string;
  title: string;
  description: string;
  video_url: string;
  grade: string | null;
  lecture_id: string | null;
  active: boolean;
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

type Assessment = {
  id: string;
  lecture_id: string;
  type: "homework" | "quiz";
  title: string;
  description: string | null;
  active: boolean;
  created_at: string;
};

type AssessmentQuestion = {
  id: string;
  assessment_id: string;
  question_text: string;
  question_image_url: string | null;
  options: string[];
  correct_option: number;
  order_no: number;
};

type Exam = {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  active: boolean;
};

type Question = {
  id: string;
  exam_id: string;
  question_text: string | null;
  question_image_url: string | null;
  options: string[];
  correct_option: number;
  order_no: number;
};

type Attempt = {
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
  answers: Record<string, number> | null;
  submitted_at: string | null;
  created_at: string;
};

export default function Admin() {
  const [session, setSession] = useState<any>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [tab, setTab] = useState("students");

  const [selectedExam, setSelectedExam] = useState("");
  const [selectedResultsExam, setSelectedResultsExam] =
    useState("");

  const [students, setStudents] = useState<Student[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>(
    []
  );
  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  /* بيانات المتابعة */

  const [allExamAttempts, setAllExamAttempts] =
    useState<Attempt[]>([]);

  const [assessmentAttempts, setAssessmentAttempts] =
    useState<AssessmentAttempt[]>([]);

  const [progressSearch, setProgressSearch] =
    useState("");

  const [progressGrade, setProgressGrade] =
    useState("");

  const [selectedProgressStudent, setSelectedProgressStudent] =
    useState("");

  const [msg, setMsg] = useState("");

  /* الطلاب */

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [grade, setGrade] = useState("ثالثة ثانوي");

  /* المحاضرة */

  const [lectureTitle, setLectureTitle] = useState("");
  const [lectureDesc, setLectureDesc] = useState("");
  const [lectureGrade, setLectureGrade] =
    useState("ثالثة ثانوي");

  const [lectureVideoUrl, setLectureVideoUrl] =
    useState("");

  const [lecturePdfFile, setLecturePdfFile] =
    useState<File | null>(null);

  const [lectureUploading, setLectureUploading] =
    useState(false);

  /* الواجبات والـ Quiz */

  const [selectedLectureAssessment, setSelectedLectureAssessment] =
    useState("");

  const [assessmentTitle, setAssessmentTitle] =
    useState("");

  const [assessmentDescription, setAssessmentDescription] =
    useState("");

  const [assessmentType, setAssessmentType] =
    useState<"homework" | "quiz">("homework");

  const [assessmentQuestions, setAssessmentQuestions] =
    useState<AssessmentQuestion[]>([]);

  const [assessmentQuestionText, setAssessmentQuestionText] =
    useState("");

  const [assessmentOptions, setAssessmentOptions] =
    useState(["", "", "", ""]);

  const [assessmentCorrect, setAssessmentCorrect] =
    useState("0");

  /* الامتحانات */

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [duration, setDuration] = useState("30");

  /* الأسئلة */

  const [questionText, setQuestionText] =
    useState("");

  const [options, setOptions] = useState([
    "",
    "",
    "",
    "",
  ]);

  const [correct, setCorrect] = useState("0");

  const [questionFile, setQuestionFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [uploading, setUploading] =
    useState(false);

  /* تسجيل دخول المدرس */

  useEffect(() => {
    supabase?.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const sub =
      supabase?.auth.onAuthStateChange(
        (_event, s) => {
          setSession(s);
        }
      );

    return () =>
      sub?.data.subscription.unsubscribe();
  }, []);

  /* تحميل البيانات */

  const load = async () => {
    if (!supabase) return;

    const [
      s,
      v,
      l,
      a,
      e,
      examAttemptsResult,
      assessmentAttemptsResult,
    ] = await Promise.all([
      supabase
        .from("students")
        .select(
          "id,full_name,access_code,grade,active"
        )
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("videos")
        .select("*")
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("lectures")
        .select("*")
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("lecture_assessments")
        .select("*")
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("exams")
        .select("*")
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("exam_attempts")
        .select("*")
        .order("started_at", {
          ascending: false,
        }),

      supabase
        .from("assessment_attempts")
        .select("*")
        .order("created_at", {
          ascending: false,
        }),
    ]);

    if (s.error) {
      setMsg(s.error.message);
    }

    if (v.error) {
      setMsg(v.error.message);
    }

    if (l.error) {
      setMsg(l.error.message);
    }

    if (a.error) {
      setMsg(a.error.message);
    }

    if (e.error) {
      setMsg(e.error.message);
    }

    if (examAttemptsResult.error) {
      setMsg(
        examAttemptsResult.error.message
      );
    }

    if (assessmentAttemptsResult.error) {
      setMsg(
        assessmentAttemptsResult.error.message
      );
    }

    setStudents(s.data || []);
    setVideos(v.data || []);
    setLectures(l.data || []);
    setAssessments(a.data || []);
    setExams(e.data || []);

    setAllExamAttempts(
      examAttemptsResult.data || []
    );

    setAssessmentAttempts(
      assessmentAttemptsResult.data || []
    );
  };

  useEffect(() => {
    if (session) {
      load();
    }
  }, [session]);

  /* تسجيل الدخول */

  async function login(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError("");

    if (!supabase) return;

    const r =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (r.error) {
      setError(
        "بيانات المدرس غير صحيحة."
      );
    }
  }

  /* تحميل أسئلة الامتحان */

  async function loadQuestions(
    examId: string
  ) {
    if (!supabase || !examId) {
      setQuestions([]);
      return;
    }

    const r = await supabase
      .from("questions")
      .select("*")
      .eq("exam_id", examId)
      .order("order_no", {
        ascending: true,
      });

    if (r.error) {
      setMsg(r.error.message);
      return;
    }

    setQuestions(r.data || []);
  }

  /* تحميل نتائج الامتحان */

  async function loadAttempts(
    examId: string
  ) {
    if (!supabase || !examId) {
      setAttempts([]);
      return;
    }

    const r = await supabase
      .from("exam_attempts")
      .select("*")
      .eq("exam_id", examId)
      .order("started_at", {
        ascending: false,
      });

    if (r.error) {
      setMsg(r.error.message);
      return;
    }

    setAttempts(r.data || []);
  }

  /* إضافة طالب */

  async function addStudent() {
    if (!supabase) return;

    if (!name.trim() || !code.trim()) {
      setMsg("اكتب اسم الطالب والكود.");
      return;
    }

    if (!grade) {
      setMsg("اختر المرحلة الدراسية.");
      return;
    }

    const r = await supabase
      .from("students")
      .insert({
        full_name: name.trim(),
        access_code: code.trim(),
        grade: grade,
        active: true,
      });

    setMsg(
      r.error?.message ||
        "تمت إضافة الطالب بنجاح"
    );

    if (!r.error) {
      setName("");
      setCode("");
      setGrade("ثالثة ثانوي");
      load();
    }
  }

  /* تفعيل / إيقاف طالب */

  async function toggleStudent(
    s: Student
  ) {
    if (!supabase) return;

    const r = await supabase
      .from("students")
      .update({
        active: !s.active,
      })
      .eq("id", s.id);

    if (r.error) {
      setMsg(r.error.message);
      return;
    }

    load();
  }

  /* حذف طالب */

  async function deleteStudent(
    s: Student
  ) {
    if (!supabase) return;

    const confirmed =
      window.confirm(
        `هل أنت متأكد من إزالة الطالب "${s.full_name}"؟\n\nسيتم حذف الطالب نهائيًا من المنصة.`
      );

    if (!confirmed) return;

    const r = await supabase
      .from("students")
      .delete()
      .eq("id", s.id);

    if (r.error) {
      setMsg(
        "فشل حذف الطالب: " +
          r.error.message
      );
      return;
    }

    setMsg(
      "تمت إزالة الطالب بنجاح."
    );

    load();
  }

  /* إنشاء محاضرة */

  async function addLecture() {
    if (!supabase) return;

    if (!lectureTitle.trim()) {
      setMsg("اكتب اسم المحاضرة.");
      return;
    }

    if (!lectureGrade) {
      setMsg("اختر المرحلة الدراسية.");
      return;
    }

    if (!lectureVideoUrl.trim()) {
      setMsg(
        "اكتب رابط فيديو المحاضرة."
      );
      return;
    }

    setLectureUploading(true);
    setMsg("");

    try {
      let pdfUrl: string | null = null;

      /* رفع PDF */

      if (lecturePdfFile) {
        if (
          lecturePdfFile.type !==
          "application/pdf"
        ) {
          setMsg(
            "ملف المحاضرة يجب أن يكون PDF."
          );
          return;
        }

        if (
          lecturePdfFile.size >
          20 * 1024 * 1024
        ) {
          setMsg(
            "حجم ملف PDF يجب ألا يتجاوز 20 ميجابايت."
          );
          return;
        }

        const path =
          `${crypto.randomUUID()}.pdf`;

        const upload =
          await supabase.storage
            .from("lesson-pdfs")
            .upload(
              path,
              lecturePdfFile,
              {
                upsert: false,
                contentType:
                  "application/pdf",
              }
            );

        if (upload.error) {
          setMsg(
            "فشل رفع ملف PDF: " +
              upload.error.message
          );
          return;
        }

        pdfUrl =
          supabase.storage
            .from("lesson-pdfs")
            .getPublicUrl(path)
            .data.publicUrl;
      }

      /* إنشاء المحاضرة */

      const lectureResult =
        await supabase
          .from("lectures")
          .insert({
            title:
              lectureTitle.trim(),

            description:
              lectureDesc.trim() ||
              null,

            grade:
              lectureGrade,

            video_url:
              lectureVideoUrl.trim(),

            pdf_url:
              pdfUrl,

            has_homework: false,
            has_quiz: false,

            active: true,
          })
          .select()
          .single();

      if (lectureResult.error) {
        setMsg(
          "فشل إنشاء المحاضرة: " +
            lectureResult.error.message
        );
        return;
      }

      const lecture =
        lectureResult.data;

      /* إنشاء الفيديو وربطه بالمحاضرة */

      const videoResult =
        await supabase
          .from("videos")
          .insert({
            title:
              lectureTitle.trim(),

            description:
              lectureDesc.trim(),

            video_url:
              lectureVideoUrl.trim(),

            grade:
              lectureGrade,

            lecture_id:
              lecture.id,

            active: true,
          });

      if (videoResult.error) {
        setMsg(
          "تم إنشاء المحاضرة لكن فشل ربط الفيديو: " +
            videoResult.error.message
        );
        return;
      }

      setMsg(
        "تم إنشاء المحاضرة بنجاح."
      );

      setLectureTitle("");
      setLectureDesc("");
      setLectureGrade("ثالثة ثانوي");
      setLectureVideoUrl("");
      setLecturePdfFile(null);

      const pdfInput =
        document.getElementById(
          "lecture-pdf"
        ) as HTMLInputElement | null;

      if (pdfInput) {
        pdfInput.value = "";
      }

      load();
    } finally {
      setLectureUploading(false);
    }
  }

  /* حذف محاضرة */

  async function deleteLecture(
    lecture: Lecture
  ) {
    if (!supabase) return;

    const confirmed =
      window.confirm(
        "هل أنت متأكد من حذف هذه المحاضرة؟ سيتم حذف الواجبات والـQuiz والأسئلة المرتبطة بها أيضًا."
      );

    if (!confirmed) return;

    /* حذف الفيديو المرتبط */

    const videoDelete =
      await supabase
        .from("videos")
        .delete()
        .eq(
          "lecture_id",
          lecture.id
        );

    if (videoDelete.error) {
      setMsg(
        videoDelete.error.message
      );
      return;
    }

    /* حذف المحاضرة */

    const r =
      await supabase
        .from("lectures")
        .delete()
        .eq("id", lecture.id);

    if (r.error) {
      setMsg(r.error.message);
      return;
    }

    setMsg(
      "تم حذف المحاضرة بنجاح."
    );

    load();
  }

  /* تحميل أسئلة الواجب */

  async function loadAssessmentQuestions(
    assessmentId: string
  ) {
    if (!supabase || !assessmentId) {
      setAssessmentQuestions([]);
      return;
    }

    const r = await supabase
      .from("assessment_questions")
      .select("*")
      .eq(
        "assessment_id",
        assessmentId
      )
      .order("order_no", {
        ascending: true,
      });

    if (r.error) {
      setMsg(r.error.message);
      return;
    }

    setAssessmentQuestions(
      r.data || []
    );
  }

  /* إنشاء واجب / Quiz */

  async function addAssessment() {
    if (!supabase) return;

    if (!selectedLectureAssessment) {
      setMsg("اختر المحاضرة أولًا.");
      return;
    }

    if (!assessmentTitle.trim()) {
      setMsg("اكتب اسم الواجب.");
      return;
    }

    const r = await supabase
      .from("lecture_assessments")
      .insert({
        lecture_id:
          selectedLectureAssessment,

        type:
          assessmentType,

        title:
          assessmentTitle.trim(),

        description:
          assessmentDescription.trim() ||
          null,

        active: true,
      })
      .select()
      .single();

    if (r.error) {
      setMsg(
        "فشل إنشاء الواجب: " +
          r.error.message
      );
      return;
    }

    /* تحديث حالة المحاضرة */

    const updateData =
      assessmentType === "homework"
        ? { has_homework: true }
        : { has_quiz: true };

    const lectureUpdate =
      await supabase
        .from("lectures")
        .update(updateData)
        .eq(
          "id",
          selectedLectureAssessment
        );

    if (lectureUpdate.error) {
      setMsg(
        "تم إنشاء التقييم لكن فشل تحديث المحاضرة: " +
          lectureUpdate.error.message
      );
      return;
    }

    setMsg(
      assessmentType === "homework"
        ? "تم إنشاء الواجب بنجاح."
        : "تم إنشاء الـQuiz بنجاح."
    );

    setAssessmentTitle("");
    setAssessmentDescription("");

    load();
  }

  /* إضافة سؤال للواجب */

  async function addAssessmentQuestion() {
    if (!supabase) return;

    if (!selectedLectureAssessment) {
      setMsg("اختر الواجب أولًا.");
      return;
    }

    if (!assessmentQuestionText.trim()) {
      setMsg("اكتب السؤال.");
      return;
    }

    const clean =
      assessmentOptions.map((x) =>
        x.trim()
      );

    if (clean.some((x) => !x)) {
      setMsg(
        "اكتب الأربع اختيارات."
      );
      return;
    }

    const r = await supabase
      .from("assessment_questions")
      .insert({
        assessment_id:
          selectedLectureAssessment,

        question_text:
          assessmentQuestionText.trim(),

        question_image_url: null,

        options: clean,

        correct_option:
          Number(assessmentCorrect),

        order_no:
          assessmentQuestions.length,
      });

    if (r.error) {
      setMsg(
        "فشل إضافة السؤال: " +
          r.error.message
      );
      return;
    }

    setMsg(
      "تمت إضافة سؤال الواجب."
    );

    setAssessmentQuestionText("");

    setAssessmentOptions([
      "",
      "",
      "",
      "",
    ]);

    setAssessmentCorrect("0");

    loadAssessmentQuestions(
      selectedLectureAssessment
    );
  }

  /* حذف سؤال الواجب */

  async function deleteAssessmentQuestion(
    question: AssessmentQuestion
  ) {
    if (!supabase) return;

    const confirmed =
      window.confirm(
        "هل تريد حذف هذا السؤال؟"
      );

    if (!confirmed) return;

    const r = await supabase
      .from("assessment_questions")
      .delete()
      .eq("id", question.id);

    if (r.error) {
      setMsg(r.error.message);
      return;
    }

    setMsg(
      "تم حذف السؤال."
    );

    loadAssessmentQuestions(
      selectedLectureAssessment
    );
  }

  /* حذف واجب */

  async function deleteAssessment(
    assessment: Assessment
  ) {
    if (!supabase) return;

    const confirmed =
      window.confirm(
        "هل تريد حذف هذا الواجب؟ سيتم حذف أسئلته ومحاولاته المرتبطة به أيضًا."
      );

    if (!confirmed) return;

    const r = await supabase
      .from("lecture_assessments")
      .delete()
      .eq("id", assessment.id);

    if (r.error) {
      setMsg(
        "فشل حذف الواجب: " +
          r.error.message
      );
      return;
    }

    /* تحديث حالة المحاضرة */

    const remaining =
      assessments.filter(
        (a) =>
          a.id !== assessment.id &&
          a.lecture_id ===
            assessment.lecture_id
      );

    const sameTypeRemaining =
      remaining.some(
        (a) =>
          a.lecture_id ===
            assessment.lecture_id &&
          a.type ===
            assessment.type
      );

    if (assessment.type === "homework") {
      await supabase
        .from("lectures")
        .update({
          has_homework:
            sameTypeRemaining,
        })
        .eq(
          "id",
          assessment.lecture_id
        );
    } else {
      await supabase
        .from("lectures")
        .update({
          has_quiz:
            sameTypeRemaining,
        })
        .eq(
          "id",
          assessment.lecture_id
        );
    }

    setMsg(
      "تم حذف الواجب."
    );

    if (
      selectedLectureAssessment ===
      assessment.id
    ) {
      setSelectedLectureAssessment("");
      setAssessmentQuestions([]);
    }

    load();
  }

  /* إنشاء امتحان */

  async function addExam() {
    if (!supabase) return;

    if (!title.trim()) {
      setMsg(
        "اكتب اسم الامتحان."
      );
      return;
    }

    const r = await supabase
      .from("exams")
      .insert({
        title: title.trim(),
        description: desc.trim(),
        duration_minutes:
          Number(duration) || 30,
        active: true,
      });

    setMsg(
      r.error?.message ||
        "تم إنشاء الامتحان"
    );

    if (!r.error) {
      setTitle("");
      setDesc("");
      setDuration("30");
      load();
    }
  }

  /* حذف امتحان */

  async function deleteExam(
    exam: Exam
  ) {
    if (!supabase) return;

    const confirmed =
      window.confirm(
        "هل أنت متأكد من حذف الامتحان؟ سيتم حذف الأسئلة والمحاولات المرتبطة به أيضًا."
      );

    if (!confirmed) return;

    const r = await supabase
      .from("exams")
      .delete()
      .eq("id", exam.id);

    if (r.error) {
      setMsg(r.error.message);
      return;
    }

    setMsg(
      "تم حذف الامتحان بنجاح"
    );

    if (selectedExam === exam.id) {
      setSelectedExam("");
      setQuestions([]);
    }

    if (
      selectedResultsExam === exam.id
    ) {
      setSelectedResultsExam("");
      setAttempts([]);
    }

    load();
  }

  /* إضافة سؤال للامتحان */

  async function addQuestion() {
    if (!supabase) return;

    if (!selectedExam) {
      setMsg(
        "اختر الامتحان أولاً."
      );
      return;
    }

    const clean = options.map(
      (x) => x.trim()
    );

    if (clean.some((x) => !x)) {
      setMsg(
        "اكتب الأربع اختيارات أولاً."
      );
      return;
    }

    if (
      !questionText.trim() &&
      !questionFile
    ) {
      setMsg(
        "اكتب السؤال أو اختر صورة للسؤال."
      );
      return;
    }

    setUploading(true);
    setMsg("");

    let imageUrl:
      | string
      | null = null;

    try {
      /* رفع صورة السؤال */

      if (questionFile) {
        if (
          !questionFile.type.startsWith(
            "image/"
          )
        ) {
          setMsg(
            "الملف يجب أن يكون صورة."
          );
          return;
        }

        if (
          questionFile.size >
          8 * 1024 * 1024
        ) {
          setMsg(
            "حجم الصورة يجب ألا يتجاوز 8 ميجابايت."
          );
          return;
        }

        const safeName =
          questionFile.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "-"
          );

        const path =
          `${selectedExam}/` +
          `${crypto.randomUUID()}-` +
          safeName;

        const upload =
          await supabase.storage
            .from(
              "question-images"
            )
            .upload(
              path,
              questionFile,
              {
                upsert: false,
              }
            );

        if (upload.error) {
          setMsg(
            "فشل رفع الصورة: " +
              upload.error.message
          );
          return;
        }

        imageUrl =
          supabase.storage
            .from(
              "question-images"
            )
            .getPublicUrl(path)
            .data.publicUrl;
      }

      /* إضافة السؤال */

      const r =
        await supabase
          .from("questions")
          .insert({
            exam_id:
              selectedExam,

            question_text:
              questionText.trim() ||
              null,

            question_image_url:
              imageUrl,

            options: clean,

            correct_option:
              Number(correct),

            order_no:
              questions.length,
          });

      if (r.error) {
        setMsg(r.error.message);
        return;
      }

      setMsg(
        "تمت إضافة السؤال بنجاح."
      );

      setQuestionText("");

      setOptions([
        "",
        "",
        "",
        "",
      ]);

      setCorrect("0");
      setQuestionFile(null);
      setPreviewUrl("");

      const input =
        document.getElementById(
          "question-image"
        ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }

      loadQuestions(
        selectedExam
      );
    } finally {
      setUploading(false);
    }
  }

  /* حذف سؤال */

  async function deleteQuestion(
    question: Question
  ) {
    if (!supabase) return;

    const confirmed =
      window.confirm(
        "هل أنت متأكد من حذف السؤال؟"
      );

    if (!confirmed) return;

    const r = await supabase
      .from("questions")
      .delete()
      .eq("id", question.id);

    if (r.error) {
      setMsg(r.error.message);
      return;
    }

    setMsg(
      "تم حذف السؤال بنجاح"
    );

    loadQuestions(
      selectedExam
    );
  }

  /* اسم الطالب */

  function getStudentName(
    studentId: string
  ) {
    const student =
      students.find(
        (s) => s.id === studentId
      );

    return (
      student?.full_name ||
      "طالب غير معروف"
    );
  }

  /* اسم الامتحان */

  function getExamName(
    examId: string
  ) {
    const exam =
      exams.find(
        (e) => e.id === examId
      );

    return (
      exam?.title ||
      "امتحان غير معروف"
    );
  }

  /* اسم المحاضرة */

  function getLectureName(
    lectureId: string
  ) {
    const lecture =
      lectures.find(
        (l) => l.id === lectureId
      );

    return (
      lecture?.title ||
      "محاضرة غير معروفة"
    );
  }

  /* التاريخ */

  function formatDate(
    value: string | null
  ) {
    if (!value) {
      return "لم يسلّم بعد";
    }

    return new Date(
      value
    ).toLocaleString("ar-EG");
  }

  /* حساب النسبة */

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

    return Math.round(
      (score / total) * 100
    );
  }

  /* محاولات الطالب في الامتحانات */

  function getStudentExamAttempts(
    studentId: string
  ) {
    return allExamAttempts.filter(
      (a) => a.student_id === studentId
    );
  }

  /* محاولات الطالب في الواجبات */

  function getStudentHomeworkAttempts(
    studentId: string
  ) {
    return assessmentAttempts.filter(
      (a) => a.student_id === studentId
    );
  }

  /* متوسط الطالب */

  function getStudentAverage(
    studentId: string,
    type: "exam" | "homework"
  ) {
    const results =
      type === "exam"
        ? getStudentExamAttempts(studentId)
            .filter(
              (a) =>
                a.submitted_at &&
                a.score !== null &&
                a.total_questions
            )
            .map((a) =>
              getPercentage(
                a.score,
                a.total_questions
              )
            )
        : getStudentHomeworkAttempts(
            studentId
          )
            .filter(
              (a) =>
                a.submitted_at &&
                a.score !== null &&
                a.total_questions
            )
            .map((a) =>
              getPercentage(
                a.score,
                a.total_questions
              )
            );

    const valid = results.filter(
      (x): x is number => x !== null
    );

    if (!valid.length) return null;

    return Math.round(
      valid.reduce(
        (sum, value) => sum + value,
        0
      ) / valid.length
    );
  }

  /* آخر نشاط */

  function getStudentLastActivity(
    studentId: string
  ) {
    const examDates =
      getStudentExamAttempts(
        studentId
      ).map(
        (a) =>
          a.submitted_at ||
          a.started_at
      );

    const homeworkDates =
      getStudentHomeworkAttempts(
        studentId
      ).map(
        (a) =>
          a.submitted_at ||
          a.created_at
      );

    const dates = [
      ...examDates,
      ...homeworkDates,
    ]
      .filter(Boolean)
      .map((x) =>
        new Date(x).getTime()
      );

    if (!dates.length) return null;

    return new Date(
      Math.max(...dates)
    ).toISOString();
  }

  /* طلاب المتابعة بعد البحث والفلترة */

  function getProgressStudents() {
    const search =
      progressSearch
        .trim()
        .toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !search ||
        student.full_name
          .toLowerCase()
          .includes(search) ||
        student.access_code
          .toLowerCase()
          .includes(search);

      const matchesGrade =
        !progressGrade ||
        student.grade === progressGrade;

      return (
        matchesSearch &&
        matchesGrade
      );
    });
  }

  /* صفحة تسجيل الدخول */

  if (!session) {
    return (
      <main className="auth">
        <div className="auth-box">

          <div
            className="brand"
            style={{
              color: "#800020",
            }}
          >
            Yosra Gamal
          </div>

          <h1>
            دخول المدرس
          </h1>

          <form
            className="form"
            onSubmit={login}
          >
            <input
              className="input"
              type="email"
              placeholder="البريد الإلكتروني"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              required
            />

            <input
              className="input"
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              required
            />

            {error && (
              <div
                style={{
                  color: "#a11",
                }}
              >
                {error}
              </div>
            )}

            <button className="btn btn-primary">
              دخول
            </button>
          </form>
        </div>
      </main>
    );
  }

  /* لوحة التحكم */

  return (
    <div className="dashboard">
      <div className="dashgrid">

        <aside className="sidebar">

          <div className="brand">
            Yosra Gamal
          </div>

          <div
            className="side"
            style={{
              marginTop: 25,
            }}
          >
            {[
              [
                "students",
                "الطلاب",
              ],
              [
                "lectures",
                "المحاضرات",
              ],
              [
                "exams",
                "الامتحانات",
              ],
              [
                "questions",
                "الأسئلة",
              ],
              [
                "results",
                "النتائج",
              ],
              [
                "progress",
                "📊 المتابعة",
              ],
            ].map(([x, t]) => (
              <a
                href="#"
                key={x}
                onClick={(e) => {
                  e.preventDefault();
                  setTab(x);
                }}
              >
                {t}
              </a>
            ))}

            <a
              href="#"
              onClick={async (e) => {
                e.preventDefault();

                await supabase?.auth.signOut();
              }}
            >
              خروج
            </a>
          </div>
        </aside>

        <main className="main">

          <h1>
            لوحة تحكم المدرس
          </h1>

          {msg && (
            <div className="card">
              {msg}
            </div>
          )}

          {/* الطلاب */}

          {tab === "students" && (
            <>
              <div className="card">

                <h2>
                  إضافة طالب
                </h2>

                <div className="grid">

                  <input
                    className="input"
                    placeholder="اسم الطالب"
                    value={name}
                    onChange={(e) =>
                      setName(
                        e.target.value
                      )
                    }
                  />

                  <input
                    className="input"
                    placeholder="كود الطالب"
                    value={code}
                    onChange={(e) =>
                      setCode(
                        e.target.value
                      )
                    }
                  />

                  <select
                    className="input"
                    value={grade}
                    onChange={(e) =>
                      setGrade(
                        e.target.value
                      )
                    }
                  >
                    <option value="أولى ثانوي">
                      أولى ثانوي
                    </option>

                    <option value="ثانية ثانوي">
                      ثانية ثانوي
                    </option>

                    <option value="ثالثة ثانوي">
                      ثالثة ثانوي
                    </option>
                  </select>

                </div>

                <button
                  className="btn btn-primary"
                  style={{
                    marginTop: 12,
                  }}
                  onClick={
                    addStudent
                  }
                >
                  إضافة
                </button>

              </div>

              <section className="section">

                <h2>
                  الطلاب (
                  {students.length}
                  )
                </h2>

                <table className="table">

                  <thead>
                    <tr>
                      <th>
                        الاسم
                      </th>

                      <th>
                        الكود
                      </th>

                      <th>
                        المرحلة
                      </th>

                      <th>
                        الحالة
                      </th>

                      <th>
                        التحكم
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {students.map(
                      (s) => (
                        <tr
                          key={s.id}
                        >
                          <td>
                            {
                              s.full_name
                            }
                          </td>

                          <td>
                            {
                              s.access_code
                            }
                          </td>

                          <td>
                            {s.grade ||
                              "غير محددة"}
                          </td>

                          <td>
                            {s.active ? (
                              <span className="pill">
                                مفعل
                              </span>
                            ) : (
                              <span className="pill">
                                موقوف
                              </span>
                            )}
                          </td>

                          <td>
                            <div
                              style={{
                                display:
                                  "flex",
                                gap: 8,
                                flexWrap:
                                  "wrap",
                              }}
                            >
                              <button
                                className="btn"
                                onClick={() =>
                                  toggleStudent(
                                    s
                                  )
                                }
                              >
                                {s.active
                                  ? "إيقاف"
                                  : "تفعيل"}
                              </button>

                              <button
                                className="btn"
                                onClick={() =>
                                  deleteStudent(
                                    s
                                  )
                                }
                                style={{
                                  color:
                                    "#b00020",
                                }}
                              >
                                🗑️ إزالة
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}

                  </tbody>
                </table>

              </section>
            </>
          )}

          {/* المحاضرات */}

          {tab === "lectures" && (
            <>
              <div className="card">

                <h2>
                  إنشاء محاضرة
                </h2>

                <div className="form">

                  <input
                    className="input"
                    placeholder="اسم المحاضرة"
                    value={lectureTitle}
                    onChange={(e) =>
                      setLectureTitle(
                        e.target.value
                      )
                    }
                  />

                  <select
                    className="input"
                    value={lectureGrade}
                    onChange={(e) =>
                      setLectureGrade(
                        e.target.value
                      )
                    }
                  >
                    <option value="أولى ثانوي">
                      أولى ثانوي
                    </option>

                    <option value="ثانية ثانوي">
                      ثانية ثانوي
                    </option>

                    <option value="ثالثة ثانوي">
                      ثالثة ثانوي
                    </option>
                  </select>

                  <textarea
                    className="input"
                    placeholder="وصف المحاضرة — اختياري"
                    value={lectureDesc}
                    onChange={(e) =>
                      setLectureDesc(
                        e.target.value
                      )
                    }
                  />

                  <input
                    className="input"
                    placeholder="رابط فيديو YouTube"
                    value={lectureVideoUrl}
                    onChange={(e) =>
                      setLectureVideoUrl(
                        e.target.value
                      )
                    }
                  />

                  <label
                    style={{
                      fontWeight: 700,
                    }}
                  >
                    ملف PDF للمحاضرة —
                    اختياري
                  </label>

                  <input
                    id="lecture-pdf"
                    className="input"
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(e) => {
                      const file =
                        e.target.files?.[0] ||
                        null;

                      setLecturePdfFile(
                        file
                      );
                    }}
                  />

                  <button
                    className="btn btn-primary"
                    disabled={
                      lectureUploading
                    }
                    onClick={
                      addLecture
                    }
                  >
                    {lectureUploading
                      ? "جاري إنشاء المحاضرة..."
                      : "إنشاء المحاضرة"}
                  </button>

                </div>
              </div>

              {/* إدارة الواجبات */}

              <div className="card">
                <h2>
                  📝 إدارة واجب أو Quiz
                </h2>

                <div className="form">

                  <select
                    className="input"
                    value={
                      selectedLectureAssessment
                    }
                    onChange={(e) => {
                      const id =
                        e.target.value;

                      setSelectedLectureAssessment(
                        id
                      );

                      setAssessmentQuestions(
                        []
                      );

                      if (
                        id &&
                        assessments.some(
                          (a) =>
                            a.id === id
                        )
                      ) {
                        loadAssessmentQuestions(
                          id
                        );
                      }
                    }}
                  >
                    <option value="">
                      اختر المحاضرة أو التقييم
                    </option>

                    {lectures.map(
                      (lecture) => (
                        <option
                          key={
                            lecture.id
                          }
                          value={
                            lecture.id
                          }
                        >
                          {lecture.title} —{" "}
                          {lecture.grade}
                        </option>
                      )
                    )}

                    {assessments.map(
                      (assessment) => (
                        <option
                          key={
                            `assessment-${assessment.id}`
                          }
                          value={
                            assessment.id
                          }
                        >
                          {assessment.type ===
                          "homework"
                            ? "📝 "
                            : "⚡ "}
                          {assessment.title}
                        </option>
                      )
                    )}
                  </select>

                  {selectedLectureAssessment &&
                    lectures.some(
                      (lecture) =>
                        lecture.id ===
                        selectedLectureAssessment
                    ) && (
                      <>
                        <select
                          className="input"
                          value={
                            assessmentType
                          }
                          onChange={(e) =>
                            setAssessmentType(
                              e.target.value as
                                | "homework"
                                | "quiz"
                            )
                          }
                        >
                          <option value="homework">
                            📝 واجب
                          </option>

                          <option value="quiz">
                            ⚡ Quiz
                          </option>
                        </select>

                        <input
                          className="input"
                          placeholder={
                            assessmentType ===
                            "homework"
                              ? "اسم الواجب"
                              : "اسم الـQuiz"
                          }
                          value={
                            assessmentTitle
                          }
                          onChange={(e) =>
                            setAssessmentTitle(
                              e.target.value
                            )
                          }
                        />

                        <textarea
                          className="input"
                          placeholder="وصف اختياري"
                          value={
                            assessmentDescription
                          }
                          onChange={(e) =>
                            setAssessmentDescription(
                              e.target.value
                            )
                          }
                        />

                        <button
                          className="btn btn-primary"
                          onClick={
                            addAssessment
                          }
                        >
                          {assessmentType ===
                          "homework"
                            ? "إنشاء الواجب"
                            : "إنشاء الـQuiz"}
                        </button>
                      </>
                    )}

                </div>
              </div>

              {/* التقييمات الموجودة */}

              {selectedLectureAssessment &&
                assessments.some(
                  (a) =>
                    a.lecture_id ===
                    selectedLectureAssessment
                ) && (
                  <section className="section">

                    <h2>
                      التقييمات الموجودة
                    </h2>

                    <div className="grid">

                      {assessments
                        .filter(
                          (a) =>
                            a.lecture_id ===
                            selectedLectureAssessment
                        )
                        .map(
                          (assessment) => (
                            <div
                              className="card"
                              key={
                                assessment.id
                              }
                            >

                              <h3>
                                {assessment.type ===
                                "homework"
                                  ? "📝 "
                                  : "⚡ "}

                                {
                                  assessment.title
                                }
                              </h3>

                              <p>
                                {
                                  assessment.description ||
                                  "بدون وصف"
                                }
                              </p>

                              <span className="pill">
                                {assessment.type ===
                                "homework"
                                  ? "واجب"
                                  : "Quiz"}
                              </span>

                              <div
                                style={{
                                  display:
                                    "flex",
                                  gap: 8,
                                  flexWrap:
                                    "wrap",
                                  marginTop:
                                    12,
                                }}
                              >
                                <button
                                  className="btn btn-primary"
                                  onClick={() => {
                                    setSelectedLectureAssessment(
                                      assessment.id
                                    );

                                    loadAssessmentQuestions(
                                      assessment.id
                                    );
                                  }}
                                >
                                  إدارة الأسئلة
                                </button>

                                <button
                                  className="btn"
                                  onClick={() =>
                                    deleteAssessment(
                                      assessment
                                    )
                                  }
                                  style={{
                                    color:
                                      "#b00020",
                                  }}
                                >
                                  حذف
                                </button>
                              </div>

                            </div>
                          )
                        )}

                    </div>

                  </section>
                )}

              {/* أسئلة الواجب */}

              {selectedLectureAssessment &&
                assessments.some(
                  (a) =>
                    a.id ===
                    selectedLectureAssessment
                ) && (
                  <section className="section">

                    <div className="card">

                      <h2>
                        ➕ إضافة سؤال
                      </h2>

                      <div className="form">

                        <textarea
                          className="input"
                          placeholder="اكتب سؤال الواجب هنا..."
                          value={
                            assessmentQuestionText
                          }
                          onChange={(e) =>
                            setAssessmentQuestionText(
                              e.target.value
                            )
                          }
                        />

                        {assessmentOptions.map(
                          (
                            option,
                            index
                          ) => (
                            <input
                              key={index}
                              className="input"
                              placeholder={
                                "الاختيار " +
                                (index + 1)
                              }
                              value={
                                option
                              }
                              onChange={(e) => {
                                const next =
                                  [
                                    ...assessmentOptions,
                                  ];

                                next[index] =
                                  e.target.value;

                                setAssessmentOptions(
                                  next
                                );
                              }}
                            />
                          )
                        )}

                        <select
                          className="input"
                          value={
                            assessmentCorrect
                          }
                          onChange={(e) =>
                            setAssessmentCorrect(
                              e.target.value
                            )
                          }
                        >
                          <option value="0">
                            الإجابة الصحيحة: الاختيار 1
                          </option>

                          <option value="1">
                            الإجابة الصحيحة: الاختيار 2
                          </option>

                          <option value="2">
                            الإجابة الصحيحة: الاختيار 3
                          </option>

                          <option value="3">
                            الإجابة الصحيحة: الاختيار 4
                          </option>
                        </select>

                        <button
                          className="btn btn-primary"
                          onClick={
                            addAssessmentQuestion
                          }
                        >
                          إضافة السؤال
                        </button>

                      </div>

                    </div>

                    <h2>
                      أسئلة التقييم (
                      {
                        assessmentQuestions.length
                      }
                      )
                    </h2>

                    {assessmentQuestions.length ===
                    0 ? (
                      <div className="card">
                        لا توجد أسئلة حتى الآن.
                      </div>
                    ) : (
                      <div className="grid">

                        {assessmentQuestions.map(
                          (
                            q,
                            index
                          ) => (
                            <div
                              className="card"
                              key={
                                q.id
                              }
                            >

                              <h3>
                                السؤال{" "}
                                {index +
                                  1}
                              </h3>

                              <p>
                                {
                                  q.question_text
                                }
                              </p>

                              {q.options?.map(
                                (
                                  option,
                                  i
                                ) => (
                                  <div
                                    key={
                                      i
                                    }
                                    style={{
                                      padding:
                                        "8px 0",
                                      fontWeight:
                                        i ===
                                        q.correct_option
                                          ? 700
                                          : 400,
                                    }}
                                  >
                                    {i ===
                                    q.correct_option
                                      ? "✓ "
                                      : ""}

                                    {i + 1}.{" "}
                                    {
                                      option
                                    }
                                  </div>
                                )
                              )}

                              <button
                                className="btn"
                                style={{
                                  marginTop:
                                    10,
                                  color:
                                    "#b00020",
                                }}
                                onClick={() =>
                                  deleteAssessmentQuestion(
                                    q
                                  )
                                }
                              >
                                حذف السؤال
                              </button>

                            </div>
                          )
                        )}

                      </div>
                    )}

                  </section>
                )}

              {/* قائمة المحاضرات */}

              <section className="section">

                <h2>
                  المحاضرات (
                  {lectures.length}
                  )
                </h2>

                {lectures.length === 0 ? (
                  <div className="card">
                    لا توجد محاضرات حتى الآن.
                  </div>
                ) : (
                  <div className="grid">

                    {lectures.map(
                      (lecture) => {
                        const lectureAssessments =
                          assessments.filter(
                            (a) =>
                              a.lecture_id ===
                              lecture.id
                          );

                        return (
                          <div
                            className="card"
                            key={
                              lecture.id
                            }
                          >

                            <h3>
                              {
                                lecture.title
                              }
                            </h3>

                            {lecture.description && (
                              <p>
                                {
                                  lecture.description
                                }
                              </p>
                            )}

                            <div
                              style={{
                                display:
                                  "flex",
                                gap: 8,
                                flexWrap:
                                  "wrap",
                                marginTop:
                                  10,
                                marginBottom:
                                  12,
                              }}
                            >

                              <span className="pill">
                                {
                                  lecture.grade
                                }
                              </span>

                              {lecture.video_url && (
                                <span className="pill">
                                  🎥 فيديو
                                </span>
                              )}

                              {lecture.pdf_url && (
                                <span className="pill">
                                  📄 PDF
                                </span>
                              )}

                              {lecture.has_homework && (
                                <span className="pill">
                                  📝 واجب
                                </span>
                              )}

                              {lecture.has_quiz && (
                                <span className="pill">
                                  ⚡ Quiz
                                </span>
                              )}

                            </div>

                            {lectureAssessments.length >
                              0 && (
                              <div
                                style={{
                                  marginBottom:
                                    12,
                                }}
                              >
                                <strong>
                                  التقييمات:
                                </strong>

                                {lectureAssessments.map(
                                  (
                                    assessment
                                  ) => (
                                    <div
                                      key={
                                        assessment.id
                                      }
                                      style={{
                                        marginTop:
                                          6,
                                      }}
                                    >
                                      {assessment.type ===
                                      "homework"
                                        ? "📝 "
                                        : "⚡ "}

                                      {
                                        assessment.title
                                      }
                                    </div>
                                  )
                                )}
                              </div>
                            )}

                            <div
                              style={{
                                display:
                                  "flex",
                                gap: 8,
                                flexWrap:
                                  "wrap",
                              }}
                            >

                              {lecture.video_url && (
                                <a
                                  className="btn"
                                  href={
                                    lecture.video_url
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  فتح الفيديو
                                </a>
                              )}

                              {lecture.pdf_url && (
                                <a
                                  className="btn"
                                  href={
                                    lecture.pdf_url
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  فتح PDF
                                </a>
                              )}

                              <button
                                className="btn btn-primary"
                                onClick={() => {
                                  setSelectedLectureAssessment(
                                    lecture.id
                                  );

                                  setAssessmentQuestions(
                                    []
                                  );

                                  window.scrollTo({
                                    top: 0,
                                    behavior:
                                      "smooth",
                                  });
                                }}
                              >
                                📝 إدارة الواجب
                              </button>

                              <button
                                className="btn"
                                onClick={() =>
                                  deleteLecture(
                                    lecture
                                  )
                                }
                              >
                                حذف المحاضرة
                              </button>

                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>
                )}

              </section>
            </>
          )}

          {/* الامتحانات */}

          {tab === "exams" && (
            <>
              <div className="card">

                <h2>
                  إنشاء امتحان
                </h2>

                <div className="form">

                  <input
                    className="input"
                    placeholder="اسم الامتحان"
                    value={title}
                    onChange={(e) =>
                      setTitle(
                        e.target.value
                      )
                    }
                  />

                  <textarea
                    className="input"
                    placeholder="الوصف"
                    value={desc}
                    onChange={(e) =>
                      setDesc(
                        e.target.value
                      )
                    }
                  />

                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) =>
                      setDuration(
                        e.target.value
                      )
                    }
                    placeholder="المدة بالدقائق"
                  />

                  <button
                    className="btn btn-primary"
                    onClick={
                      addExam
                    }
                  >
                    إنشاء
                  </button>

                </div>
              </div>

              <section className="section">

                <div className="grid">

                  {exams.map(
                    (exam) => (
                      <ExamCard
                        key={exam.id}
                        exam={exam}
                        onSelectQuestions={() => {
                          setSelectedExam(
                            exam.id
                          );

                          setTab(
                            "questions"
                          );

                          loadQuestions(
                            exam.id
                          );
                        }}
                        onSelectResults={() => {
                          setSelectedResultsExam(
                            exam.id
                          );

                          setTab(
                            "results"
                          );

                          loadAttempts(
                            exam.id
                          );
                        }}
                        onDelete={() =>
                          deleteExam(
                            exam
                          )
                        }
                      />
                    )
                  )}

                </div>

              </section>
            </>
          )}

          {/* الأسئلة */}

          {tab === "questions" && (
            <>
              <div className="card">

                <h2>
                  إدارة أسئلة الامتحان
                </h2>

                <select
                  className="input"
                  value={selectedExam}
                  onChange={(e) => {
                    const id =
                      e.target.value;

                    setSelectedExam(
                      id
                    );

                    loadQuestions(
                      id
                    );
                  }}
                >
                  <option value="">
                    اختر الامتحان
                  </option>

                  {exams.map(
                    (exam) => (
                      <option
                        key={exam.id}
                        value={exam.id}
                      >
                        {exam.title}
                      </option>
                    )
                  )}
                </select>

              </div>

              {selectedExam && (
                <>
                  <div className="card">

                    <h2>
                      إضافة سؤال
                    </h2>

                    <div className="form">

                      <textarea
                        className="input"
                        placeholder="اكتب السؤال هنا... (اختياري إذا كنت سترفع صورة)"
                        value={
                          questionText
                        }
                        onChange={(e) =>
                          setQuestionText(
                            e.target.value
                          )
                        }
                      />

                      <label
                        style={{
                          fontWeight: 700,
                        }}
                      >
                        صورة السؤال — اختياري
                      </label>

                      <input
                        id="question-image"
                        className="input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f =
                            e.target.files?.[0] ||
                            null;

                          setQuestionFile(
                            f
                          );

                          if (f) {
                            setPreviewUrl(
                              URL.createObjectURL(
                                f
                              )
                            );
                          } else {
                            setPreviewUrl(
                              ""
                            );
                          }
                        }}
                      />

                      {previewUrl && (
                        <img
                          src={
                            previewUrl
                          }
                          alt="معاينة السؤال"
                          style={{
                            maxWidth:
                              "100%",
                            maxHeight:
                              320,
                            objectFit:
                              "contain",
                            borderRadius:
                              12,
                            border:
                              "1px solid #ddd",
                          }}
                        />
                      )}

                      {options.map(
                        (
                          op,
                          i
                        ) => (
                          <input
                            key={i}
                            className="input"
                            placeholder={
                              "الاختيار " +
                              (i + 1)
                            }
                            value={
                              op
                            }
                            onChange={(
                              e
                            ) => {
                              const a =
                                [
                                  ...options,
                                ];

                              a[i] =
                                e.target.value;

                              setOptions(
                                a
                              );
                            }}
                          />
                        )
                      )}

                      <select
                        className="input"
                        value={
                          correct
                        }
                        onChange={(e) =>
                          setCorrect(
                            e.target.value
                          )
                        }
                      >
                        <option value="0">
                          الإجابة الصحيحة: الاختيار 1
                        </option>

                        <option value="1">
                          الإجابة الصحيحة: الاختيار 2
                        </option>

                        <option value="2">
                          الإجابة الصحيحة: الاختيار 3
                        </option>

                        <option value="3">
                          الإجابة الصحيحة: الاختيار 4
                        </option>
                      </select>

                      <button
                        className="btn btn-primary"
                        disabled={
                          uploading
                        }
                        onClick={
                          addQuestion
                        }
                      >
                        {uploading
                          ? "جاري رفع الصورة..."
                          : "إضافة السؤال"}
                      </button>

                    </div>
                  </div>

                  <section className="section">

                    <h2>
                      أسئلة الامتحان (
                      {
                        questions.length
                      }
                      )
                    </h2>

                    {questions.length ===
                    0 ? (
                      <div className="card">
                        لا توجد أسئلة لهذا الامتحان حتى الآن.
                      </div>
                    ) : (
                      <div className="grid">

                        {questions.map(
                          (
                            q,
                            index
                          ) => (
                            <div
                              className="card"
                              key={
                                q.id
                              }
                            >

                              <h3>
                                السؤال{" "}
                                {index +
                                  1}
                              </h3>

                              {q.question_text && (
                                <p>
                                  {
                                    q.question_text
                                  }
                                </p>
                              )}

                              {q.question_image_url && (
                                <img
                                  src={
                                    q.question_image_url
                                  }
                                  alt="صورة السؤال"
                                  style={{
                                    maxWidth:
                                      "100%",
                                    maxHeight:
                                      300,
                                    objectFit:
                                      "contain",
                                    borderRadius:
                                      12,
                                  }}
                                />
                              )}

                              <div
                                style={{
                                  marginTop:
                                    12,
                                }}
                              >
                                {q.options?.map(
                                  (
                                    option,
                                    i
                                  ) => (
                                    <div
                                      key={
                                        i
                                      }
                                      style={{
                                        padding:
                                          "8px 0",
                                        fontWeight:
                                          i ===
                                          q.correct_option
                                            ? 700
                                            : 400,
                                      }}
                                    >
                                      {i ===
                                      q.correct_option
                                        ? "✓ "
                                        : ""}
                                      {i +
                                        1}
                                      .{" "}
                                      {
                                        option
                                      }
                                    </div>
                                  )
                                )}
                              </div>

                              <button
                                className="btn"
                                style={{
                                  marginTop:
                                    10,
                                }}
                                onClick={() =>
                                  deleteQuestion(
                                    q
                                  )
                                }
                              >
                                حذف السؤال
                              </button>

                            </div>
                          )
                        )}

                      </div>
                    )}

                  </section>
                </>
              )}
            </>
          )}

          {/* النتائج */}

          {tab === "results" && (
            <>
              <div className="card">

                <h2>
                  نتائج الامتحانات
                </h2>

                <select
                  className="input"
                  value={
                    selectedResultsExam
                  }
                  onChange={(e) => {
                    const id =
                      e.target.value;

                    setSelectedResultsExam(
                      id
                    );

                    loadAttempts(
                      id
                    );
                  }}
                >
                  <option value="">
                    اختر الامتحان
                  </option>

                  {exams.map(
                    (exam) => (
                      <option
                        key={exam.id}
                        value={exam.id}
                      >
                        {exam.title}
                      </option>
                    )
                  )}
                </select>

              </div>

              {selectedResultsExam && (
                <section className="section">

                  <h2>
                    الطلاب والمحاولات
                  </h2>

                  {attempts.length ===
                  0 ? (
                    <div className="card">
                      لا توجد محاولات لهذا الامتحان حتى الآن.
                    </div>
                  ) : (
                    <div className="card">

                      <table className="table">

                        <thead>
                          <tr>
                            <th>
                              الطالب
                            </th>

                            <th>
                              الامتحان
                            </th>

                            <th>
                              وقت الدخول
                            </th>

                            <th>
                              وقت التسليم
                            </th>

                            <th>
                              الدرجة
                            </th>

                            <th>
                              الحالة
                            </th>
                          </tr>
                        </thead>

                        <tbody>

                          {attempts.map(
                            (
                              attempt
                            ) => (
                              <tr
                                key={
                                  attempt.id
                                }
                              >

                                <td>
                                  {getStudentName(
                                    attempt.student_id
                                  )}
                                </td>

                                <td>
                                  {getExamName(
                                    attempt.exam_id
                                  )}
                                </td>

                                <td>
                                  {formatDate(
                                    attempt.started_at
                                  )}
                                </td>

                                <td>
                                  {formatDate(
                                    attempt.submitted_at
                                  )}
                                </td>

                                <td>
                                  {attempt.score !==
                                    null &&
                                  attempt.total_questions !==
                                    null
                                    ? `${attempt.score} / ${attempt.total_questions}`
                                    : "—"}
                                </td>

                                <td>
                                  {attempt.submitted_at ? (
                                    <span className="pill">
                                      تم التسليم
                                    </span>
                                  ) : (
                                    <span className="pill">
                                      لم يسلّم
                                    </span>
                                  )}
                                </td>

                              </tr>
                            )
                          )}

                        </tbody>

                      </table>

                    </div>
                  )}

                </section>
              )}
            </>
          )}

          {/* المتابعة */}

          {tab === "progress" && (
            <>
              <div className="card">

                <h2>
                  📊 متابعة الطلاب
                </h2>

                <p>
                  متابعة أداء الطلاب في
                  الامتحانات والواجبات وآخر
                  نشاط لكل طالب.
                </p>

                <div
                  className="grid"
                  style={{
                    marginTop: 15,
                  }}
                >

                  <div className="card">
                    <h3>
                      👨‍🎓 الطلاب
                    </h3>

                    <div
                      style={{
                        fontSize: 30,
                        fontWeight: 800,
                      }}
                    >
                      {students.length}
                    </div>
                  </div>

                  <div className="card">
                    <h3>
                      📝 الواجبات المسلّمة
                    </h3>

                    <div
                      style={{
                        fontSize: 30,
                        fontWeight: 800,
                      }}
                    >
                      {
                        assessmentAttempts.filter(
                          (a) =>
                            a.submitted_at
                        ).length
                      }
                    </div>
                  </div>

                  <div className="card">
                    <h3>
                      🧪 الامتحانات المسلّمة
                    </h3>

                    <div
                      style={{
                        fontSize: 30,
                        fontWeight: 800,
                      }}
                    >
                      {
                        allExamAttempts.filter(
                          (a) =>
                            a.submitted_at
                        ).length
                      }
                    </div>
                  </div>

                  <div className="card">
                    <h3>
                      📚 المحاضرات
                    </h3>

                    <div
                      style={{
                        fontSize: 30,
                        fontWeight: 800,
                      }}
                    >
                      {lectures.length}
                    </div>
                  </div>

                </div>
              </div>

              <div className="card">

                <h2>
                  🔎 البحث والفلترة
                </h2>

                <div className="grid">

                  <input
                    className="input"
                    placeholder="ابحث باسم الطالب أو الكود..."
                    value={
                      progressSearch
                    }
                    onChange={(e) =>
                      setProgressSearch(
                        e.target.value
                      )
                    }
                  />

                  <select
                    className="input"
                    value={
                      progressGrade
                    }
                    onChange={(e) =>
                      setProgressGrade(
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      كل المراحل
                    </option>

                    <option value="أولى ثانوي">
                      أولى ثانوي
                    </option>

                    <option value="ثانية ثانوي">
                      ثانية ثانوي
                    </option>

                    <option value="ثالثة ثانوي">
                      ثالثة ثانوي
                    </option>
                  </select>

                </div>
              </div>

              <section className="section">

                <h2>
                  أداء الطلاب (
                  {
                    getProgressStudents()
                      .length
                  }
                  )
                </h2>

                {getProgressStudents()
                  .length === 0 ? (
                  <div className="card">
                    لا يوجد طلاب مطابقون للبحث.
                  </div>
                ) : (
                  <div className="grid">

                    {getProgressStudents().map(
                      (student) => {
                        const examStudentAttempts =
                          getStudentExamAttempts(
                            student.id
                          );

                        const homeworkStudentAttempts =
                          getStudentHomeworkAttempts(
                            student.id
                          );

                        const submittedExams =
                          examStudentAttempts.filter(
                            (a) =>
                              a.submitted_at
                          );

                        const submittedHomework =
                          homeworkStudentAttempts.filter(
                            (a) =>
                              a.submitted_at
                          );

                        const examAverage =
                          getStudentAverage(
                            student.id,
                            "exam"
                          );

                        const homeworkAverage =
                          getStudentAverage(
                            student.id,
                            "homework"
                          );

                        const lastActivity =
                          getStudentLastActivity(
                            student.id
                          );

                        return (
                          <div
                            className="card"
                            key={
                              student.id
                            }
                          >

                            <h3>
                              👤{" "}
                              {
                                student.full_name
                              }
                            </h3>

                            <div
                              style={{
                                display:
                                  "flex",
                                gap: 8,
                                flexWrap:
                                  "wrap",
                                marginTop:
                                  10,
                              }}
                            >
                              <span className="pill">
                                {student.grade ||
                                  "غير محددة"}
                              </span>

                              <span className="pill">
                                {student.active
                                  ? "مفعل"
                                  : "موقوف"}
                              </span>
                            </div>

                            <div
                              style={{
                                marginTop:
                                  15,
                                lineHeight:
                                  1.9,
                              }}
                            >

                              <div>
                                🧪 الامتحانات:{" "}
                                <strong>
                                  {
                                    submittedExams.length
                                  }
                                </strong>
                              </div>

                              <div>
                                📝 الواجبات:{" "}
                                <strong>
                                  {
                                    submittedHomework.length
                                  }
                                </strong>
                              </div>

                              <div>
                                📈 متوسط
                                الامتحانات:{" "}
                                <strong>
                                  {examAverage !==
                                  null
                                    ? `${examAverage}%`
                                    : "—"}
                                </strong>
                              </div>

                              <div>
                                📊 متوسط
                                الواجبات:{" "}
                                <strong>
                                  {homeworkAverage !==
                                  null
                                    ? `${homeworkAverage}%`
                                    : "—"}
                                </strong>
                              </div>

                              <div>
                                🕐 آخر نشاط:{" "}
                                <strong>
                                  {lastActivity
                                    ? formatDate(
                                        lastActivity
                                      )
                                    : "لا يوجد نشاط"}
                                </strong>
                              </div>

                            </div>

                            <button
                              className="btn btn-primary"
                              style={{
                                marginTop:
                                  15,
                              }}
                              onClick={() =>
                                setSelectedProgressStudent(
                                  selectedProgressStudent ===
                                    student.id
                                    ? ""
                                    : student.id
                                )
                              }
                            >
                              {selectedProgressStudent ===
                              student.id
                                ? "إخفاء التفاصيل"
                                : "عرض التفاصيل"}
                            </button>

                            {selectedProgressStudent ===
                              student.id && (
                              <div
                                style={{
                                  marginTop:
                                    20,
                                }}
                              >

                                <h3>
                                  🧪 نتائج الامتحانات
                                </h3>

                                {examStudentAttempts.length ===
                                0 ? (
                                  <p>
                                    لا توجد
                                    محاولات
                                    امتحانات.
                                  </p>
                                ) : (
                                  examStudentAttempts.map(
                                    (
                                      attempt
                                    ) => {
                                      const percentage =
                                        getPercentage(
                                          attempt.score,
                                          attempt.total_questions
                                        );

                                      return (
                                        <div
                                          key={
                                            attempt.id
                                          }
                                          style={{
                                            padding:
                                              "12px 0",
                                            borderBottom:
                                              "1px solid #ddd",
                                          }}
                                        >

                                          <strong>
                                            {getExamName(
                                              attempt.exam_id
                                            )}
                                          </strong>

                                          <div>
                                            الدرجة:{" "}
                                            {attempt.score !==
                                              null &&
                                            attempt.total_questions !==
                                              null
                                              ? `${attempt.score} / ${attempt.total_questions}`
                                              : "لم يسلّم"}
                                          </div>

                                          {percentage !==
                                            null && (
                                            <div>
                                              النسبة:{" "}
                                              <strong>
                                                {
                                                  percentage
                                                }
                                                %
                                              </strong>
                                            </div>
                                          )}

                                          <div>
                                            الدخول:{" "}
                                            {formatDate(
                                              attempt.started_at
                                            )}
                                          </div>

                                          <div>
                                            التسليم:{" "}
                                            {formatDate(
                                              attempt.submitted_at
                                            )}
                                          </div>

                                          {attempt.submitted_at ? (
                                            <span className="pill">
                                              تم التسليم
                                            </span>
                                          ) : (
                                            <span className="pill">
                                              لم يسلّم
                                            </span>
                                          )}

                                        </div>
                                      );
                                    }
                                  )
                                )}

                                <h3
                                  style={{
                                    marginTop:
                                      20,
                                  }}
                                >
                                  📝 نتائج الواجبات
                                </h3>

                                {homeworkStudentAttempts.length ===
                                0 ? (
                                  <p>
                                    لا توجد واجبات
                                    محلولة.
                                  </p>
                                ) : (
                                  homeworkStudentAttempts.map(
                                    (
                                      attempt
                                    ) => {
                                      const assessment =
                                        assessments.find(
                                          (a) =>
                                            a.id ===
                                            attempt.assessment_id
                                        );

                                      const percentage =
                                        getPercentage(
                                          attempt.score,
                                          attempt.total_questions
                                        );

                                      return (
                                        <div
                                          key={
                                            attempt.id
                                          }
                                          style={{
                                            padding:
                                              "12px 0",
                                            borderBottom:
                                              "1px solid #ddd",
                                          }}
                                        >

                                          <strong>
                                            {assessment?.title ||
                                              "واجب غير معروف"}
                                          </strong>

                                          {assessment && (
                                            <div>
                                              المحاضرة:{" "}
                                              {getLectureName(
                                                assessment.lecture_id
                                              )}
                                            </div>
                                          )}

                                          <div>
                                            الدرجة:{" "}
                                            {attempt.score !==
                                              null &&
                                            attempt.total_questions !==
                                              null
                                              ? `${attempt.score} / ${attempt.total_questions}`
                                              : "—"}
                                          </div>

                                          {percentage !==
                                            null && (
                                            <div>
                                              النسبة:{" "}
                                              <strong>
                                                {
                                                  percentage
                                                }
                                                %
                                              </strong>
                                            </div>
                                          )}

                                          <div>
                                            التسليم:{" "}
                                            {formatDate(
                                              attempt.submitted_at
                                            )}
                                          </div>

                                        </div>
                                      );
                                    }
                                  )
                                )}

                              </div>
                            )}

                          </div>
                        );
                      }
                    )}

                  </div>
                )}

              </section>
            </>
          )}

        </main>
      </div>
    </div>
  );
}

function ExamCard({
  exam,
  onSelectQuestions,
  onSelectResults,
  onDelete,
}: {
  exam: Exam;
  onSelectQuestions: () => void;
  onSelectResults: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="card">

      <h3>
        {exam.title}
      </h3>

      <p>
        {exam.description}
      </p>

      <span className="pill">
        {exam.duration_minutes} دقيقة
      </span>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginTop: 15,
        }}
      >

        <button
          className="btn btn-primary"
          onClick={
            onSelectQuestions
          }
        >
          إدارة الأسئلة
        </button>

        <button
          className="btn"
          onClick={
            onSelectResults
          }
        >
          الطلاب والنتائج
        </button>

        <button
          className="btn"
          onClick={onDelete}
        >
          حذف الامتحان
        </button>

      </div>

    </div>
  );
}