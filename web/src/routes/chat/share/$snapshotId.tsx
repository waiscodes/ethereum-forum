import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/chat/share/$snapshotId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/chat/share/$snapshotId"!</div>
}
