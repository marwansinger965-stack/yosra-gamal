"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    if (!supabase) {
      setError("أضف بيانات Supabase في .env.local");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.rpc(
      "login_student_by_code",
      {
        p_code: code.trim(),
      }
    );

    console.log("Student login data:", data);

    if (error || !data?.[0]) {
      setError("الكود غير صحيح أو الحساب غير مفعل.");
      setLoading(false);
      return;
    }

    const loggedStudent = {
      id: data[0].id,
      name: data[0].full_name,
      grade: data[0].grade ?? null,
    };

    localStorage.setItem(
      "yg_student",
      JSON.stringify(loggedStudent)
    );

    router.push("/student");
  }

  return (
    <main className="auth">
      <div className="auth-box">
        <div
          className="brand"
          style={{ color: "#800020" }}
        >
          Yosra Gamal
        </div>

        <h1>دخول الطالب</h1>

        <p className="muted">
          أدخل كود الدخول الخاص بك.
        </p>

        <form
          className="form"
          onSubmit={submit}
        >
          <input
            className="input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="كود الطالب"
            required
          />

          {error && (
            <div style={{ color: "#a11" }}>
              {error}
            </div>
          )}

          <button
            className="btn btn-primary"
            disabled={loading}
          >
            {loading
              ? "جاري التحقق..."
              : "دخول"}
          </button>
        </form>

        <p className="footer">
          الدعم: 01069225373
        </p>
      </div>
    </main>
  );
}