import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/daily-plan/')({
  component: DailyPlan,
})

function DailyPlan() {
  return <div>Hello "/daily-plan/"!</div>
}
