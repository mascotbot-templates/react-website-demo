export default function FranchisePage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <div className="mb-12">
        <h1 className="text-3xl font-bold">Franchise Opportunities</h1>
        <p className="mt-2 text-muted-foreground">
          Own your own moving business backed by our proven brand, training
          programs, and operational support.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {[
          {
            title: "Proven Business Model",
            description:
              "Our franchise system has been refined over 10+ years with consistent profitability across all markets.",
          },
          {
            title: "Comprehensive Training",
            description:
              "2-week intensive training program covering operations, sales, marketing, and customer service.",
          },
          {
            title: "Marketing Support",
            description:
              "National brand recognition, local marketing tools, lead generation, and digital advertising support.",
          },
          {
            title: "Technology Platform",
            description:
              "Access to our proprietary booking system, CRM, fleet management, and AI assistant tools.",
          },
        ].map((benefit) => (
          <div
            key={benefit.title}
            className="rounded-lg border bg-card p-6 shadow-sm"
          >
            <h3 className="mb-2 text-lg font-semibold">{benefit.title}</h3>
            <p className="text-sm text-muted-foreground">
              {benefit.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-lg border bg-muted/50 p-8">
        <h2 className="text-xl font-semibold">Investment Overview</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Initial Investment", value: "$80K - $150K" },
            { label: "Franchise Fee", value: "$35,000" },
            { label: "Royalty", value: "6% of revenue" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-2xl font-bold">{item.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-muted-foreground">
          Interested? Ask our assistant for more details or to start your
          franchise application.
        </p>
      </div>
    </div>
  );
}
