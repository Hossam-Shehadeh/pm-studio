import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight, FileText, Zap, BarChart3, Download } from "lucide-react"
import { Footer } from "@/components/footer"

export default function HowItWorksPage() {
  const steps = [
    { icon: FileText, title: "Create", desc: "Tell us your project" },
    { icon: Zap, title: "Generate", desc: "AI builds your plan" },
    { icon: BarChart3, title: "Customize", desc: "Edit as needed" },
    { icon: Download, title: "Export", desc: "Download & go" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/10">

      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center space-y-6 mb-20">
          <h1 className="text-6xl md:text-8xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-primary via-chart-1 to-chart-2 bg-clip-text text-transparent">
              How It Works
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Four simple steps to your perfect plan
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 relative">
            {steps.map((step, index) => {
              const Icon = step.icon
              const colors = [
                "from-chart-1 to-chart-5",
                "from-chart-2 to-info",
                "from-chart-3 to-warning",
                "from-chart-4 to-success",
              ]
              return (
                <div key={index} className="relative">
                  <div className="text-center space-y-4">
                    <div className={`size-20 mx-auto rounded-2xl bg-gradient-to-br ${colors[index]} flex items-center justify-center shadow-xl`}>
                      <Icon className="size-10 text-white" />
                    </div>
                    <div>
                      <div className="text-4xl font-black text-muted-foreground/20 mb-2">{String(index + 1).padStart(2, '0')}</div>
                      <h3 className="font-bold text-xl mb-1">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-10 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 mt-24">
          <Link href="/dashboard">
            <Button
              size="lg"
              className="gradient-primary shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-all text-lg px-12 py-7 gap-3"
            >
              Try It Now
              <ArrowRight className="size-5" />
            </Button>
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  )
}

