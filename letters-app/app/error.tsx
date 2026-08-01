"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="view active">
      <div className="empty-state" style={{ padding: "90px 20px" }}>
        <div className="ic">&#128148;</div>
        <h3>Something didn&rsquo;t save right</h3>
        <p>That&rsquo;s on us, not on you. Give it another try.</p>
        <div className="hero-actions" style={{ marginTop: 22 }}>
          <button className="btn btn-primary" onClick={() => reset()} type="button">
            Try again
          </button>
        </div>
      </div>
    </section>
  );
}
