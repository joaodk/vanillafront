import { redirect } from 'react-router'
import { getAuth } from '@clerk/react-router/ssr.server'
import { createClerkClient } from '@clerk/react-router/api.server'
import type { Route } from '../+types/root'

export async function loader(args: Route.LoaderArgs) {
  // Use `getAuth()` to get the user's ID
  const { userId } = await getAuth(args)

  // Protect the route by checking if the user is signed in
  if (!userId) {
    return redirect('/sign-in?redirect_url=' + args.request.url)
  }

  // Instantiate the Backend SDK and get the user's full `Backend User` object
  const user = await createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY }).users.getUser(
    userId,
  )

  return {
    user: JSON.stringify(user),
  }
}

export default function Profile({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <h1>Profile Data</h1>
      <pre>
        <code>{JSON.stringify(loaderData, null, 2)}</code>
      </pre>
    </div>
  )
}
