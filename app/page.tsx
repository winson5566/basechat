"use client";

import { Inter_Tight } from "next/font/google";
import Image from "next/image";
import Link from "next/link";

import FAQ from "@/components/marketing/faq";
import ParallaxText from "@/components/marketing/parallax-text";
import RotatingWords from "@/components/marketing/rotating-words";
import { Button } from "@/components/ui/button";

const interTight = Inter_Tight({ subsets: ["latin"], weight: ["600", "700"], display: "swap" });

export default function LandingPage() {
  return (
    <main className="relative min-h-screen w-full bg-[#0b0b0e] text-white overflow-hidden">
      {/* Background effects: subtle grid + aurora + vignette */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid mask-fade" />
        <div className="absolute inset-0 aurora" aria-hidden>
          <span className="aurora-blob left-[5%] top-[10%] bg-gradient-to-tr from-[#22d3ee] via-[#60a5fa] to-[#a78bfa]" />
          <span className="aurora-blob right-[0%] top-[0%] bg-gradient-to-br from-[#f472b6] via-[#a78bfa] to-[#22d3ee]" />
          <span className="aurora-blob left-[30%] bottom-[-10%] bg-gradient-to-tr from-[#34d399] via-[#22d3ee] to-[#60a5fa]" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),rgba(0,0,0,0)_60%)]" />
        <div className="absolute inset-0 bg-noise opacity-[0.04]" />
      </div>
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-black/30 border-b border-white/10">
        <div className="mx-auto w-full max-w-7xl px-6 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="SmartChat" width={32} height={32} />
            <span
              className={`${interTight.className} hidden sm:inline text-white/90 text-xl md:text-3xl font-semibold tracking-wide bg-clip-text`}
            >
              SmartChat
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-white/70 hover:text-white">
              Sign in
            </Link>
            <Link href="/sign-up">
              <Button className="relative overflow-hidden rounded-2xl bg-white text-black hover:bg-white/90 px-5 py-2 btn-shine">
                START FOR FREE
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content - full screen stacked sections */}
      <div className="relative mx-auto w-full max-w-7xl px-6 md:px-8 pb-24 z-0">
        {/* Section 1 */}
        <section className="py-16 md:py-24 md:grid md:grid-cols-12 items-center gap-10 md:gap-16">
          <div className="md:col-span-6 sticky top-24 md:top-28">
            <h1 className="text-4xl md:text-6xl font-semibold leading-tight tracking-tight">
              <span className="text-white/90">The world&apos;s</span>
              <br />
              <span className="ml-1">
                <RotatingWords
                  words={["most connected", "easiest-to-use", "fastest-to-deploy"]}
                  className="relative inline-block h-14 md:h-16 align-baseline whitespace-nowrap"
                />
              </span>
              <br />
              <span className="gradient-text">AI Customer Service & Assistants</span>
            </h1>
            <p className="mt-6 text-white/70 text-lg md:text-xl max-w-xl">
              Empower your business with 24/7 intelligent conversations.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Link href="/sign-up">
                <Button className="relative overflow-hidden rounded-xl bg-white text-black hover:bg-white/90 px-6 py-6 text-base font-semibold btn-shine">
                  START 7-DAY FREE TRIAL
                </Button>
              </Link>
            </div>
            <div className="mt-10 text-white/50 text-sm">Works with leading LLMs</div>
            <div className="mt-4 flex items-center gap-6 opacity-80">
              <Image src="/openai.svg" alt="OpenAI" width={59} height={15} className="invert opacity-60" />
              <Image src="/anthropic.svg" alt="Anthropic" width={70} height={15} className="invert opacity-60" />
              <Image src="/gemini.svg" alt="Google Gemini" width={63} height={15} className="invert opacity-60" />
              <Image src="/meta.svg" alt="Meta" width={56} height={15} className="invert opacity-60" />
              <Image src="/deepseek.svg" alt="DeepSeek" width={64} height={15} className="invert opacity-60" />
              <Image src="/moonshot.svg" alt="Moonshot" width={64} height={15} className="invert opacity-60" />
            </div>
          </div>
          <div className="md:col-span-6 w-full">
            <div className="relative group w-full aspect-[4/3] md:max-w-[960px] md:ml-auto">
              <div className="absolute -inset-6 rounded-[32px] bg-gradient-to-tr from-[#22d3ee]/25 via-[#60a5fa]/25 to-[#a78bfa]/25 blur-2xl opacity-70 group-hover:opacity-90 transition-opacity" />
              <div className="absolute inset-0 rounded-[24px] border border-white/10 bg-black/30 backdrop-blur-sm" />
              <Image
                src="/index0.png"
                alt="SmartChat preview"
                fill
                priority
                loading="eager"
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="relative rounded-[24px] object-contain object-left shadow-2xl shadow-black/40"
              />
            </div>
          </div>
        </section>

        {/* Section 2 — One-line install */}
        <section className="py-16 md:py-24 md:grid md:grid-cols-12 items-center gap-10 md:gap-16">
          {/* Left: image */}
          <div className="md:col-span-7 w-full">
            <div className="relative w-full aspect-[16/10] md:max-w-[980px] rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
              <Image
                src="/index10.png"
                alt="Embed SmartChat with one line"
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-contain object-center"
                priority
              />
            </div>
          </div>
          {/* Right: copy */}
          <div className="md:col-span-5">
            <h2 className="text-4xl md:text-5xl font-semibold leading-tight gradient-text">
              Embed AI Support in Minutes.
            </h2>
            <p className="mt-6 text-white/70 text-lg max-w-2xl">
              Drop a single script into your site to add SmartChat—fast, accurate, 24/7 assistance powered by your
              knowledge base.
            </p>
            <p className="mt-3 text-white/70 text-lg max-w-2xl">
              Prefer a no‑code option? Install our Chrome extension to turn SmartChat into your on‑page AI assistant
              anywhere you work.
            </p>
          </div>
        </section>

        {/* Section 3 - full image banner */}
        <section className="relative">
          <div className="absolute inset-0">
            <Image src="/index2.png" alt="Connectors bg" fill sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-black/40" />
          </div>
          <div className="relative py-32 md:py-48 flex items-center justify-center min-h-[600px] md:min-h-[760px]">
            <ParallaxText speed={0.01} baseOffset={-24}>
              <h3 className="text-center text-3xl md:text-5xl font-semibold max-w-4xl">
                Seamlessly connect data to your application in minutes.
              </h3>
            </ParallaxText>
          </div>
        </section>

        {/* Section 3 */}
        <section className="py-16 md:py-24 flex flex-col md:flex-row items-center gap-10 md:gap-16">
          <div className="flex-1 w-full order-1 md:order-none">
            <div className="relative w-full aspect-[4/3] rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
              <Image
                src="/index8.png"
                alt="Audio and video chat"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-4xl md:text-5xl font-semibold leading-tight gradient-text">
              Chat with your audio & video files
            </h2>
            <p className="mt-6 text-white/70 text-lg max-w-2xl">
              Smart Chat now supports audio and video. Drop in your team’s recordings: meetings, interviews, training
              videos, or your entire content library, and instantly chat with them. Ask questions, get timestamped
              answers, and stream the exact moment something was said or seen.
            </p>
            <p className="mt-4 text-white/70 text-lg max-w-2xl">
              No more scrubbing through hours of audio or video footage. Just ask, and Smart Chat finds it for you.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="py-16 md:py-24 flex flex-col md:flex-row items-center gap-10 md:gap-16">
          <div className="flex-1">
            <h4 className="text-4xl md:text-5xl font-semibold gradient-text">
              Automatic syncing keeps data up to date
            </h4>
            <p className="mt-6 text-white/70 text-lg max-w-2xl">
              Automatic syncing keeps your RAG pipeline up to date, ensuring your assistant delivers accurate and
              reliable information around the clock.
            </p>
          </div>
          <div className="flex-1 w-full">
            <div className="relative w-full aspect-[4/3] bg-transparent rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
              <Image
                src="/index3.svg"
                alt="Sync UI"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-contain p-6"
              />
            </div>
          </div>
        </section>

        {/* Section 6 */}
        <section className="py-16 md:py-24 flex flex-col md:flex-row items-center gap-10 md:gap-16">
          <div className="flex-1 w-full order-1 md:order-none">
            <div className="relative w-full aspect-[4/3] bg-transparent rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
              <Image
                src="/index4.svg"
                alt="Integrations"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-contain p-6"
              />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-4xl md:text-5xl font-semibold gradient-text">Growing library of native integrations</h4>
            <p className="mt-6 text-white/70 text-lg max-w-2xl">
              Purpose-built for AI applications, Smart Chat’s growing list of native connectors allow seamless
              integration with the most popular data sources.
            </p>
          </div>
        </section>

        {/* Section 5 - AV RAG with video */}
        <section className="py-16 md:py-24 grid md:grid-cols-12 gap-10 md:gap-16 items-center">
          <div className="md:col-span-4">
            <h3 className="text-4xl md:text-5xl font-semibold gradient-text">Native Audio & Video RAG.</h3>
            <p className="mt-6 text-white/70 text-lg">
              SmartChat supports ingest and retrieval from spoken and visual content. Upload recordings, ask questions,
              and get timestamped answers with streamable playback—no pipelines or transcription tooling required.
            </p>
          </div>
          <div className="md:col-span-8">
            <div className="relative">
              <div className="overflow-hidden bg-black/70 rounded-3xl ring-1 ring-white/10 aspect-video">
                <video className="w-full h-full object-cover" controls muted playsInline autoPlay loop>
                  <source
                    src="https://cdn.prod.website-files.com/66834c6ee9ee484e8e47a9af%2F684096fe5f9d32dd359d6d4c_av_turtle-transcode.mp4"
                    type="video/mp4"
                  />
                  <source
                    src="https://cdn.prod.website-files.com/66834c6ee9ee484e8e47a9af%2F684096fe5f9d32dd359d6d4c_av_turtle-transcode.webm"
                    type="video/webm"
                  />
                </video>
              </div>
              {/* Floating transcript card outside the overflow container */}
              <div className="hidden md:block absolute -left-16 -bottom-16 z-10 w-[280px] p-5 rounded-2xl bg-[#151518]/95 border border-white/10 text-white/80 leading-relaxed text-sm md:text-base shadow-2xl shadow-black/30 backdrop-blur-sm whitespace-normal break-words">
                <span className="text-white/50 mr-2">0:00 – 0:30</span>
                This video shows a<span className="mx-1 text-[#60A5FA]">sea_turtle</span>
                swimming smoothly through clear,
                <span className="mx-1 text-[#F472B6]">sunlit_water</span>
                above a<span className="mx-1 text-[#A78BFA]">rocky_sandy_seabed</span>. The audio is very calm,
                featuring the gentle sounds of
                <span className="mx-1 text-[#34D399]">water_movement</span>
                and subtle
                <span className="mx-1 text-[#F59E0B]">ambient_underwater_noises</span>, creating an immersive
                <span className="mx-1 text-[#86EFAC]">aquatic_scene</span>.
              </div>
            </div>
          </div>
        </section>

        {/* Section 6 - FAQ */}
        <section className="py-16 md:py-24">
          <h3 className="text-left text-3xl md:text-5xl font-semibold mb-8">Questions? Answers.</h3>
          <FAQ
            items={[
              {
                q: "What is SmartChat?",
                a: "SmartChat is an all-in-one AI customer service and assistant platform. It connects to your website, CRM, and internal knowledge bases to deliver instant, accurate answers — powered by advanced Retrieval-Augmented Generation (RAG) technology.",
              },
              {
                q: "Why should I use SmartChat?",
                a: "Because SmartChat gives your customers the right answers instantly — using your verified content. No coding, no model training, no maintenance. Just connect your data, and go live in minutes.",
              },
              {
                q: "Who is SmartChat for?",
                a: "SmartChat is built for teams and businesses that want faster, smarter, and more scalable customer interactions — from startups to enterprises across support, sales, education, and operations.",
              },
              {
                q: "How does SmartChat work?",
                a: "SmartChat automatically syncs and indexes all your knowledge sources — including uploaded files (PDF, Word, Excel, PowerPoint, audio, and video), as well as connected platforms like Drive, Notion, Zendesk, and Intercom. It can even crawl your company website to build a unified semantic index. When users ask questions, SmartChat retrieves the most relevant information and generates accurate, verifiable answers for full transparency and trust.",
              },
              {
                q: "How can I add SmartChat to my website?",
                a: "You can embed SmartChat with just one line of code. Once added, a customizable chat bubble instantly appears on the bottom-right of your site, connecting visitors to your AI assistant — no backend setup required.",
              },
              {
                q: "Can I use SmartChat outside my website?",
                a: "Yes! SmartChat also provides a Chrome extension that lets you access your personal AI assistant anywhere on the web — whether you’re reading documentation, replying to emails, or managing dashboards. Your assistant is always one click away.",
              },
              {
                q: "What makes SmartChat unique?",
                a: "SmartChat combines enterprise-grade accuracy with consumer-level simplicity. It supports multiple LLMs, understands text, audio, and video, and can be embedded on your website or integrated via browser extension in just minutes — fast to deploy, easy to use, and ready to scale.",
              },
              {
                q: "How does SmartChat keep my data secure?",
                a: "Every workspace is fully isolated. All data is encrypted in transit and at rest, authenticated with Better Auth, and protected with role-based access controls. Nothing leaves your environment without your consent.",
              },
              {
                q: "How much does SmartChat cost?",
                a: "Start free with core features. Paid plans unlock higher message limits, more data connectors, analytics, and enterprise options like SLAs, team management, and admin controls.",
              },
            ]}
          />
        </section>
      </div>
      {/* Footer */}
      <footer className="w-full border-t border-white/10 py-6 text-center text-white/70">
        Powered by{" "}
        <a href="https://winsonwu.com/?utm_source=smart-chat" target="_blank" className="underline hover:text-white">
          @WinsonWu
        </a>
      </footer>
    </main>
  );
}
