import { Check, X } from 'lucide-react'

const confettiColors = ['#fcb830', '#f26421', '#e31859', '#93317b', '#ee4080', '#612070']

export function AnswerFeedback({ result }: { result: 'correct' | 'wrong' | null }) {
  if (!result) return null

  if (result === 'wrong') {
    return (
      <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-[#7f1725]/88 text-white backdrop-blur-sm">
        <div className="answer-wrong text-center">
          <span className="mx-auto grid h-24 w-24 place-items-center rounded-full border-4 border-white/60 bg-white/15"><X className="h-14 w-14" strokeWidth={3} /></span>
          <p className="mt-5 text-4xl font-black uppercase tracking-tight">Not quite!</p>
          <p className="mt-1 font-semibold text-white/75">The correct answer is highlighted.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center overflow-hidden bg-[#16764c]/90 text-white backdrop-blur-sm">
      {Array.from({ length: 24 }, (_, index) => (
        <span
          key={index}
          className="answer-confetti"
          style={{
            left: `${4 + (index * 17) % 92}%`,
            backgroundColor: confettiColors[index % confettiColors.length],
            animationDelay: `${(index % 8) * 55}ms`,
            transform: `rotate(${index * 31}deg)`,
          }}
        />
      ))}
      <div className="answer-celebration relative z-10 text-center">
        <span className="mx-auto grid h-28 w-28 place-items-center rounded-full border-4 border-white/70 bg-white/20 shadow-2xl"><Check className="h-16 w-16" strokeWidth={3} /></span>
        <p className="mt-5 text-5xl font-black uppercase tracking-tight">Correct!</p>
        <p className="mt-1 font-semibold text-white/80">Brilliant answer!</p>
      </div>
    </div>
  )
}
