"use client";

import { use } from "react";
import QuizRenderer from "@/components/QuizRenderer";

export default function QuizByIdPage({ params }) {
  const { quizId } = use(params);
  return <QuizRenderer quizId={quizId} />;
}
