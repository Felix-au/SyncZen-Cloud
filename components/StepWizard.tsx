'use client'

interface Step {
  id: string
  label: string
}

interface StepWizardProps {
  steps: Step[]
  currentStep: string
}

export function StepWizard({ steps, currentStep }: StepWizardProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStep)

  return (
    <div className="step-bar">
      {steps.map((step, i) => {
        const isDone   = i < currentIndex
        const isActive = i === currentIndex

        return (
          <div key={step.id} className="step-item">
            <div className={`step-dot ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
              {isDone ? '✓' : i + 1}
            </div>
            <span className={`step-label ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <div className={`step-connector ${isDone ? 'done' : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
