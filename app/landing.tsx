"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import {
  Menu,
  X,
  Palette,
  ArrowRight,
  Play,
  PenTool,
  Square,
  Circle,
  Type,
  StickyNote,
  Users,
  Cloud,
  Zap,
  Share2,
  Download,
  Lock,
  Star,
  Quote,
  Mail,
  MapPin,
  Phone,
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Sun,
  Moon,
} from "lucide-react";
import { redirect } from "next/navigation";
import WatchDemo from "./components/WatchDemo";

// Button Component with variants
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "premium"
    | "hero"
    | "glass";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  className = "",
  variant = "default",
  size = "default",
  children,
  ...props
}) => {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-red-500 text-white hover:bg-red-600",
    outline:
      "border border-gray-300 bg-background hover:bg-gray-50 hover:text-gray-900",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    ghost: "hover:bg-gray-100 hover:text-gray-900",
    link: "text-primary underline-offset-4 hover:underline",
    premium: "btn-premium text-white hover:scale-105 shadow-lg",
    hero: "relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl",
    glass:
      "relative bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-300",
  };

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
type Theme = "light" | "dark" | null;
// Theme Toggle Component
function ThemeToggle() {
  // start with null (unknown) to avoid using window during SSR render
  const [theme, setTheme] = useState<Theme>(null);

  // Read persisted theme (or system) on first client render
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cw_theme");
      if (saved === "light" || saved === "dark") {
        setTheme(saved);
      } else {
        // no saved preference -> follow system
        const prefersDark =
          typeof window !== "undefined" &&
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches;
        setTheme(prefersDark ? "dark" : "light");
      }
    } catch (err) {
      // if access to localStorage fails, default to light
      setTheme("light");
    }
  }, []);

  // Whenever theme changes, apply it to the document and persist it
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      try {
        localStorage.setItem("cw_theme", "dark");
      } catch {}
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
      try {
        localStorage.setItem("cw_theme", "light");
      } catch {}
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const Icon = theme === "dark" ? Sun : Moon; // show opposite icon meaning: click to switch
  const label =
    theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      onClick={toggleTheme}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

// Header Component
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: "Features", href: "#features" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "Pricing", href: "#pricing" },
  ];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 z-50 w-full bg-black/80 backdrop-blur-md border-b border-border/40"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Palette className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">CollabBoard</span>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => (
              <motion.a
                key={item.name}
                href={item.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                className="text-muted-foreground hover:text-foreground transition-colors relative group"
              >
                {item.name}
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </motion.a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className={`hidden md:flex items-center space-x-4`}>
            <ThemeToggle />
            <Button variant="link" onClick={() =>{
                      redirect('/auth/signin')
                  }}>Log In</Button>
            <Button variant="premium"
                onClick={() =>{
                    redirect('/dashboard')
                }}
            >Get Started</Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2 md:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <motion.div
          initial={false}
          animate={{
            height: isMenuOpen ? "auto" : 0,
            opacity: isMenuOpen ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden md:hidden"
        >
          <div className="pb-4 pt-2 space-y-4">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="block text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </a>
            ))}
            <div className="flex flex-col space-y-2 pt-4">
              <Button variant="ghost" className="justify-start"
                  onClick={() =>{
                      redirect('/auth/signin')
                  }}
              >
                Log In
              </Button>
              <Button variant="premium" className="justify-start" onClick={() =>{
                  redirect('/dashboard')
              }}>
                Get Started
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
};

