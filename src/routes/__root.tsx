import { Outlet, createRootRoute } from '@tanstack/react-router'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import '../styles.css'

const convexUrl = (import.meta.env.VITE_CONVEX_URL as string) || 'https://honorable-raven-384.eu-west-1.convex.cloud'
const convex = new ConvexReactClient(convexUrl)

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <ConvexProvider client={convex}>
      <Outlet />
    </ConvexProvider>
  )
}
