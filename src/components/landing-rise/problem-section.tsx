"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, DollarSign, Lock, ShieldAlert, ChevronDown } from "lucide-react"

interface Problem {
  icon: React.ElementType
  title: string
  description: string
  solution: string
}

export function ProblemsSection() {
  const [expandedCard, setExpandedCard] = useState<number | null>(null)

  const problems: Problem[] = [
    {
      icon: Clock,
      title: "Slow Execution",
      description:
        "Traditional exchanges often suffer from delayed order execution, causing missed opportunities and slippage during volatile market conditions.",
      solution:
        "Our high-performance matching engine executes trades in milliseconds, ensuring you never miss an opportunity due to technical limitations.",
    },
    {
      icon: ShieldAlert,
      title: "Security Risks",
      description:
        "Many platforms have experienced breaches, putting user funds at risk and eroding trust in the trading ecosystem.",
      solution:
        "Multi-layer security with cold storage, regular security audits, and insurance coverage for digital assets provides peace of mind.",
    },
    {
      icon: DollarSign,
      title: "High Fees",
      description:
        "Hidden fees and high transaction costs eat into trading profits, making it difficult to maintain profitability, especially for frequent traders.",
      solution:
        "Transparent fee structure with some of the lowest rates in the industry and volume-based discounts for active traders.",
    },
    {
      icon: Lock,
      title: "KYC Barriers",
      description:
        "Lengthy verification processes delay account setup and trading, creating friction and preventing immediate market participation.",
      solution:
        "No KYC required for basic trading with progressive verification only when needed, allowing instant access to markets.",
    },
  ]

  const toggleCard = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index)
  }

  return (
    <section className="py-20 relative z-10 overflow-hidden bg-gradient-to-b from-black to-[#050510]">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#b979f0]/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#b979f0]/5 rounded-full blur-[100px]" />

      <div className="max-w-screen-xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
            Solving{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b979f0] to-[#4c30ad]">
              Real Problems
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            We&apos;ve addressed the common issues that plague traditional trading platforms
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              className={`
                relative overflow-hidden rounded-xl backdrop-blur-sm
                ${
                  expandedCard === index
                    ? "bg-gradient-to-br from-[#b979f0]/20 to-[#4c30ad]/10 border border-[#b979f0]/30"
                    : "bg-[#0a0a0a]/80 border border-[#b979f0]/20 hover:border-[#b979f0]/40"
                }
                transition-all duration-300 h-full
              `}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              {/* Card content */}
              <div
                className={`p-6 cursor-pointer h-full flex flex-col ${expandedCard === index ? "" : "hover:bg-[#b979f0]/5"}`}
                onClick={() => toggleCard(index)}
              >
                {/* Card header */}
                <div className="flex items-center mb-4">
                  <div
                    className={`p-3 rounded-lg ${expandedCard === index ? "bg-[#b979f0]/40" : "bg-[#b979f0]/20"} mr-4`}
                  >
                    {React.createElement(problem.icon, {
                      className: `h-6 w-6 ${expandedCard === index ? "text-[#b979f0]" : "text-[#b979f0]/70"}`,
                    })}
                  </div>
                  <h3 className={`font-bold text-lg ${expandedCard === index ? "text-white" : "text-gray-200"}`}>
                    {problem.title}
                  </h3>
                  <ChevronDown
                    className={`ml-auto h-5 w-5 text-[#b979f0] transition-transform duration-300 ${expandedCard === index ? "rotate-180" : ""}`}
                  />
                </div>

                {/* Problem description */}
                <p className="text-gray-400 mb-4">{problem.description}</p>

                {/* Solution section - only visible when expanded */}
                <AnimatePresence>
                  {expandedCard === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4"
                    >
                      <div className="border-t border-[#b979f0]/30 pt-4 mt-auto">
                        <div className="flex items-center mb-2">
                          <div className="w-2 h-2 rounded-full bg-[#b979f0]/40 mr-2"></div>
                          <p className="text-[#b979f0] font-medium">Our solution:</p>
                        </div>
                        <p className="text-white">{problem.solution}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Decorative corner accent */}
              {expandedCard === index && (
                <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden">
                  <div className="absolute transform rotate-45 bg-[#b979f0]/20 w-8 h-32 -right-4 -top-16"></div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
