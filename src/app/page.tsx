import Home from "./(routes)/home/page";
import { Analytics } from "@vercel/analytics/react"

export default function main() {
  return (
      <div>
        <Analytics/>
          <Home />
      </div>
  );
}