import React from 'react'
import Link from 'next/link'
import { MdBarChart, MdPublic, MdLightbulb } from 'react-icons/md'
import NextTopLoader from 'nextjs-toploader'
import Navbar from '@/app/navbar/navbar'

const features = [
  {
    name: 'Comprehensive Analytics',
    description: 'Deep insights into your sustainability metrics and performance.',
    icon: MdBarChart
  },
  {
    name: 'Global Impact Tracking',
    description: 'Monitor your environmental and social impact worldwide.',
    icon: MdPublic,
  },
  {
    name: 'Innovation Insights',
    description: 'Stay ahead with cutting-edge sustainability strategies.',
    icon: MdLightbulb,
  }
]

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
                      ESG Insights
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
                      <div className="mt-3 sm:mt-0 sm:ml-3">
                        <Link 
                          href="/projects" 
                          className="flex w-full items-center justify-center rounded-md border border-transparent bg-green-100 px-8 py-3 text-base font-medium text-green-700 hover:bg-green-200 md:py-4 md:px-10 md:text-lg"
                        >
                          View Projects
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="lg:text-center">
                <h2 className="text-base font-semibold uppercase tracking-wide text-green-600">
                  Sustainability Made Simple
                </h2>
                <p className="mt-2 text-3xl font-extrabold leading-8 tracking-tight text-gray-900 sm:text-4xl">
                  Transforming ESG Reporting
                </p>
              </div>

              <div className="mt-10">
                <dl className="space-y-10 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10 md:space-y-0">
                  {features.map((feature) => (
                    <div key={feature.name} className="relative">
                      <dt>
                        <div className="absolute flex h-12 w-12 items-center justify-center rounded-md bg-green-500 text-white">
                          <feature.icon className="h-6 w-6" aria-hidden="true" />
                        </div>
                        <p className="ml-16 text-lg font-medium leading-6 text-gray-900">
                          {feature.name}
                        </p>
                      </dt>
                      <dd className="mt-2 ml-16 text-base text-gray-500">
                        {feature.description}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
