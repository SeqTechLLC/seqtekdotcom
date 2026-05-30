interface Step {
  id?: string | null
  title: string
  body: string
  icon?: string | null
}

interface ProcessStepsProps {
  heading?: string | null
  steps: Step[]
}

export function ProcessSteps({ heading, steps }: ProcessStepsProps) {
  return (
    <section className="px-4 py-16 md:px-6 lg:px-8">
      <div className="mx-auto max-w-container-lg">
        {heading ? <h2 className="text-h2 font-bold">{heading}</h2> : null}
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.id ?? i}
              className="rounded-md border border-border-subtle bg-surface p-6 shadow-xs"
            >
              <div className="flex items-baseline gap-3">
                <span className="text-display font-bold text-accent">{i + 1}</span>
                <h3 className="text-h4 font-semibold">{step.title}</h3>
              </div>
              <p className="mt-3 text-body text-text-secondary">{step.body}</p>
              {step.icon ? <p className="mt-2 text-caption text-text-muted">{step.icon}</p> : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default ProcessSteps
