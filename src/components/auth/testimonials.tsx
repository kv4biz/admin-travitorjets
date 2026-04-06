"use client"

import { useEffect, useState } from "react"

const testimonials = [
  {
    quote: "TraviatorJets has transformed how we manage our private aviation operations. The admin platform is intuitive and powerful.",
    author: "Sarah Johnson",
    role: "Operations Manager",
  },
  {
    quote: "The efficiency gains from using this platform are remarkable. We can handle twice the volume with the same team.",
    author: "Michael Chen",
    role: "Fleet Coordinator",
  },
  {
    quote: "Best-in-class admin tools for private aviation. The request management system alone is worth it.",
    author: "David Martinez",
    role: "Senior Manager",
  },
]

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const current = testimonials[currentIndex]

  return (
    <div className="relative z-10 flex h-full items-end p-8 lg:p-12">
      <div className="w-full max-w-2xl">
        <blockquote className="space-y-4">
          <p className="text-lg text-foreground/90 lg:text-xl">
            &ldquo;{current.quote}&rdquo;
          </p>
          <footer className="text-sm text-foreground/70">
            <strong className="font-semibold">{current.author}</strong>
            <span className="mx-2">·</span>
            <span>{current.role}</span>
          </footer>
        </blockquote>

        <div className="mt-6 flex gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1 w-8 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-foreground/90"
                  : "bg-foreground/30 hover:bg-foreground/50"
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
