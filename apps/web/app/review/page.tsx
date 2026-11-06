import { REVIEWS_REQUIRED } from "@bind/core";
import { ReviewQueue } from "./ReviewQueue";

export const metadata = { title: "Review", robots: { index: false } };

export default function Review() {
  return (
    <div className="wrap page">
      <header className="page-head">
        <h1 className="page-title">Review</h1>
        <div className="page-stats">
          <div className="page-stat">
            <b>{REVIEWS_REQUIRED}</b>
            <span>Reviews To Decide</span>
          </div>
        </div>
      </header>
      <ReviewQueue />
    </div>
  );
}