// Hero Component
const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 hero-section" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 8 + i,
              repeat: Infinity,
              delay: i * 2,
            }}
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`,
            }}
          />
        ))}
      </div>

      <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-sm text-white mb-8"
          >
            <span className="mr-2">🎨</span>
            Introducing the future of collaboration
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight"
          >
            Create, Collaborate,
            <br />
            <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
              Innovate Together
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl sm:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            The most intuitive collaborative whiteboard for teams. Draw, design,
            and brainstorm in real-time with powerful tools and seamless
            sharing.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Button
              variant="hero"
              size="lg"
              className="text-lg px-10 py-6 group"
              onClick={() =>{
                      redirect('/dashboard')
                  }}
            >
              Start Creating Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              variant="glass"
              size="lg"
              className="text-lg px-10 py-6 group"
              
            >
              <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-3 gap-8 mt-20 max-w-2xl mx-auto"
          >
            {[
              { value: "50K+", label: "Active Users" },
              { value: "1M+", label: "Boards Created" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-white/60 text-sm">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-3 bg-white/50 rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

// Features Component
const Features = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      icon: PenTool,
      title: "Freehand Drawing",
      description:
        "Express your ideas naturally with our advanced pen tool and pressure sensitivity.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Square,
      title: "Shape Tools",
      description:
        "Perfect rectangles, squares, and custom shapes with precision and style.",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Circle,
      title: "Circle & Ellipse",
      description:
        "Create perfect circles and ellipses for diagrams, flowcharts, and designs.",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: Type,
      title: "Text Editor",
      description:
        "Rich text editing with multiple fonts, sizes, and formatting options.",
      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: StickyNote,
      title: "Sticky Notes",
      description:
        "Add colorful sticky notes for brainstorming and organizing thoughts.",
      gradient: "from-yellow-500 to-amber-500",
    },
    {
      icon: Users,
      title: "Real-time Collaboration",
      description:
        "Work together seamlessly with live cursors and instant updates.",
      gradient: "from-indigo-500 to-blue-500",
    },
    {
      icon: Cloud,
      title: "Cloud Sync",
      description:
        "Access your work anywhere with automatic cloud synchronization.",
      gradient: "from-teal-500 to-green-500",
    },
    {
      icon: Share2,
      title: "Easy Sharing",
      description:
        "Share boards with teams or clients with customizable permissions.",
      gradient: "from-pink-500 to-rose-500",
    },
    {
      icon: Download,
      title: "Export Options",
      description:
        "Export your creations in multiple formats including PNG, SVG, and PDF.",
      gradient: "from-violet-500 to-purple-500",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description:
        "Optimized performance for smooth drawing and collaboration experience.",
      gradient: "from-yellow-400 to-orange-500",
    },
    {
      icon: Palette,
      title: "Color Palette",
      description:
        "Extensive color options with custom palettes and gradient tools.",
      gradient: "from-rose-500 to-pink-500",
    },
    {
      icon: Lock,
      title: "Secure & Private",
      description:
        "Enterprise-grade security with end-to-end encryption for your data.",
      gradient: "from-gray-500 to-slate-600",
    },
  ];

  return (
    <section
      id="features"
      className="py-24 bg-background relative overflow-hidden"
    >
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
            Everything you need to bring your ideas to life and collaborate
            effectively
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
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
                  <div
                    className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="h-8 w-8 text-white" />
                  </div>

                  <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Hover Gradient Overlay */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`}
                  />
                </div>
              </motion.div>
            );
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
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-[2px] rounded-2xl">
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
                    onClick={() =>{
                        redirect('/dashboard')
                    }}
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
  );
};

