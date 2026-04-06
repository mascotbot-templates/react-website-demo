import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Moving Made Simple
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Local and long-distance moves handled with care. Get an instant estimate
          by talking to our assistant, or browse our services below.
        </p>
        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/estimate"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Get a Free Estimate
          </Link>
          <Link
            href="/careers"
            className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            We&apos;re Hiring
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/50 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Get an Estimate",
                description:
                  "Tell us where you're moving, when, and how big your place is. We'll give you a quote on the spot.",
              },
              {
                title: "Book Your Move",
                description:
                  "Pick a date that works. Our team handles packing, loading, transport, and unloading.",
              },
              {
                title: "Settle In",
                description:
                  "We deliver everything to your new place, set up furniture, and make sure you're happy.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border bg-card p-6 shadow-sm"
              >
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold">Our Services</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                title: "Residential Moving",
                description: "Full-service home moving with packing, loading, and setup at your new location.",
                href: "/estimate",
                cta: "Get Estimate",
              },
              {
                title: "Commercial Moving",
                description: "Office relocations with minimal downtime. We handle IT equipment, furniture, and more.",
                href: "/estimate",
                cta: "Get Estimate",
              },
              {
                title: "Career Opportunities",
                description: "Join our growing team. We offer competitive pay, benefits, and growth opportunities.",
                href: "/careers",
                cta: "View Openings",
              },
              {
                title: "Franchise Program",
                description: "Own your own moving business with our proven model and comprehensive support.",
                href: "/franchise",
                cta: "Learn More",
              },
            ].map((service) => (
              <Link
                key={service.title}
                href={service.href}
                className="group rounded-lg border p-6 transition-colors hover:border-foreground/20 hover:bg-accent"
              >
                <h3 className="mb-2 text-lg font-semibold group-hover:text-foreground">
                  {service.title}
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {service.description}
                </p>
                <span className="text-sm font-medium text-primary">
                  {service.cta} &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/50 px-4 py-16">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold">Ready to Move?</h2>
          <p className="mt-4 text-muted-foreground">
            Get a free estimate in under a minute. Talk to our assistant or fill
            out the form yourself — whatever works best for you.
          </p>
        </div>
      </section>
    </div>
  );
}
