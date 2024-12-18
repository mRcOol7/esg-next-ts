import Home from "./(routes)/home/page";
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

export default function main() {
  return (
      <div>
        <Analytics/>
        <SpeedInsights />
          <Home />
      </div>
  );
}