// Testimonials Component
const Testimonials = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Design Lead at TechCorp",
      avatar: "/api/placeholder/64/64",
      content:
        "CollabBoard has revolutionized how our design team collaborates. The real-time features are incredible!",
      rating: 5,
      company: "TechCorp",
    },
    {
      name: "Michael Rodriguez",
      role: "Product Manager",
      avatar: "/api/placeholder/64/64",
      content:
        "The intuitive interface and powerful tools make brainstorming sessions so much more productive.",
      rating: 5,
      company: "InnovateLab",
    },
    {
      name: "Emily Watson",
      role: "UX Designer",
      avatar: "/api/placeholder/64/64",
      content:
        "I love how easy it is to export our work and share it with clients. Game-changer for our workflow!",
      rating: 5,
      company: "DesignStudio",
    },
    {
      name: "David Kim",
      role: "Engineering Manager",
      avatar: "/api/placeholder/64/64",
      content:
        "The collaboration features are outstanding. Our remote team feels more connected than ever.",
      rating: 5,
      company: "DevTeam",
    },
    {
      name: "Lisa Thompson",
      role: "Creative Director",
      avatar: "/api/placeholder/64/64",
      content:
        "CollabBoard's drawing tools are incredibly responsive. It feels just like drawing on paper.",
      rating: 5,
      company: "CreativeAgency",
    },
    {
      name: "James Wilson",
      role: "Startup Founder",
      avatar: "/api/placeholder/64/64",
      content:
        "Perfect for our startup's brainstorming sessions. The free tier is generous and the paid features are worth it.",
      rating: 5,
      company: "StartupVenture",
    },
  ];

  return (
    <section id="testimonials" className="py-24 bg-muted/30" ref={ref}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 gradient-text">
            Loved by Teams Worldwide
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            See what our users have to say about their experience with
            CollabBoard
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="card-premium p-8 h-full">
                {/* Rating Stars */}
                <div className="flex items-center mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>

                {/* Quote */}
                <div className="relative mb-6">
                  <Quote className="absolute -top-2 -left-2 h-8 w-8 text-primary/20" />
                  <p className="text-lg leading-relaxed pl-6">
                    {testimonial.content}
                  </p>
                </div>

                {/* User Info */}
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-semibold text-lg mr-4">
                    {testimonial.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                    <div className="text-xs text-primary">
                      {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 text-center"
        >
          {[
            { value: "10,000+", label: "Happy Users" },
            { value: "4.9/5", label: "User Rating" },
            { value: "99.9%", label: "Uptime" },
            { value: "24/7", label: "Support" },
          ].map((stat, index) => (
            <div key={index}>
              <div className="text-3xl font-bold gradient-text">
                {stat.value}
              </div>
              <div className="text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// Footer Component
const Footer = () => {
  return (
    <footer className="bg-background border-t border-border/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <Palette className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">
                CollabBoard
              </span>
            </div>
            <p className="text-muted-foreground">
              The most intuitive collaborative whiteboard for teams to create,
              collaborate, and innovate together.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Github className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Linkedin className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Instagram className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Templates
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Integrations
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  API
                </a>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Press
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Community
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-border/40 mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div>
              <h3 className="font-semibold mb-2">Stay Updated</h3>
              <p className="text-sm text-muted-foreground">
                Get the latest updates, tips, and exclusive features delivered
                to your inbox.
              </p>
            </div>
            <div className="flex space-x-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-64 px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Button variant="premium">Subscribe</Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/40 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <p className="text-sm text-muted-foreground">
            © 2024 CollabBoard. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              San Francisco, CA
            </span>
            <span className="flex items-center">
              <Mail className="h-4 w-4 mr-1" />
              hello@collabboard.com
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Main Landing Page Component
const LandingPage = () => {
  useEffect(() => {
    // Add CSS for animations and styles
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      
      :root {
        --background: 0 0% 100%;
        --foreground: 222 47% 11%;
        --card: 0 0% 100%;
        --card-foreground: 222 47% 11%;
        --popover: 0 0% 100%;
        --popover-foreground: 222 47% 11%;
        --primary: 262 87% 56%;
        --primary-foreground: 0 0% 100%;
        --secondary: 220 13% 96%;
        --secondary-foreground: 222 47% 11%;
        --muted: 220 13% 96%;
        --muted-foreground: 215 16% 47%;
        --accent: 220 13% 96%;
        --accent-foreground: 222 47% 11%;
        --destructive: 0 84% 60%;
        --destructive-foreground: 0 0% 98%;
        --border: 220 13% 91%;
        --input: 220 13% 91%;
        --ring: 262 87% 56%;
        --radius: 0.75rem;
        --gradient-primary: linear-gradient(135deg, hsl(262 87% 56%), hsl(292 87% 66%));
        --gradient-secondary: linear-gradient(135deg, hsl(220 100% 70%), hsl(200 100% 80%));
        --gradient-accent: linear-gradient(135deg, hsl(340 75% 65%), hsl(360 85% 75%));
        --gradient-hero: linear-gradient(135deg, hsl(262 87% 56%) 0%, hsl(292 87% 66%) 50%, hsl(220 100% 70%) 100%);
        --gradient-card: linear-gradient(145deg, hsl(0 0% 100% / 0.05), hsl(0 0% 100% / 0.02));
        --shadow-glow: 0 0 40px hsl(262 87% 56% / 0.15);
        --shadow-premium: 0 20px 40px -12px hsl(262 87% 56% / 0.25);
        --shadow-card: 0 4px 20px hsl(262 87% 56% / 0.08);
        --transition-premium: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .dark {
        --background: 224 71% 4%;
        --foreground: 213 31% 91%;
        --card: 224 71% 4%;
        --card-foreground: 213 31% 91%;
        --popover: 224 71% 4%;
        --popover-foreground: 213 31% 91%;
        --primary: 262 87% 56%;
        --primary-foreground: 0 0% 100%;
        --secondary: 216 34% 17%;
        --secondary-foreground: 213 31% 91%;
        --muted: 216 34% 17%;
        --muted-foreground: 218 11% 65%;
        --accent: 216 34% 17%;
        --accent-foreground: 213 31% 91%;
        --destructive: 0 63% 31%;
        --destructive-foreground: 213 31% 91%;
        --border: 216 34% 17%;
        --input: 216 34% 17%;
        --ring: 262 87% 56%;
        --gradient-primary: linear-gradient(135deg, hsl(262 87% 56%), hsl(292 87% 66%));
        --gradient-secondary: linear-gradient(135deg, hsl(220 100% 70%), hsl(200 100% 80%));
        --gradient-accent: linear-gradient(135deg, hsl(340 75% 65%), hsl(360 85% 75%));
        --gradient-hero: linear-gradient(135deg, hsl(262 87% 56%) 0%, hsl(292 87% 66%) 50%, hsl(220 100% 70%) 100%);
        --gradient-card: linear-gradient(145deg, hsl(0 0% 100% / 0.08), hsl(0 0% 100% / 0.02));
        --shadow-glow: 0 0 40px hsl(262 87% 56% / 0.3);
        --shadow-premium: 0 20px 40px -12px hsl(262 87% 56% / 0.4);
        --shadow-card: 0 4px 20px hsl(262 87% 56% / 0.12);
      }

      * {
        border-color: hsl(var(--border));
      }

      body {
        background-color: hsl(var(--background));
        color: hsl(var(--foreground));
        font-family: 'Inter', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      html {
        scroll-behavior: smooth;
      }

      .gradient-text {
        background: linear-gradient(to right, hsl(var(--primary)), hsl(292 87% 66%), hsl(220 100% 70%));
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .card-premium {
        position: relative;
        overflow: hidden;
        border-radius: 1rem;
        border: 1px solid hsl(var(--border) / 0.5);
        background: hsl(var(--card) / 0.5);
        backdrop-filter: blur(12px);
        box-shadow: var(--shadow-card);
        transition: var(--transition-premium);
      }

      .card-premium:hover {
        transform: scale(1.02);
        border-color: hsl(var(--primary) / 0.2);
        box-shadow: var(--shadow-premium);
        background: var(--gradient-card);
      }

      .btn-premium {
        position: relative;
        overflow: hidden;
        border-radius: 0.75rem;
        padding: 1rem 2rem;
        font-weight: 600;
        transition: all 0.3s ease;
        background: var(--gradient-primary);
        box-shadow: var(--shadow-glow);
      }

      .btn-premium:hover {
        transform: scale(1.05);
        box-shadow: var(--shadow-premium);
      }

      .hero-section {
        background: var(--gradient-hero);
        background-size: 400% 400%;
        animation: gradient-shift 8s ease-in-out infinite;
      }

      @keyframes gradient-shift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }

      .feature-card-glow {
        position: relative;
      }

      .feature-card-glow::before {
        content: '';
        position: absolute;
        inset: 0;
        padding: 2px;
        background: var(--gradient-primary);
        border-radius: inherit;
        opacity: 0;
        transition: var(--transition-premium);
        mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        mask-composite: xor;
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
      }

      .feature-card-glow:hover::before {
        opacity: 1;
      }

      .container {
        max-width: 1200px;
        margin-left: auto;
        margin-right: auto;
      }

      .bg-background { background-color: hsl(var(--background)); }
      .text-foreground { color: hsl(var(--foreground)); }
      .text-muted-foreground { color: hsl(var(--muted-foreground)); }
      .text-primary { color: hsl(var(--primary)); }
      .bg-primary { background-color: hsl(var(--primary)); }
      .text-primary-foreground { color: hsl(var(--primary-foreground)); }
      .border-border { border-color: hsl(var(--border)); }
      .bg-accent { background-color: hsl(var(--accent)); }
      .hover\\:bg-accent:hover { background-color: hsl(var(--accent)); }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <Features />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
