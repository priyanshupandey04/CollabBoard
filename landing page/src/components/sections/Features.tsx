import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import {
  Palette,
  Square,
  Circle,
  PenTool,
  Type,
  StickyNote,
  Users,
  Cloud,
  Zap,
  Share2,
  Download,
  Lock
} from "lucide-react"

const features = [
  {
    icon: PenTool,
    title: "Freehand Drawing",
    description: "Express your ideas naturally with our advanced pen tool and pressure sensitivity.",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: Square,
    title: "Shape Tools",
    description: "Perfect rectangles, squares, and custom shapes with precision and style.",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: Circle,
    title: "Circle & Ellipse",
    description: "Create perfect circles and ellipses for diagrams, flowcharts, and designs.",
    gradient: "from-green-500 to-emerald-500"
  },
  {
    icon: Type,
    title: "Text Editor",
    description: "Rich text editing with multiple fonts, sizes, and formatting options.",
    gradient: "from-orange-500 to-red-500"
  },
  {
    icon: StickyNote,
    title: "Sticky Notes",
    description: "Add colorful sticky notes for brainstorming and organizing thoughts.",
    gradient: "from-yellow-500 to-amber-500"
  },
  {
    icon: Users,
    title: "Real-time Collaboration",
    description: "Work together seamlessly with live cursors and instant updates.",
    gradient: "from-indigo-500 to-blue-500"
  },
  {
    icon: Cloud,
    title: "Cloud Sync",
    description: "Access your work anywhere with automatic cloud synchronization.",
    gradient: "from-teal-500 to-green-500"
  },
  {
    icon: Share2,
    title: "Easy Sharing",
    description: "Share boards with teams or clients with customizable permissions.",
    gradient: "from-pink-500 to-rose-500"
  },
  {
    icon: Download,
    title: "Export Options",
    description: "Export your creations in multiple formats including PNG, SVG, and PDF.",
    gradient: "from-violet-500 to-purple-500"
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized performance for smooth drawing and collaboration experience.",
    gradient: "from-yellow-400 to-orange-500"
  },
  {
    icon: Palette,
    title: "Color Palette",
    description: "Extensive color options with custom palettes and gradient tools.",
    gradient: "from-rose-500 to-pink-500"
  },
  {
    icon: Lock,
    title: "Secure & Private",
    description: "Enterprise-grade security with end-to-end encryption for your data.",
    gradient: "from-gray-500 to-slate-600"
  }
]

export function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="features" className="py-24 bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-purple-500/5" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 gradient-text">
            Powerful Features for Every Creator
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to bring your ideas to life and collaborate effectively
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <div className="card-premium feature-card-glow p-8 h-full">
                  {/* Icon with Gradient Background */}
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>

                  <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Hover Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`} />
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-20"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <div className="bg-gradient-to-r from-primary via-purple-500 to-blue-500 p-[2px] rounded-2xl">
              <div className="bg-background rounded-2xl px-12 py-8">
                <h3 className="text-2xl font-bold mb-4 gradient-text">
                  Ready to Transform Your Workflow?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Join thousands of teams already creating magic together
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-premium px-8 py-3 rounded-lg"
                  >
                    Start Free Trial
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-3 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    View Pricing
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}