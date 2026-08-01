export default function Loading() {
  return (
    <section className="view active">
      <div className="hero" style={{ padding: "90px 10px" }}>
        <div className="seal" style={{ position: "static", margin: "0 auto 18px", animation: "beat 1.4s ease-in-out infinite" }}>
          &#10084;
        </div>
        <p className="sub" style={{ fontSize: 16 }}>Gathering your letters&hellip;</p>
      </div>
    </section>
  );
}
