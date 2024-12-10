import React from 'react'
import Link from 'next/link'
import NextTopLoader from 'nextjs-toploader'
import Navbar from '@/app/navbar/navbar'

export default function HomePage() {
  return (
    <>
      <NextTopLoader
        color="#4ade80"
        showSpinner={false}
        height={3}
      />
      <div>
        <Navbar />
        <div className="min-h-screen bg-gray-50">
          <div className="relative overflow-hidden pt-24 pb-12 lg:pt-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="lg:grid lg:grid-cols-2 lg:gap-16">
                <div className="mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 lg:px-0 lg:py-20">
                  <div className="text-center lg:text-left">
                    <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
                      ESG
                    </h1>
                    <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                      Empower your organization&apos;s sustainability journey with data-driven insights and comprehensive ESG reporting.
                    </p>
                    <div className="mt-10 sm:flex sm:justify-center lg:justify-start">
                      <div className="rounded-md shadow">
                        <Link 
                          href="/signup" 
                          className="flex w-full items-center justify-center rounded-md border border-transparent bg-green-600 px-8 py-3 text-base font-medium text-white hover:bg-green-700 md:py-4 md:px-10 md:text-lg"
                        >
                          Get Started
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
