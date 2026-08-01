import Link from "next/link";

export default function NotFound() {
  return (
    <section className="view active">
      <div className="empty-state" style={{ padding: "90px 20px" }}>
        <div className="ic">&#128140;</div>
        <h3>This letter can&rsquo;t be found</h3>
        <p>It may have been deleted, or a share link may have been revoked.</p>
        <div className="hero-actions" style={{ marginTop: 22 }}>
          <Link href="/library" className="btn btn-primary">
            Back to Library
          </Link>
          <Link href="/" className="btn btn-ghost">
            Home
          </Link>
        </div>
      </div>
    </section>
  );
}
