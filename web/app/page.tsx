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
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    // 3D Icosahedron vertices
    const phi = (1 + Math.sqrt(5)) / 2
    const vertices = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ]

    const edges = [
      [0, 1], [0, 5], [0, 7], [0, 10], [0, 11],
      [1, 5], [1, 7], [1, 8], [1, 9],
      [2, 3], [2, 4], [2, 6], [2, 10], [2, 11],
      [3, 4], [3, 6], [3, 8], [3, 9],
      [4, 5], [4, 9], [4, 11],
      [5, 9], [5, 11],
      [6, 7], [6, 8], [6, 10],
      [7, 8], [7, 10],
      [8, 9], [10, 11]
    ]

    const project = (x: number, y: number, z: number, scale: number, cx: number, cy: number) => {
      const perspective = 4
      const factor = perspective / (perspective + z)
      return {
        x: cx + x * scale * factor,
        y: cy + y * scale * factor,
        z: z
      }
    }

    const rotateX = (x: number, y: number, z: number, angle: number) => {
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      return [x, y * cos - z * sin, y * sin + z * cos]
    }

    const rotateY = (x: number, y: number, z: number, angle: number) => {
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      return [x * cos + z * sin, y, -x * sin + z * cos]
    }

    const rotateZ = (x: number, y: number, z: number, angle: number) => {
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      return [x * cos - y * sin, x * sin + y * cos, z]
    }

    const animate = () => {
      time += 0.003

      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const cx = canvas.width / 2
      const cy = canvas.height / 2
      const scale = Math.min(canvas.width, canvas.height) * 0.15

      // Transform vertices
      const transformed = vertices.map(([x, y, z]) => {
        let [rx, ry, rz] = rotateX(x, y, z, time * 0.7)
        ;[rx, ry, rz] = rotateY(rx, ry, rz, time)
        ;[rx, ry, rz] = rotateZ(rx, ry, rz, time * 0.5)
        return project(rx, ry, rz, scale, cx, cy)
      })

      // Draw edges with glow
      edges.forEach(([i, j]) => {
        const p1 = transformed[i]
        const p2 = transformed[j]

        const avgZ = (p1.z + p2.z) / 2
        const opacity = 0.1 + (avgZ + 2) * 0.15

        // Glow layer
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.strokeStyle = `rgba(100, 200, 255, ${opacity * 0.3})`
        ctx.lineWidth = 8
        ctx.lineCap = 'round'
        ctx.stroke()

        // Core line
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.strokeStyle = `rgba(150, 220, 255, ${opacity})`
        ctx.lineWidth = 1.5
        ctx.stroke()
      })

      // Draw vertices
      transformed.forEach((p) => {
        const opacity = 0.3 + (p.z + 2) * 0.2

        // Outer glow
        ctx.beginPath()
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(100, 200, 255, ${opacity * 0.2})`
        ctx.fill()

        // Core
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200, 240, 255, ${opacity})`
        ctx.fill()
      })

      // Outer rings
      for (let i = 0; i < 3; i++) {
        const ringTime = time + i * 2
        const ringScale = scale * (1.8 + Math.sin(ringTime) * 0.3 + i * 0.5)
        const ringOpacity = 0.03 - i * 0.008

        ctx.beginPath()
        ctx.arc(cx, cy, ringScale, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(100, 200, 255, ${ringOpacity})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      animationId = requestAnimationFrame(animate)
    }

    resize()
    animate()

    window.addEventListener('resize', resize)

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

      <canvas
        ref={canvasRef}
        className="fixed inset-0 bg-black"
      />

      <main className="relative z-10 h-screen text-white font-[Inter] flex flex-col items-center justify-center px-6">

        <div className="mb-16">
          <h1 className="text-4xl sm:text-6xl font-extralight tracking-[-0.03em]">
            KQuarks
          </h1>
        </div>

        <p className="text-zinc-500 font-extralight text-center mb-12 max-w-sm text-sm sm:text-base">
          Health tracking that respects your privacy.
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="w-full max-w-xs">
            <div className="flex flex-col gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full px-5 py-3 bg-black/60 backdrop-blur-md border border-zinc-800 rounded-full text-sm font-extralight text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-900 transition-colors"
              />
              <button
                type="submit"
                className="w-full px-5 py-3 bg-white text-black text-sm font-light tracking-wide rounded-full hover:bg-cyan-100 transition-colors"
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

        <div className="absolute bottom-8 flex items-center gap-2 text-xs text-zinc-600 font-extralight tracking-wide">
          <span className="dot w-1.5 h-1.5 bg-cyan-500 rounded-full" />
          Building
        </div>

      </main>
    </>
  )
}
