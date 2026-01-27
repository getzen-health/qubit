'use client'

import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubmitted(true)
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let particles: Particle[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      opacity: number
      rotation: number
      rotationSpeed: number
      shape: number

      constructor() {
        this.x = Math.random() * canvas!.width
        this.y = Math.random() * canvas!.height
        this.size = Math.random() * 60 + 20
        this.speedX = (Math.random() - 0.5) * 0.3
        this.speedY = (Math.random() - 0.5) * 0.3
        this.opacity = Math.random() * 0.08 + 0.02
        this.rotation = Math.random() * Math.PI * 2
        this.rotationSpeed = (Math.random() - 0.5) * 0.005
        this.shape = Math.floor(Math.random() * 4)
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY
        this.rotation += this.rotationSpeed

        if (this.x < -this.size) this.x = canvas!.width + this.size
        if (this.x > canvas!.width + this.size) this.x = -this.size
        if (this.y < -this.size) this.y = canvas!.height + this.size
        if (this.y > canvas!.height + this.size) this.y = -this.size
      }

      draw() {
        ctx!.save()
        ctx!.translate(this.x, this.y)
        ctx!.rotate(this.rotation)
        ctx!.strokeStyle = `rgba(255, 255, 255, ${this.opacity})`
        ctx!.lineWidth = 1

        switch (this.shape) {
          case 0: // Triangle
            ctx!.beginPath()
            ctx!.moveTo(0, -this.size / 2)
            ctx!.lineTo(-this.size / 2, this.size / 2)
            ctx!.lineTo(this.size / 2, this.size / 2)
            ctx!.closePath()
            ctx!.stroke()
            break
          case 1: // Square
            ctx!.strokeRect(-this.size / 2, -this.size / 2, this.size, this.size)
            break
          case 2: // Hexagon
            ctx!.beginPath()
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI / 3) * i
              const x = (this.size / 2) * Math.cos(angle)
              const y = (this.size / 2) * Math.sin(angle)
              if (i === 0) ctx!.moveTo(x, y)
              else ctx!.lineTo(x, y)
            }
            ctx!.closePath()
            ctx!.stroke()
            break
          case 3: // Circle
            ctx!.beginPath()
            ctx!.arc(0, 0, this.size / 2, 0, Math.PI * 2)
            ctx!.stroke()
            break
        }

        ctx!.restore()
      }
    }

    const init = () => {
      particles = []
      const count = Math.floor((canvas.width * canvas.height) / 40000)
      for (let i = 0; i < Math.min(count, 30); i++) {
        particles.push(new Particle())
      }
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        p.update()
        p.draw()
      })

      // Draw connecting lines
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 200) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.03 * (1 - dist / 200)})`
            ctx.lineWidth = 0.5
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        })
      })

      animationId = requestAnimationFrame(animate)
    }

    resize()
    init()
    animate()

    window.addEventListener('resize', () => {
      resize()
      init()
    })

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400&display=swap');

        html, body {
          height: 100%;
          overflow: hidden;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        .dot {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>

      {/* Animated background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 bg-black"
      />

      <main className="relative z-10 h-screen text-white font-[Inter] flex flex-col items-center justify-center px-6">

        {/* Logo */}
        <div className="mb-16">
          <h1 className="text-4xl sm:text-6xl font-extralight tracking-[-0.03em]">
            KQuarks
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-zinc-500 font-extralight text-center mb-12 max-w-sm text-sm sm:text-base">
          Health tracking that respects your privacy.
        </p>

        {/* Email form */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="w-full max-w-xs">
            <div className="flex flex-col gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full px-5 py-3 bg-black/50 backdrop-blur-sm border border-zinc-800 rounded-full text-sm font-extralight text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              />
              <button
                type="submit"
                className="w-full px-5 py-3 bg-white text-black text-sm font-light tracking-wide rounded-full hover:bg-zinc-200 transition-colors"
              >
                Request Access
              </button>
            </div>
          </form>
        ) : (
          <p className="text-zinc-500 font-extralight text-sm">
            We&apos;ll be in touch.
          </p>
        )}

        {/* Status */}
        <div className="absolute bottom-8 flex items-center gap-2 text-xs text-zinc-600 font-extralight tracking-wide">
          <span className="dot w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          Building
        </div>

      </main>
    </>
  )
}
