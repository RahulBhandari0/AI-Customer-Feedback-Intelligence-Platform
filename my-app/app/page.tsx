import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-4">
      <h1 className="text-4xl font-bold">Welcome</h1>
      <div className="flex gap-4">
        <Link 
          href="/sign-up" 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Go to Sign Up Page
        </Link>
        <Link 
          href="/sign-in" 
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Go to Login Page
        </Link>
      </div>
    </main>
  )
}