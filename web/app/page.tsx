const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'KQuarks',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'iOS, Web',
  description: 'Sync your Apple Health data to the cloud, visualize trends, and get AI-powered insights to optimize your wellness journey.',
  url: 'https://kquarks.com',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-purple-600 mb-4">
            KQuarks
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            AI-powered health tracking and insights
          </p>
          <p className="text-md text-gray-500 dark:text-gray-500 mb-8 max-w-md mx-auto">
            Sync your Apple Health data, visualize trends, and get personalized insights to optimize your wellness.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/dashboard"
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Go to Dashboard
            </a>
            <a
              href="/login"
              className="px-6 py-3 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950 transition"
            >
              Sign In
            </a>
          </div>
        </div>
      </main>
    </>
  )
}
