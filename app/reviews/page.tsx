import type { Metadata } from "next";
import { ReviewsPage } from "@/components/ReviewsPage";

export const metadata: Metadata = {
  title: "Reviews — ProofDrop",
  description:
    "Real, unedited reviews from ProofDrop users. Read what people proved, what worked, and what features they want next.",
};

export default function Page() {
  return <ReviewsPage />;
}
