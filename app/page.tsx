import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { ArrowRight, Sparkles, Orbit, Layers3, BarChart3 } from "lucide-react"

const services = [
  {
    slug: "bazi",
    title: "BaZi Astrology",
    description:
      "Explore your destiny with BaZi, the ancient Chinese art of astrology. Understand your personality, strengths, and life path.",
    icon: <BarChart3 className="h-8 w-8 mb-2 text-primary" />,
  },
  {
    slug: "natal-chart",
    title: "Natal Chart Readings",
    description:
      "Uncover the celestial map of your life. Our natal chart readings provide deep insights into your potential and purpose.",
    icon: <Orbit className="h-8 w-8 mb-2 text-primary" />,
  },
  {
    slug: "tarot",
    title: "Tarot Card Readings",
    description:
      "Seek guidance and clarity with a personalized Tarot reading. Explore your questions and gain new perspectives.",
    icon: <Layers3 className="h-8 w-8 mb-2 text-primary" />,
  },
  {
    slug: "daily-horoscope",
    title: "Daily Horoscopes",
    description:
      "Get your daily dose of cosmic wisdom. Our horoscopes offer guidance and predictions for your zodiac sign.",
    icon: <Sparkles className="h-8 w-8 mb-2 text-primary" />,
  },
]

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16 lg:py-20">
      <section className="text-center mb-12 md:mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">Unlock Your Destiny</h1>
        <p className="mt-4 text-lg text-muted-foreground md:text-xl">
          Discover insights and guidance through our mystical services.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((service) => (
          <Card key={service.slug} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">{service.icon}</div>
              <CardTitle className="text-center">{service.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription className="text-center">{service.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`/${service.slug}`}>
                  Get Reading <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </section>
    </div>
  )
}
