export default function CareersPage() {
  const jobs = [
    {
      title: "Professional Mover",
      type: "Full-time",
      location: "Multiple Locations",
      description: "Join our team of professional movers. Physical fitness required. Training provided.",
    },
    {
      title: "Move Coordinator",
      type: "Full-time",
      location: "Remote",
      description: "Coordinate residential and commercial moves. Strong communication skills needed.",
    },
    {
      title: "CDL Driver",
      type: "Full-time",
      location: "Multiple Locations",
      description: "Drive our fleet of moving trucks. Valid CDL-A license required. Competitive pay.",
    },
    {
      title: "Sales Representative",
      type: "Full-time",
      location: "Remote / Hybrid",
      description: "Generate leads and close deals for our moving services. Commission + base salary.",
    },
  ];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <div className="mb-12">
        <h1 className="text-3xl font-bold">Career Opportunities</h1>
        <p className="mt-2 text-muted-foreground">
          We&apos;re growing fast and looking for talented people to join our team.
          Competitive pay, great benefits, and room to grow.
        </p>
      </div>

      <div className="space-y-4">
        {jobs.map((job) => (
          <div
            key={job.title}
            className="rounded-lg border bg-card p-6 shadow-sm transition-colors hover:border-foreground/20"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{job.title}</h3>
                <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{job.type}</span>
                  <span>&middot;</span>
                  <span>{job.location}</span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {job.description}
                </p>
              </div>
              <button className="shrink-0 inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                Apply
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-lg border bg-muted/50 p-8 text-center">
        <h2 className="text-xl font-semibold">Don&apos;t See Your Role?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;re always looking for great people. Ask our assistant about
          other opportunities or send us your resume.
        </p>
      </div>
    </div>
  );
}
