import Link from "next/link";

export default function Home() {
  return <>
    <nav className="nav"><div className="brand">Yosra Gamal<small>منصتك التعليمية</small></div><Link className="btn btn-light" href="/login">دخول الطالب</Link></nav>
    <main>
      <section className="hero"><div className="container">
        <h1>Yosra Gamal</h1>
        <p>منصة تعليمية للفيديوهات والامتحانات وإدارة الطلاب بسهولة.</p>
        <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:25}}>
          <Link className="btn btn-primary" href="/login">دخول الطالب</Link>
          <Link className="btn btn-light" href="/admin">لوحة المدرس</Link>
        </div>
      </div></section>
      <section className="section"><div className="container grid">
        <div className="card"><h3>🎥 فيديوهات</h3><p>تنظيم الدروس والفيديوهات داخل المنصة.</p></div>
        <div className="card"><h3>📝 امتحانات</h3><p>إنشاء امتحانات بمدة محددة وأسئلة متعددة.</p></div>
        <div className="card"><h3>🔒 محاولة واحدة</h3><p>كل طالب له محاولة واحدة فقط لكل امتحان.</p></div>
        <div className="card"><h3>👥 إدارة الطلاب</h3><p>المدرس يتحكم في الطلاب المسموح لهم بالدخول.</p></div>
      </div></section>
    </main>
    <footer className="footer">الدعم: 01069225373</footer>
  </>;
}