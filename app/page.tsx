import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { WaitlistForm } from "@/components/waitlist-form"
import { Logo } from "@/components/logo"
import { Camera, Calendar, Shield, Film, Grid3x3, ImageIcon, ArrowRight } from "lucide-react"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LandingClient } from "@/components/landing-client"

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("/app");
  }

  const showGetStarted = process.env.NEXT_PUBLIC_SHOW_GET_STARTED !== 'false';

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--paper)", color: "var(--ink)" }}>
      <header className="fixed top-0 left-0 right-0 p-6 z-50 flex justify-between items-center">
        <Logo width={160} height={32} style={{ color: "var(--ink)" }} />
        <ThemeToggle />
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-4xl mx-auto flex flex-col items-center text-center space-y-12">
        <div className="space-y-6">
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter leading-[0.85]">
            One pic a day. <br />
            <span style={{ color: "var(--moss)" }}>Forever.</span>
          </h1>
          <p className="text-xl md:text-2xl font-medium max-w-xl mx-auto leading-relaxed" style={{ color: "var(--stone)" }}>
            A daily reminder to take one photo and turn it into lasting memories.
          </p>
        </div>

        <div className="w-full max-w-sm">
          <LandingClient showGetStarted={showGetStarted} />
        </div>

        <div className="w-full pt-10">
          <div className="bg-[#111612] border border-[#1a211b] dark:bg-black/20 p-8 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-white">Join the waitlist</h3>
            <WaitlistForm />
          </div>
        </div>

        <div className="pt-4">
          <a href="https://forms.gle/QAYyanTDfNLaP6QQ9" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-medium hover:underline opacity-60">
            Want to help more? Answer the 2-minute survey <ArrowRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 bg-[var(--mist)] bg-opacity-30">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tighter">How it works</h2>
            <p style={{ color: "var(--stone)" }}>A simple habit for a lifetime of memories.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {[
              { icon: <Camera />, title: "We remind you every day", desc: "A gentle daily nudge to capture your moment." },
              { icon: <Calendar />, title: "You take one photo", desc: "Just one. No pressure, no perfection needed." },
              { icon: <Shield />, title: "We store it safely", desc: "Your photos are secure and private, forever." },
              { icon: <Film />, title: "We turn time into stories", desc: "Reels, collages, and yearly videos of your journey." }
            ].map((step, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-2xl bg-[var(--moss)] bg-opacity-20 flex items-center justify-center shrink-0" style={{ color: "var(--moss)" }}>
                  {step.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p style={{ color: "var(--stone)" }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why it works */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-16">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Consistency over perfection. <br /><span style={{ color: "var(--stone)" }}>It just takes 1 minute.</span></h2>
            <p style={{ color: "var(--stone)" }} className="leading-relaxed text-lg">
              Dont worry about taking the perfect shot. Just capture a moment. Over time, these small actions build a profound narrative of your life.
            </p>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Value grows with time. <br /><span style={{ color: "var(--stone)" }}>Forever memories.</span></h2>
            <p style={{ color: "var(--stone)" }} className="leading-relaxed text-lg text-pretty">
              Every day you continue adds weight to your collection. A week becomes a month. A month becomes a year. Years become a life remembered.
            </p>
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="py-24 px-6 bg-[var(--mist)] bg-opacity-30">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tighter">What you get</h2>
            <p style={{ color: "var(--stone)" }}>Everything you need to capture your story.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Grid3x3 />, title: "Daily photo timeline", desc: "See your photos flow chronologically, day by day." },
              { icon: <Film />, title: "Automatic reels & recap", desc: "We create video recaps of your year automatically." },
              { icon: <ImageIcon />, title: "Collages & prints", desc: "Turn your memories into physical keepsakes." }
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-[2rem] border border-[var(--mist)] space-y-4 bg-[var(--paper)]">
                <div className="w-12 h-12 rounded-2xl bg-[var(--moss)] bg-opacity-20 flex items-center justify-center" style={{ color: "var(--moss)" }}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-sm" style={{ color: "var(--stone)" }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="py-24 px-6">
        <div className="max-w-xl mx-auto text-center space-y-12">
          <h2 className="text-4xl font-bold tracking-tighter">Privacy & trust</h2>
          <div className="grid gap-6">
            {[
              "Your photos are private unless you share them.",
              "You own your memories. Export or delete anytime.",
              "This is not a social network. No likes or feeds.",
              "Not for attention. For reflection."
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-center justify-center text-lg font-medium" style={{ color: "var(--stone)" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--moss)]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-[var(--mist)]">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <Logo width={120} height={24} style={{ opacity: 0.5 }} />
          <div className="text-[var(--ash)] text-xs font-medium tracking-widest uppercase">
            © {new Date().getFullYear()} 1PICDAY.XYZ
          </div>
        </div>
      </footer>
    </main>
  )
}
